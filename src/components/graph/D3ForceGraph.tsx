import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Paper, Text, Box } from '@mantine/core';
import * as d3 from 'd3';
import { Node, Link } from '../../context/DataContext';
import { useSelection } from '../../context/SelectionContext';
import { useControls } from '../../context/ControlsContext';
import GraphBreadcrumbs from './GraphBreadcrumbs';
import { debounce } from '../../utils/debounce';

interface D3ForceGraphProps {
    nodes: Node[];
    links: Link[];
    width?: number;
    height?: number;
    minConnections?: number;
    forceStrength?: number;
}

// Distinct color palette for communities
const COMMUNITY_COLORS = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6',
    '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3',
    '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000'
];

/** Compute node radius from degree */
const nodeRadius = (d: any) => (d.degree ? Math.sqrt(d.degree) * 4 + 4 : 6);

const D3ForceGraph: React.FC<D3ForceGraphProps> = ({
    nodes,
    links,
    width = 800,
    height = 600,
    minConnections = 1,
    forceStrength = 50
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const { setSelectedNode, selectedNode } = useSelection();
    const { searchTerm } = useControls();

    const [tooltip, setTooltip] = useState<{ x: number, y: number, content: string } | null>(null);
    const [activeCommunity, setActiveCommunity] = useState<number | null>(null);

    // Persistent refs for zoom, container, and simulation
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const containerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
    const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);

    // Debounce ref for hover cleanup
    const debouncedHoverRef = useRef<ReturnType<typeof debounce> | null>(null);

    // Filter nodes and links based on minConnections
    const { filteredNodes, filteredLinks } = React.useMemo(() => {
        const activeNodes = nodes.filter(n => (n.degree || 0) >= minConnections);
        const activeNodeIds = new Set(activeNodes.map(n => n.id));
        const activeLinks = links.filter(l => activeNodeIds.has(l.source) && activeNodeIds.has(l.target));

        return { filteredNodes: activeNodes, filteredLinks: activeLinks };
    }, [nodes, links, minConnections]);

    // ─── Backdrop Reset Callback ────────────────────────────────────────
    const resetView = useCallback(() => {
        setSelectedNode(null);
        setActiveCommunity(null);
        setTooltip(null);

        // Smooth zoom reset to identity
        if (svgRef.current && zoomRef.current) {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).call(
                zoomRef.current.transform as any,
                d3.zoomIdentity
            );
        }
    }, [setSelectedNode]);

    // ─── Esc Key Handler (Simulation Auto-Pause + Reset) ────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // Stop simulation
                if (simulationRef.current) {
                    simulationRef.current.stop();
                }
                // Also reset view
                resetView();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [resetView]);

    // ─── Main D3 Effect ─────────────────────────────────────────────────
    useEffect(() => {
        if (!svgRef.current || filteredNodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const container = svg.append("g");
        containerRef.current = container;

        // ── 3. Constrained Panning + Zoom ────────────────────────────
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 8])
            .translateExtent([[-width, -height], [2 * width, 2 * height]])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        zoomRef.current = zoom;
        svg.call(zoom);

        // ── Community Centers Calculation ─────────────────────────────
        const communities = Array.from(new Set(filteredNodes.map(d => d.community || 0)));
        const communityCount = communities.length;
        const communityCenters: { [key: number]: { x: number, y: number } } = {};

        const radius = Math.min(width, height) * 0.35;
        communities.forEach((c, i) => {
            const angle = (i / communityCount) * 2 * Math.PI;
            communityCenters[c] = {
                x: width / 2 + Math.cos(angle) * radius,
                y: height / 2 + Math.sin(angle) * radius
            };
        });

        // ── Force Simulation ─────────────────────────────────────────
        const chargeStrength = -(forceStrength * 30);
        const simulation = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])
            .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance(80))
            .force("charge", d3.forceManyBody().strength(chargeStrength))
            .force("collide", d3.forceCollide().radius((d: any) => nodeRadius(d) + 15).iterations(2))
            .force("x", d3.forceX((d: any) => communityCenters[d.community || 0]?.x || width / 2).strength(0.08))
            .force("y", d3.forceY((d: any) => communityCenters[d.community || 0]?.y || height / 2).strength(0.08));

        simulationRef.current = simulation;

        // ── 4. Simulation Auto-Pause on settle ───────────────────────
        simulation.on("end", () => {
            simulation.stop();
        });

        // ── Rendering: Links ─────────────────────────────────────────
        const linkGroup = container.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6);

        const link = linkGroup.selectAll("line")
            .data(filteredLinks)
            .join(
                enter => enter.append("line")
                    .attr("stroke-width", (d) => Math.sqrt(d.value) * 1.5)
                    .attr("stroke", (d) => {
                        if (selectedNode && (d.source === selectedNode.id || d.target === selectedNode.id ||
                            (d.source as any).id === selectedNode.id || (d.target as any).id === selectedNode.id)) {
                            return "#e74c3c";
                        }
                        return "#bdc3c7";
                    })
                    .attr("opacity", 0)
                    .call(sel => sel.transition().duration(400).attr("opacity", (d: any) => {
                        const sourceNode = filteredNodes.find(n => n.id === (typeof d.source === 'object' ? (d.source as any).id : d.source));
                        const targetNode = filteredNodes.find(n => n.id === (typeof d.target === 'object' ? (d.target as any).id : d.target));
                        if (sourceNode?.community !== targetNode?.community) return 0.2;
                        return 0.6;
                    })),
                update => update,
                exit => exit.transition().duration(400).attr("opacity", 0).remove()
            );

        // ── Rendering: Nodes ─────────────────────────────────────────
        const nodeGroup = container.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        // ── 5. Debounced Hover ────────────────────────────────────────
        const debouncedShowTooltip = debounce((event: MouseEvent, d: any) => {
            setTooltip({
                x: event.clientX,
                y: event.clientY,
                content: `${d.id} (Group ${d.community})`
            });
            d3.select(event.currentTarget as Element)
                .attr("stroke", "#333")
                .attr("stroke-width", 3)
                .transition().duration(200)
                .attr("r", nodeRadius(d) + 3);
        }, 120);
        debouncedHoverRef.current = debouncedShowTooltip;

        // ── 6. Smooth Chapter Transitions (.join lifecycle) ──────────
        const node = nodeGroup.selectAll<SVGCircleElement, Node>("circle")
            .data(filteredNodes, (d: any) => d.id)
            .join(
                enter => enter.append("circle")
                    .attr("r", 0)
                    .attr("opacity", 0)
                    .attr("fill", (d) => {
                        const baseColor = COMMUNITY_COLORS[(d.community || 0) % COMMUNITY_COLORS.length];
                        if (activeCommunity !== null && d.community === activeCommunity) {
                            const color = d3.color(baseColor);
                            if (color) {
                                const interpolator = d3.interpolateRgb(
                                    color.brighter(1.5).formatHex(),
                                    color.darker(2).formatHex()
                                );
                                const t = Math.min(Math.max((d.degree || 0) / 25, 0), 1);
                                return interpolator(t);
                            }
                        }
                        return baseColor;
                    })
                    .attr("cursor", "pointer")
                    .call(sel => sel.transition().duration(500)
                        .attr("r", (d: any) => nodeRadius(d))
                        .attr("opacity", (d: any) => computeNodeOpacity(d, activeCommunity, searchTerm, selectedNode, filteredLinks))
                    ),
                update => update.call(sel => sel.transition().duration(400)
                    .attr("opacity", (d: any) => computeNodeOpacity(d, activeCommunity, searchTerm, selectedNode, filteredLinks))
                ),
                exit => exit.transition().duration(400)
                    .attr("r", 0)
                    .attr("opacity", 0)
                    .remove()
            )
            .on("click", (event, d) => {
                event.stopPropagation();
                if (activeCommunity === null || activeCommunity !== d.community) {
                    setActiveCommunity(d.community || 0);
                }
                setSelectedNode(d as Node);
            })
            .on("mouseover", (event, d) => {
                debouncedShowTooltip(event, d);
            })
            .on("mousemove", (event) => {
                setTooltip(prev => prev ? { ...prev, x: event.pageX, y: event.pageY } : null);
            })
            .on("mouseout", (event, d) => {
                // Cancel pending debounce and immediately hide
                debouncedShowTooltip.cancel();
                setTooltip(null);
                d3.select(event.currentTarget)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .transition().duration(200)
                    .attr("r", nodeRadius(d));
            })
            // ── 2. Sticky Drag Pinning: dblclick to release ──────────
            .on("dblclick", (event, d: any) => {
                event.stopPropagation();
                d.fx = null;
                d.fy = null;
                simulation.alphaTarget(0.3).restart();
                setTimeout(() => simulation.alphaTarget(0), 1000);
            })
            .call(drag(simulation) as any);

        // ── 1. Backdrop Reset (background click) ─────────────────────
        svg.on("click", (event) => {
            // Only fire if click was directly on the SVG background
            if (event.target === svgRef.current) {
                resetView();
            }
        });

        // ── Labels ───────────────────────────────────────────────────
        const labelGroup = container.append("g").attr("class", "labels");

        const label = labelGroup.selectAll<SVGTextElement, Node>("text")
            .data(filteredNodes, (d: any) => d.id)
            .join(
                enter => enter.append("text")
                    .attr("dx", 12)
                    .attr("dy", ".35em")
                    .text((d) => d.id)
                    .style("font-family", "var(--mantine-font-family)")
                    .style("font-size", "12px")
                    .style("font-weight", "600")
                    .style("pointer-events", "none")
                    .style("text-shadow", "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white")
                    .attr("opacity", 0)
                    .call(sel => sel.transition().duration(500)
                        .attr("opacity", (d: any) => computeLabelOpacity(d, activeCommunity, selectedNode, filteredLinks))
                    ),
                update => update.call(sel => sel.transition().duration(400)
                    .attr("opacity", (d: any) => computeLabelOpacity(d, activeCommunity, selectedNode, filteredLinks))
                ),
                exit => exit.transition().duration(400).attr("opacity", 0).remove()
            );

        // ── Simulation Tick ──────────────────────────────────────────
        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);

            label
                .attr("x", (d: any) => d.x)
                .attr("y", (d: any) => d.y);
        });

        // ── 2. Sticky Drag Pinning ──────────────────────────────────
        function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
            function dragstarted(event: any) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event: any) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            // Keep fx/fy set so the node stays pinned where it was dropped
            function dragended(event: any) {
                if (!event.active) simulation.alphaTarget(0);
                // Sticky: do NOT reset fx/fy — node stays pinned
                // User can double-click to release
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        // ── Cleanup ──────────────────────────────────────────────────
        return () => {
            simulation.stop();
            simulationRef.current = null;
            if (debouncedHoverRef.current) {
                debouncedHoverRef.current.cancel();
            }
        };
    }, [filteredNodes, filteredLinks, width, height, forceStrength, searchTerm, selectedNode, setSelectedNode, activeCommunity, resetView]);

    // ─── Handle Zoom to Community Effect ────────────────────────────────
    useEffect(() => {
        if (!svgRef.current || !zoomRef.current) return;
        const svg = d3.select(svgRef.current);

        if (activeCommunity !== null) {
            const communityNodes = filteredNodes.filter(n => n.community === activeCommunity);
            if (communityNodes.length === 0) return;

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            communityNodes.forEach((n: any) => {
                if (n.x === undefined || n.y === undefined) return;
                minX = Math.min(minX, n.x);
                minY = Math.min(minY, n.y);
                maxX = Math.max(maxX, n.x);
                maxY = Math.max(maxY, n.y);
            });

            const padding = 50;
            const boxWidth = maxX - minX + padding * 2;
            const boxHeight = maxY - minY + padding * 2;
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            const scale = Math.min(8, 0.9 / Math.max(boxWidth / width, boxHeight / height));

            svg.transition().duration(750).call(
                zoomRef.current.transform as any,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(scale)
                    .translate(-centerX, -centerY)
            );
        } else {
            svg.transition().duration(750).call(
                zoomRef.current.transform as any,
                d3.zoomIdentity
            );
        }
    }, [activeCommunity, filteredNodes, width, height]);

    return (
        <Box w="100%" h="100%" pos="relative" bg="transparent">
            <GraphBreadcrumbs
                activeCommunity={activeCommunity}
                onReset={() => setActiveCommunity(null)}
            />

            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
            {tooltip && (
                <Paper
                    shadow="md"
                    p="xs"
                    radius="sm"
                    withBorder
                    style={{
                        position: 'fixed',
                        left: tooltip.x,
                        top: tooltip.y,
                        zIndex: 9999,
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-8px',
                        pointerEvents: 'none'
                    }}
                >
                    <Text size="xs" fw={700}>{tooltip.content}</Text>
                </Paper>
            )}

            <Paper
                shadow="sm"
                p="xs"
                radius="sm"
                withBorder
                style={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    pointerEvents: 'none',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)'
                }}
            >
                <Text size="xs" c="dimmed">
                    Nodes: <Text span fw={700} c="dark">{filteredNodes.length}</Text> | Links: <Text span fw={700} c="dark">{filteredLinks.length}</Text>
                </Text>
            </Paper>
        </Box>
    );
};

// ─── Helper: compute node opacity ─────────────────────────────────────
function computeNodeOpacity(
    d: any,
    activeCommunity: number | null,
    searchTerm: string,
    selectedNode: Node | null,
    filteredLinks: Link[]
): number {
    if (activeCommunity !== null && d.community !== activeCommunity) return 0.1;
    if (searchTerm && !d.id.toLowerCase().includes(searchTerm.toLowerCase())) return 0.1;
    if (selectedNode) {
        const isConnected = filteredLinks.some(l =>
            (l.source === selectedNode.id && l.target === d.id) ||
            (l.target === selectedNode.id && l.source === d.id) ||
            ((l.source as any).id === selectedNode.id && (l.target as any).id === d.id) ||
            ((l.target as any).id === selectedNode.id && (l.source as any).id === d.id)
        );
        if (d.id !== selectedNode.id && !isConnected) return 0.1;
    }
    return 1;
}

// ─── Helper: compute label opacity ────────────────────────────────────
function computeLabelOpacity(
    d: any,
    activeCommunity: number | null,
    selectedNode: Node | null,
    filteredLinks: Link[]
): number {
    if (activeCommunity !== null && d.community !== activeCommunity) return 0;
    if (selectedNode) {
        const isConnected = filteredLinks.some(l =>
            (l.source === selectedNode.id && l.target === d.id) ||
            (l.target === selectedNode.id && l.source === d.id) ||
            ((l.source as any).id === selectedNode.id && (l.target as any).id === d.id) ||
            ((l.target as any).id === selectedNode.id && (l.source as any).id === d.id)
        );
        if (d.id === selectedNode.id || isConnected) return 1;
        return 0;
    }
    return (d.degree || 0) > 5 ? 1 : 0;
}

export default D3ForceGraph;
