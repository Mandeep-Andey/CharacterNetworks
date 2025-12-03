import React, { useEffect, useRef, useState } from 'react';
import { Paper, Text, Box } from '@mantine/core';
import * as d3 from 'd3';
import { Node, Link } from '../../context/DataContext';
import { useSelection } from '../../context/SelectionContext';
import { useControls } from '../../context/ControlsContext';
import GraphBreadcrumbs from './GraphBreadcrumbs';

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

// Gradient for focus mode (based on degree)
const FOCUS_COLOR_SCALE = d3.scaleSequential(d3.interpolateViridis).domain([0, 20]);

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

    // Store zoom behavior to access it outside useEffect
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const containerRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

    // Filter nodes and links based on minConnections
    const { filteredNodes, filteredLinks } = React.useMemo(() => {
        const activeNodes = nodes.filter(n => (n.degree || 0) >= minConnections);
        const activeNodeIds = new Set(activeNodes.map(n => n.id));
        const activeLinks = links.filter(l => activeNodeIds.has(l.source) && activeNodeIds.has(l.target));

        return { filteredNodes: activeNodes, filteredLinks: activeLinks };
    }, [nodes, links, minConnections]);

    useEffect(() => {
        if (!svgRef.current || filteredNodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const container = svg.append("g");
        containerRef.current = container;

        // Zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        zoomRef.current = zoom;
        svg.call(zoom);

        // --- Community Centers Calculation ---
        const communities = Array.from(new Set(filteredNodes.map(d => d.community || 0)));
        const communityCount = communities.length;
        const communityCenters: { [key: number]: { x: number, y: number } } = {};

        // Arrange communities in a circle
        const radius = Math.min(width, height) * 0.35;
        communities.forEach((c, i) => {
            const angle = (i / communityCount) * 2 * Math.PI;
            communityCenters[c] = {
                x: width / 2 + Math.cos(angle) * radius,
                y: height / 2 + Math.sin(angle) * radius
            };
        });

        // --- Force Simulation ---
        const simulation = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])
            .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance(50))
            .force("charge", d3.forceManyBody().strength(-forceStrength * 5))
            .force("collide", d3.forceCollide().radius((d: any) => (d.degree ? Math.sqrt(d.degree) * 4 + 4 : 6) + 2));

        // ALWAYS use segregated view forces
        simulation.force("x", d3.forceX((d: any) => communityCenters[d.community || 0]?.x || width / 2).strength(0.3));
        simulation.force("y", d3.forceY((d: any) => communityCenters[d.community || 0]?.y || height / 2).strength(0.3));

        // --- Rendering ---

        // Render links
        const link = container.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(filteredLinks)
            .join("line")
            .attr("stroke-width", (d) => Math.sqrt(d.value) * 1.5)
            .attr("stroke", (d) => {
                if (selectedNode && (d.source === selectedNode.id || d.target === selectedNode.id ||
                    (d.source as any).id === selectedNode.id || (d.target as any).id === selectedNode.id)) {
                    return "#e74c3c";
                }
                return "#bdc3c7";
            })
            .attr("opacity", (d) => {
                const sourceNode = filteredNodes.find(n => n.id === (typeof d.source === 'object' ? (d.source as any).id : d.source));
                const targetNode = filteredNodes.find(n => n.id === (typeof d.target === 'object' ? (d.target as any).id : d.target));

                // Dim cross-community links slightly
                if (sourceNode?.community !== targetNode?.community) return 0.2;
                return 0.6;
            });

        // Render nodes
        const node = container.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(filteredNodes)
            .join("circle")
            .attr("r", (d) => d.degree ? Math.sqrt(d.degree) * 4 + 4 : 6)
            .attr("fill", (d) => {
                // We can still use the activeCommunity state to highlight nodes, 
                // but we won't change their position.
                if (activeCommunity !== null) {
                    if (d.community === activeCommunity) {
                        return FOCUS_COLOR_SCALE(d.degree || 0);
                    }
                    // Keep original color but maybe dimmed? Or grey?
                    // Let's keep original color but dimmed to show context
                    return COMMUNITY_COLORS[(d.community || 0) % COMMUNITY_COLORS.length];
                }
                return COMMUNITY_COLORS[(d.community || 0) % COMMUNITY_COLORS.length];
            })
            .attr("opacity", (d) => {
                if (activeCommunity !== null && d.community !== activeCommunity) return 0.1;

                if (searchTerm && !d.id.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return 0.1;
                }
                if (selectedNode) {
                    const isConnected = filteredLinks.some(l =>
                        (l.source === selectedNode.id && l.target === d.id) ||
                        (l.target === selectedNode.id && l.source === d.id) ||
                        ((l.source as any).id === selectedNode.id && (l.target as any).id === d.id) ||
                        ((l.target as any).id === selectedNode.id && (l.source as any).id === d.id)
                    );
                    if (d.id !== selectedNode.id && !isConnected) {
                        return 0.1;
                    }
                }
                return 1;
            })
            .attr("cursor", "pointer")
            .on("click", (event, d) => {
                event.stopPropagation();
                if (activeCommunity === null || activeCommunity !== d.community) {
                    setActiveCommunity(d.community || 0);
                } else {
                    setSelectedNode(d as Node);
                }
            })
            .on("mouseover", (event, d) => {
                setTooltip({
                    x: event.clientX,
                    y: event.clientY,
                    content: `${d.id} (Group ${d.community})`
                });
                d3.select(event.currentTarget)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 3)
                    .transition().duration(200)
                    .attr("r", (d: any) => (d.degree ? Math.sqrt(d.degree) * 4 + 4 : 6) + 3);
            })
            .on("mousemove", (event) => {
                setTooltip(prev => prev ? { ...prev, x: event.pageX, y: event.pageY } : null);
            })
            .on("mouseout", (event) => {
                setTooltip(null);
                d3.select(event.currentTarget)
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .transition().duration(200)
                    .attr("r", (d: any) => d.degree ? Math.sqrt(d.degree) * 4 + 4 : 6);
            })
            .call(drag(simulation) as any);

        // Background click to clear selection / zoom out
        svg.on("click", () => {
            if (selectedNode) {
                setSelectedNode(null);
            }
        });

        // Add labels
        const label = container.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(filteredNodes)
            .join("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text((d) => d.id)
            .style("font-family", "var(--mantine-font-family)")
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("pointer-events", "none")
            .style("text-shadow", "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white")
            .style("opacity", (d) => {
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
            });

        // Simulation tick
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

        // Drag behavior
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

            function dragended(event: any) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        return () => {
            simulation.stop();
        };
    }, [filteredNodes, filteredLinks, width, height, forceStrength, searchTerm, selectedNode, setSelectedNode]); // Removed activeCommunity from dependency array to prevent re-render

    // Handle Zoom to Community Effect
    useEffect(() => {
        if (!svgRef.current || !zoomRef.current) return;
        const svg = d3.select(svgRef.current);

        if (activeCommunity !== null) {
            // Find nodes in this community
            const communityNodes = filteredNodes.filter(n => n.community === activeCommunity);
            if (communityNodes.length === 0) return;

            // Calculate bounding box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            communityNodes.forEach((n: any) => {
                if (n.x === undefined || n.y === undefined) return;
                minX = Math.min(minX, n.x);
                minY = Math.min(minY, n.y);
                maxX = Math.max(maxX, n.x);
                maxY = Math.max(maxY, n.y);
            });

            // Add padding
            const padding = 50;
            const boxWidth = maxX - minX + padding * 2;
            const boxHeight = maxY - minY + padding * 2;
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            // Calculate scale
            const scale = Math.min(8, 0.9 / Math.max(boxWidth / width, boxHeight / height));

            // Transition
            svg.transition().duration(750).call(
                zoomRef.current.transform as any,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(scale)
                    .translate(-centerX, -centerY)
            );

        } else {
            // Reset to global view
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

export default D3ForceGraph;
