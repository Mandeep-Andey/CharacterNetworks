import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, ActionIcon, Tooltip as MantineTooltip } from '@mantine/core';
import { IconFocusCentered } from '@tabler/icons-react';
import * as d3 from 'd3';
import { Node, Link } from '../../context/DataContext';
import { useSelection } from '../../context/SelectionContext';
import { useControls } from '../../context/ControlsContext';
import GraphBreadcrumbs from './GraphBreadcrumbs';
import GraphTooltip from './GraphTooltip';
import GraphStats from './GraphStats';
import { debounce } from '../../utils/debounce';
import { D3ForceGraphProps } from './types';
import {
    LINK_DISTANCE,
    CHARGE_MULTIPLIER,
    ZOOM_MIN,
    ZOOM_MAX,
    NODE_STROKE_WIDTH,
    LINK_STROKE_OPACITY,
    COMMUNITY_COLORS
} from './constants';
import {
    nodeRadius,
    computeNodeOpacity,
    computeLabelOpacity
} from './graphUtils';

const D3ForceGraph: React.FC<D3ForceGraphProps> = ({
    nodes,
    links,
    width = 800,
    height = 600,
    forceStrength = 50
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const { setSelectedNode, selectedNode } = useSelection();
    const { searchTerm } = useControls();

    const [tooltip, setTooltip] = useState<{ x: number, y: number, content: string } | null>(null);
    const [activeCommunity, setActiveCommunity] = useState<string | number | null>(null);

    // Persistent refs for elements and states
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
    const previousNodesRef = useRef<Map<string, any>>(new Map());
    const zoomScaleRef = useRef<number>(1);

    // Debounce ref for hover cleanup
    const debouncedHoverRef = useRef<((...args: unknown[]) => void) & { cancel: () => void } | null>(null);

    // Filtered data (currently just passthrough, but kept for future filter logic)
    const filteredNodes = nodes;
    const filteredLinks = links;

    // ─── Backdrop Reset Callback ────────────────────────────────────────
    const resetView = useCallback(() => {
        setSelectedNode(null);
        setActiveCommunity(null);
        setTooltip(null);

        if (svgRef.current && zoomRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).call(
                zoomRef.current.transform as any,
                d3.zoomIdentity
            );
        }
    }, [setSelectedNode]);

    // ─── Center View Callback ───────────────────────────────────────────
    const centerView = useCallback(() => {
        if (svgRef.current && zoomRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).call(
                zoomRef.current.transform as any,
                d3.zoomIdentity
            );
        }
    }, []);

    // ─── Esc Key Handler (Simulation Auto-Pause + Reset) ────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (simulationRef.current) {
                    simulationRef.current.stop();
                }
                resetView();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [resetView]);

    // ─── Validate Selection ─────────────────────────────────────────────
    useEffect(() => {
        if (selectedNode) {
            const nodeExists = filteredNodes.some(n => n.id === selectedNode.id);
            if (!nodeExists) {
                setSelectedNode(null);
                setActiveCommunity(null);
            }
        }
    }, [filteredNodes, selectedNode, setSelectedNode]);

    // ─── Main D3 Effect ─────────────────────────────────────────────────
    useEffect(() => {
        if (!svgRef.current || filteredNodes.length === 0) return;

        const svg = d3.select(svgRef.current);

        // 1. Initialization of SVG Layers
        let container = svg.select<SVGGElement>("g.graph-container");
        if (container.empty()) {
            container = svg.append("g").attr("class", "graph-container");
            container.append("g").attr("class", "link-group").attr("stroke", "#999").attr("stroke-opacity", LINK_STROKE_OPACITY);
            container.append("g").attr("class", "node-group").attr("stroke", "#fff").attr("stroke-width", NODE_STROKE_WIDTH);
            container.append("g").attr("class", "label-group");

            const zoom = d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([ZOOM_MIN, ZOOM_MAX])
                .translateExtent([[-width / 2, -height / 2], [width * 1.5, height * 1.5]]);

            zoomRef.current = zoom;
            svg.call(zoom);

            svg.on("click", (event) => {
                if (event.target === svgRef.current) resetView();
            });
        } else {
            if (zoomRef.current) {
               zoomRef.current.translateExtent([[-width / 2, -height / 2], [width * 1.5, height * 1.5]]);
            }
        }

        // 2. Zoom Handler
        if (zoomRef.current) {
            zoomRef.current.on("zoom", (event) => {
                zoomScaleRef.current = event.transform.k;
                container.attr("transform", event.transform);
                
                const k = event.transform.k;
                const fontSize = k < 1 ? 12 : Math.max(9, 12 / Math.pow(k, 0.6));
                
                container.select(".label-group").selectAll<SVGTextElement, Node>("text:not(.exiting)")
                    .style("font-size", `${fontSize}px`)
                    .attr("opacity", (d: any) => computeLabelOpacity(d, activeCommunity, selectedNode, filteredLinks, k));
            });
        }

        // 3. Community Centers Calculation
        const groupKeys = Array.from(new Set(filteredNodes.map((d: any) => d.groupName || d.community || 'Unknown')));
        const groupCount = groupKeys.length;
        const communityCenters: { [key: string]: { x: number, y: number } } = {};
        const radius = Math.min(width, height) * 0.35;
        groupKeys.forEach((key, i) => {
            const angle = (i / groupCount) * 2 * Math.PI;
            communityCenters[key] = {
                x: width / 2 + Math.cos(angle) * radius,
                y: height / 2 + Math.sin(angle) * radius
            };
        });

        // 4. Preserve Node Positions
        filteredNodes.forEach((node: any) => {
            const prev = previousNodesRef.current.get(node.id);
            if (prev) {
                Object.assign(node, prev);
            } else {
                const key = node.groupName || node.community || 'Unknown';
                const c = communityCenters[key];
                node.x = c ? c.x : width / 2;
                node.y = c ? c.y : height / 2;
            }
        });

        // 5. Force Simulation Setup
        const chargeStrength = -(forceStrength * CHARGE_MULTIPLIER);
        const linksForD3 = filteredLinks as unknown as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[];
        const nodesForD3 = filteredNodes as unknown as d3.SimulationNodeDatum[];
        
        const simulation = d3.forceSimulation(nodesForD3)
            .force("link", d3.forceLink(linksForD3).id((d) => (d as any).id).distance(LINK_DISTANCE))
            .force("charge", d3.forceManyBody().strength(chargeStrength))
            .force("collide", d3.forceCollide().radius((d: any) => nodeRadius(d) + 15).iterations(2))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX((d: any) => communityCenters[d.groupName || d.community || 'Unknown']?.x || width / 2).strength(0.08))
            .force("y", d3.forceY((d: any) => communityCenters[d.groupName || d.community || 'Unknown']?.y || height / 2).strength(0.08));

        simulationRef.current = simulation;
        simulation.on("end", () => simulation.stop());

        // 6. Rendering: Links
        const link = renderLinks(container, filteredLinks, filteredNodes, selectedNode);

        // 7. Rendering: Nodes
        const debouncedShowTooltip = debounce((...args: unknown[]) => {
            const event = args[0] as MouseEvent;
            const d = args[1] as { id: string; community?: number; groupName?: string };
            setTooltip({ 
                x: event.clientX, 
                y: event.clientY, 
                content: `${d.id} (Group ${d.groupName || d.community || 'Unknown'})` 
            });
            d3.select(event.currentTarget as Element).attr("stroke", "#333").attr("stroke-width", 3)
                .transition().duration(200).attr("r", nodeRadius(d) + 3);
        }, 120);
        debouncedHoverRef.current = debouncedShowTooltip;

        const node = renderNodes(
            container, 
            filteredNodes, 
            activeCommunity, 
            setActiveCommunity, 
            setSelectedNode, 
            debouncedShowTooltip, 
            setTooltip, 
            simulation
        );

        // 8. Rendering: Labels
        const label = renderLabels(container, filteredNodes, activeCommunity, selectedNode, filteredLinks, zoomScaleRef.current);

        // 9. Simulation Tick
        simulation.on("tick", () => {
            link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
            node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
            label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
        });

        return () => {
            filteredNodes.forEach((n: any) => {
                previousNodesRef.current.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy, fx: n.fx, fy: n.fy });
            });
            simulation.stop();
            simulationRef.current = null;
            if (debouncedHoverRef.current) debouncedHoverRef.current.cancel();
        };
    }, [filteredNodes, filteredLinks, width, height, forceStrength, setSelectedNode, resetView]);

    // ─── Rendering Helpers ──────────────────────────────────────────
    const renderLinks = (
        container: d3.Selection<SVGGElement, unknown, null, undefined>,
        links: Link[],
        nodes: Node[],
        selectedNode: Node | null
    ) => {
        return container.select("g.link-group").selectAll<SVGLineElement, Link>("line")
            .data(links, (d: any) => {
                const sId = typeof d.source === 'object' ? d.source.id : d.source;
                const tId = typeof d.target === 'object' ? d.target.id : d.target;
                return `${sId}-${tId}`;
            })
            .join(
                enter => enter.append("line")
                    .attr("stroke-width", (d) => Math.sqrt(d.value) * 1.5)
                    .attr("stroke", (d: any) => {
                        const sId = typeof d.source === 'object' ? d.source.id : d.source;
                        const tId = typeof d.target === 'object' ? d.target.id : d.target;
                        return selectedNode && (sId === selectedNode.id || tId === selectedNode.id) ? "#e74c3c" : "#bdc3c7";
                    })
                    .attr("opacity", 0)
                    .call(sel => sel.transition().duration(400).attr("opacity", (d: any) => {
                        const sId = typeof d.source === 'object' ? d.source.id : d.source;
                        const tId = typeof d.target === 'object' ? d.target.id : d.target;
                        const sComm = nodes.find(n => n.id === sId)?.community;
                        const tComm = nodes.find(n => n.id === tId)?.community;
                        return sComm !== tComm ? 0.2 : 0.6;
                    })),
                update => update,
                exit => exit.call(e => e.classed("exiting", true).transition().duration(400).attr("opacity", 0).remove())
            );
    };

    const renderNodes = (
        container: d3.Selection<SVGGElement, unknown, null, undefined>,
        nodes: Node[],
        activeCommunity: string | number | null,
        setActiveCommunity: (c: string | number) => void,
        setSelectedNode: (n: Node | null) => void,
        debouncedShowTooltip: any,
        setTooltip: any,
        simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>
    ) => {
        return container.select("g.node-group").selectAll<SVGCircleElement, Node>("circle")
            .data(nodes, (d: any) => d.id)
            .join(
                enter => enter.append("circle")
                    .attr("r", 0).attr("opacity", 0)
                    .attr("fill", d => COMMUNITY_COLORS[(d.community || 0) % COMMUNITY_COLORS.length])
                    .attr("cursor", "grab")
                    .call(sel => sel.transition().duration(500).attr("r", (d: any) => nodeRadius(d))),
                update => update.call(sel => sel.transition().duration(400).attr("r", (d: any) => nodeRadius(d))),
                exit => exit.call(e => e.classed("exiting", true).transition().duration(400).attr("opacity", 0).remove())
            )
            .on("click", (event, d: any) => {
                event.stopPropagation();
                const key = d.groupName || d.community || 0;
                if (activeCommunity === null || activeCommunity !== key) {
                    setActiveCommunity(key);
                }
                setSelectedNode(d as Node);
            })
            .on("mouseover", (event, d) => debouncedShowTooltip(event, d))
            .on("mousemove", event => setTooltip((prev: any) => prev ? { ...prev, x: event.pageX, y: event.pageY } : null))
            .on("mouseout", (event, d) => {
                debouncedShowTooltip.cancel();
                setTooltip(null);
                d3.select(event.currentTarget).attr("stroke", "#fff").attr("stroke-width", 1.5)
                    .transition().duration(200).attr("r", nodeRadius(d));
            })
            .on("dblclick", (event, d: any) => {
                event.stopPropagation();
                d.fx = null; d.fy = null;
                simulation.alphaTarget(0.3).restart();
                setTimeout(() => simulation.alphaTarget(0), 1000);
            })
            .call(d3.drag<SVGCircleElement, any>()
                .on("start", (event) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x; event.subject.fy = event.subject.y;
                    if (event.sourceEvent && event.sourceEvent.target) {
                        d3.select(event.sourceEvent.target).attr("cursor", "grabbing");
                    }
                })
                .on("drag", (event) => {
                    event.subject.fx = event.x; event.subject.fy = event.y;
                })
                .on("end", (event) => {
                    if (!event.active) simulation.alphaTarget(0);
                    if (event.sourceEvent && event.sourceEvent.target) {
                        d3.select(event.sourceEvent.target).attr("cursor", "grab");
                    }
                }) as any);
    };

    const renderLabels = (
        container: d3.Selection<SVGGElement, unknown, null, undefined>,
        nodes: Node[],
        activeCommunity: string | number | null,
        selectedNode: Node | null,
        links: Link[],
        zoomScale: number
    ) => {
        return container.select("g.label-group").selectAll<SVGTextElement, Node>("text")
            .data(nodes, (d: any) => d.id)
            .join(
                enter => enter.append("text")
                    .attr("dx", 12).attr("dy", ".35em").text(d => d.id)
                    .style("font-family", "var(--mantine-font-family)")
                    .style("font-size", () => `${zoomScaleRef.current < 1 ? 12 : Math.max(9, 12 / Math.pow(zoomScaleRef.current, 0.6))}px`)
                    .style("font-weight", "700")
                    .style("pointer-events", "none")
                    .attr("stroke", "rgba(255, 255, 255, 0.95)")
                    .attr("stroke-width", 3)
                    .attr("stroke-linejoin", "round")
                    .attr("paint-order", "stroke")
                    .attr("fill", "#111")
                    .attr("opacity", 0)
                    .call(sel => sel.transition().duration(500).attr("opacity", (d: any) => computeLabelOpacity(d, activeCommunity, selectedNode, links, zoomScale))),
                update => update.call(sel => sel.transition().duration(400).attr("opacity", (d: any) => computeLabelOpacity(d, activeCommunity, selectedNode, links, zoomScale))),
                exit => exit.call(e => e.classed("exiting", true).transition().duration(400).attr("opacity", 0).remove())
            );
    };

    // ─── Visual Updates Effect ────────────────────────────────────────
    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        const groupKeys = Array.from(new Set(filteredNodes.map((d: any) => d.groupName || d.community || 'Unknown')));
        
        svg.selectAll<SVGCircleElement, any>("g.node-group circle:not(.exiting)")
            .transition("visuals").duration(400)
            .attr("opacity", d => computeNodeOpacity(d, activeCommunity, searchTerm, selectedNode, filteredLinks))
            .attr("fill", (d: any) => {
                const key = d.groupName || d.community || 'Unknown';
                const groupIdx = groupKeys.indexOf(key);
                const baseColor = COMMUNITY_COLORS[Math.max(0, groupIdx) % COMMUNITY_COLORS.length];
                const currentKey = d.groupName || d.community || 0;
                if (activeCommunity !== null && currentKey === activeCommunity) {
                    const color = d3.color(baseColor);
                    if (color) {
                        const interpolator = d3.interpolateRgb(color.brighter(1.5).formatHex(), color.darker(2).formatHex());
                        return interpolator(Math.min(Math.max((d.degree || 0) / 25, 0), 1));
                    }
                }
                return baseColor;
            });

        svg.selectAll<SVGLineElement, any>("g.link-group line:not(.exiting)")
            .transition("visuals").duration(400)
            .attr("stroke", (d: any) => {
                const sId = typeof d.source === 'object' ? d.source.id : d.source;
                const tId = typeof d.target === 'object' ? d.target.id : d.target;
                return selectedNode && (sId === selectedNode.id || tId === selectedNode.id) ? "#e74c3c" : "#bdc3c7";
            })
            .attr("opacity", (d: any) => {
                const sId = typeof d.source === 'object' ? d.source.id : d.source;
                const tId = typeof d.target === 'object' ? d.target.id : d.target;
                const sComm = filteredNodes.find(n => n.id === sId)?.community;
                const tComm = filteredNodes.find(n => n.id === tId)?.community;
                return sComm !== tComm ? 0.2 : 0.6;
            });

        svg.selectAll<SVGTextElement, any>("g.label-group text:not(.exiting)")
            .transition("visuals").duration(400)
            .attr("opacity", d => computeLabelOpacity(d, activeCommunity, selectedNode, filteredLinks, zoomScaleRef.current));

    }, [activeCommunity, searchTerm, selectedNode, filteredLinks, filteredNodes]);

    // ─── Zoom to Community Effect ──────────────────────────────────────
    useEffect(() => {
        if (!svgRef.current || !zoomRef.current) return;
        const svg = d3.select(svgRef.current);

        if (activeCommunity !== null) {
            const communityNodes = filteredNodes.filter(n => (n.groupName || n.community || 0) === activeCommunity);
            if (communityNodes.length === 0) {
                svg.transition().duration(750).call(zoomRef.current.transform as any, d3.zoomIdentity);
                return;
            }

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            communityNodes.forEach((n: any) => {
                if (n.x === undefined || n.y === undefined) return;
                minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
                maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
            });

            const padding = 50;
            const boxWidth = maxX - minX + padding * 2;
            const boxHeight = maxY - minY + padding * 2;
            const scale = Math.min(8, 0.9 / Math.max(boxWidth / width, boxHeight / height));

            svg.transition().duration(750).call(
                zoomRef.current.transform as any,
                d3.zoomIdentity.translate(width / 2, height / 2).scale(scale).translate(-(minX + maxX) / 2, -(minY + maxY) / 2)
            );
        } else {
            svg.transition().duration(750).call(zoomRef.current.transform as any, d3.zoomIdentity);
        }
    }, [activeCommunity, filteredNodes, width, height]);

    return (
        <Box w="100%" h="100%" pos="relative" bg="transparent">
            <GraphBreadcrumbs activeCommunity={activeCommunity} onReset={() => setActiveCommunity(null)} />
            <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }} />
            
            <MantineTooltip label="Fit to Screen" position="left" withArrow>
                <ActionIcon 
                    variant="default" 
                    size="lg" 
                    radius="md" 
                    pos="absolute" 
                    bottom={16} 
                    right={16} 
                    style={{ zIndex: 10, boxShadow: 'var(--mantine-shadow-sm)' }}
                    onClick={centerView}
                >
                    <IconFocusCentered size={20} stroke={1.5} />
                </ActionIcon>
            </MantineTooltip>

            <GraphTooltip tooltip={tooltip} />
            <GraphStats nodeCount={filteredNodes.length} linkCount={filteredLinks.length} />
        </Box>
    );
};

export default D3ForceGraph;
