import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Node, Link } from '../../context/DataContext';
import { useSelection } from '../../context/SelectionContext';

interface D3ForceGraphProps {
    nodes: Node[];
    links: Link[];
    width?: number;
    height?: number;
    minConnections?: number;
    forceStrength?: number;
}

const D3ForceGraph: React.FC<D3ForceGraphProps> = ({
    nodes,
    links,
    width = 800,
    height = 600,
    minConnections = 1,
    forceStrength = 50
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const { setSelectedNode } = useSelection();

    const [tooltip, setTooltip] = React.useState<{ x: number, y: number, content: string } | null>(null);

    useEffect(() => {
        if (!svgRef.current || nodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        // Create a simulation
        const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-forceStrength * 10))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(20));

        // Render links
        const link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", (d) => Math.sqrt(d.value));

        // Render nodes
        const node = svg.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 10)
            .attr("fill", (d) => d3.schemeCategory10[d.group % 10] || "#69b3a2")
            .attr("cursor", "pointer")
            .on("click", (event, d) => {
                event.stopPropagation(); // Prevent background click from clearing selection
                setSelectedNode(d as Node);
            })
            .on("mouseover", (event, d) => {
                setTooltip({
                    x: event.pageX,
                    y: event.pageY,
                    content: d.id
                });
            })
            .on("mousemove", (event) => {
                setTooltip(prev => prev ? { ...prev, x: event.pageX, y: event.pageY } : null);
            })
            .on("mouseout", () => {
                setTooltip(null);
            })
            .call(drag(simulation) as any);

        // Background click to clear selection
        svg.on("click", () => {
            setSelectedNode(null);
        });

        // Add labels
        const label = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text((d) => d.id)
            .style("font-family", "sans-serif")
            .style("font-size", "10px")
            .style("pointer-events", "none");

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
    }, [nodes, links, width, height, forceStrength]);

    return (
        <div className="w-full h-full relative">
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full"
            />
            {tooltip && (
                <div
                    className="fixed bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none z-50 shadow-lg transform -translate-x-1/2 -translate-y-full mt-[-8px]"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};

export default D3ForceGraph;
