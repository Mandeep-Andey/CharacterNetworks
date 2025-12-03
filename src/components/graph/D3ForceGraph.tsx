import React, { useEffect, useRef } from 'react';
import { Paper, Text, Box } from '@mantine/core';
import * as d3 from 'd3';
import { Node, Link } from '../../context/DataContext';
import { useSelection } from '../../context/SelectionContext';
import { useControls } from '../../context/ControlsContext';

interface D3ForceGraphProps {
    nodes: Node[];
    links: Link[];
    width?: number;
    height?: number;
    minConnections?: number;
    forceStrength?: number;
}

// Premium color palette for groups (Viridis-like but distinct)
const GROUP_COLORS = [
    '#440154', '#482878', '#3e4989', '#31688e', '#26828e',
    '#1f9e89', '#35b779', '#6dcd59', '#b4de2c', '#fde725',
    '#f0f921'
];

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

    const [tooltip, setTooltip] = React.useState<{ x: number, y: number, content: string } | null>(null);

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

        // Zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Create a simulation
        const simulation = d3.forceSimulation(filteredNodes as d3.SimulationNodeDatum[])
            .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-forceStrength * 10))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius((d: any) => (d.degree ? Math.sqrt(d.degree) * 5 + 5 : 8) + 4));

        // Render links
        const link = container.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(filteredLinks)
            .join("line")
            .attr("stroke-width", (d) => Math.sqrt(d.value) * 2) // Thicker links based on value
            .attr("stroke", (d) => {
                // Highlight links connected to selected node
                if (selectedNode && (d.source === selectedNode.id || d.target === selectedNode.id ||
                    (d.source as any).id === selectedNode.id || (d.target as any).id === selectedNode.id)) {
                    return "#e74c3c";
                }
                return "#bdc3c7";
            })
            .attr("stroke-opacity", (d) => {
                if (selectedNode) {
                    const isConnected = (d.source === selectedNode.id || d.target === selectedNode.id ||
                        (d.source as any).id === selectedNode.id || (d.target as any).id === selectedNode.id);
                    return isConnected ? 0.8 : 0.1; // Dim unconnected links
                }
                return 0.6;
            });

        // Render nodes
        const node = container.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(filteredNodes)
            .join("circle")
            .attr("r", (d) => d.degree ? Math.sqrt(d.degree) * 5 + 5 : 8) // Dynamic size: sqrt(degree) * scale + base
            .attr("fill", (d) => {
                // Highlight if matches search term
                if (searchTerm && d.id.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return "#e74c3c"; // Highlight color
                }
                // Highlight if selected
                if (selectedNode && d.id === selectedNode.id) {
                    return "#e74c3c";
                }
                return GROUP_COLORS[d.group % GROUP_COLORS.length] || "#69b3a2";
            })
            .attr("opacity", (d) => {
                if (searchTerm && !d.id.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return 0.1; // Dim non-matching nodes significantly
                }
                if (selectedNode) {
                    // Dim nodes not connected to selected node
                    const isConnected = filteredLinks.some(l =>
                        (l.source === selectedNode.id && l.target === d.id) ||
                        (l.target === selectedNode.id && l.source === d.id) ||
                        ((l.source as any).id === selectedNode.id && (l.target as any).id === d.id) ||
                        ((l.target as any).id === selectedNode.id && (l.source as any).id === d.id)
                    );
                    if (d.id !== selectedNode.id && !isConnected) {
                        return 0.1; // Dim unconnected nodes
                    }
                }
                return 1;
            })
            .attr("cursor", "pointer")
            .on("click", (event, d) => {
                event.stopPropagation();
                setSelectedNode(d as Node);
            })
            .on("mouseover", (event, d) => {
                setTooltip({
                    x: event.clientX,
                    y: event.clientY,
                    content: d.id
                });
                d3.select(event.currentTarget)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 3)
                    .transition().duration(200)
                    .attr("r", (d: any) => (d.degree ? Math.sqrt(d.degree) * 5 + 5 : 8) + 3); // Slight grow
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
                    .attr("r", (d: any) => d.degree ? Math.sqrt(d.degree) * 5 + 5 : 8);
            })
            .call(drag(simulation) as any);

        // Background click to clear selection
        svg.on("click", () => {
            setSelectedNode(null);
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
            .style("text-shadow", "1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white") // Halo for readability
            .style("opacity", (d) => {
                // Show labels for high degree nodes or if zoomed in (simplified here)
                // Also show if selected or connected to selected
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

        // Show label on hover
        node.on("mouseover.label", (_event, d) => {
            label.filter(l => l === d).style("opacity", 1).style("font-weight", "bold");
        }).on("mouseout.label", (_event, d) => {
            if (selectedNode) return; // Don't hide if selected mode
            label.filter(l => l === d).style("opacity", (d.degree || 0) > 5 ? 1 : 0).style("font-weight", "600");
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
    }, [filteredNodes, filteredLinks, width, height, forceStrength, searchTerm, selectedNode, setSelectedNode]);

    return (
        <Box w="100%" h="100%" pos="relative" bg="transparent">
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
