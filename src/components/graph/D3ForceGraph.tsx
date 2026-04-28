import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, ActionIcon, Tooltip } from '@mantine/core';
import { useAnalytics } from '../../context/AnalyticsContext';
import { KnowledgeNode, KnowledgeEdge } from '../../context/DataContext';
import { D3NodeDatum, D3LinkDatum, TooltipState } from './types';
import GraphTooltip from './GraphTooltip';
import { IconFocusCentered } from '@tabler/icons-react';

interface D3ForceGraphProps {
    nodes: KnowledgeNode[];
    links: KnowledgeEdge[];
    forceStrength?: number;
}

const D3ForceGraph: React.FC<D3ForceGraphProps> = ({ nodes, links, forceStrength = -400 }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const simulationRef = useRef<d3.Simulation<D3NodeDatum, undefined> | null>(null);
    const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    const { 
        isAnalyticsMode, 
        selectedKnowledgeNode, setSelectedKnowledgeNode,
        selectedKnowledgeEdge, setSelectedKnowledgeEdge,
        colorBy, sizeBy 
    } = useAnalytics();

    // ─── Initialization & Structure Effect ──────────────────────────
    useEffect(() => {
        if (!svgRef.current || !containerRef.current || !nodes.length) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); 

        const g = svg.append("g").attr("class", "main-group");
        gRef.current = g;

        const linkGroup = g.append("g").attr("class", "link-group");
        const nodeGroup = g.append("g").attr("class", "node-group");
        const labelGroup = g.append("g").attr("class", "label-group");

        // Zoom setup
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });
        svg.call(zoom);
        zoomRef.current = zoom;
        
        const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8);
        svg.call(zoom.transform, initialTransform);

        // Simulation setup
        const simulation = d3.forceSimulation<D3NodeDatum>(nodes as D3NodeDatum[])
            .force("link", d3.forceLink<D3NodeDatum, D3LinkDatum>(links as D3LinkDatum[]).id(d => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(forceStrength))
            .force("center", d3.forceCenter(0, 0))
            .force("collide", d3.forceCollide<D3NodeDatum>().radius(d => {
                const base = isAnalyticsMode ? 12 : 8;
                if (sizeBy === 'total_events') return Math.max(base, d.metrics.total_events * 2.5) + 5;
                if (sizeBy === 'agency_score') return Math.max(base, d.metrics.agency_score * 40) + 5;
                return base + 5;
            }));
        simulationRef.current = simulation;

        // Draw Links
        const link = linkGroup.selectAll<SVGLineElement, D3LinkDatum>("line")
            .data(links as D3LinkDatum[], d => `${(d.source as any).id || d.source}-${(d.target as any).id || d.target}`)
            .join("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", d => Math.sqrt(d.total_weight || 1))
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                event.stopPropagation();
                setSelectedKnowledgeEdge(d);
                setSelectedKnowledgeNode(null);
            });

        // Draw Nodes
        const node = nodeGroup.selectAll<SVGCircleElement, D3NodeDatum>("circle")
            .data(nodes as D3NodeDatum[], d => d.id)
            .join("circle")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("r", 8)
            .attr("fill", "#4dabf7")
            .style("cursor", "pointer")
            .call(d3.drag<SVGCircleElement, D3NodeDatum>()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    d.fx = event.x; d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                })
            )
            .on("click", (event, d) => {
                event.stopPropagation();
                setSelectedKnowledgeNode(d);
                setSelectedKnowledgeEdge(null);
            })
            .on("mouseover", (event, d) => {
                setTooltip({ x: event.clientX, y: event.clientY, content: d.display_name });
            })
            .on("mouseout", () => setTooltip(null));

        // Draw Labels
        const labels = labelGroup.selectAll<SVGTextElement, D3NodeDatum>("text")
            .data(nodes as D3NodeDatum[], d => d.id)
            .join("text")
            .attr("dx", 14).attr("dy", ".35em")
            .text(d => d.display_name)
            .style("font-size", "11px")
            .style("font-weight", "600")
            .style("font-family", "serif")
            .style("pointer-events", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("paint-order", "stroke");

        simulation.on("tick", () => {
            link.attr("x1", d => (d.source as any).x)
                .attr("y1", d => (d.source as any).y)
                .attr("x2", d => (d.target as any).x)
                .attr("y2", d => (d.target as any).y);

            node.attr("cx", d => d.x!)
                .attr("cy", d => d.y!);

            labels.attr("x", d => d.x!)
                  .attr("y", d => d.y!);
        });

        svg.on("click", () => {
            setSelectedKnowledgeNode(null);
            setSelectedKnowledgeEdge(null);
        });

        return () => {
            simulation.stop();
        };
    }, [nodes, links, forceStrength]); 

    // ─── Visual Updates Effect (Smooth transitions) ──────────────────
    useEffect(() => {
        if (!gRef.current) return;
        const g = gRef.current;
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Nodes visual update
        g.select(".node-group").selectAll<SVGCircleElement, D3NodeDatum>("circle")
            .transition().duration(500)
            .attr("r", d => {
                if (!isAnalyticsMode) return 8;
                if (sizeBy === 'total_events') return Math.max(6, d.metrics.total_events * 2.5);
                if (sizeBy === 'agency_score') return Math.max(6, d.metrics.agency_score * 40);
                return 10;
            })
            .attr("fill", d => {
                if (!isAnalyticsMode) return "#4dabf7";
                if (colorBy === 'community') return colorScale(d.family_clique || 'Unknown');
                if (colorBy === 'social_class') return colorScale(d.social_class || 'Unknown');
                if (colorBy === 'gender') return colorScale(d.gender || 'Unknown');
                return "#4dabf7";
            })
            .attr("stroke", d => {
                if (selectedKnowledgeNode && d.id === selectedKnowledgeNode.id) return "#228be6";
                return "#fff";
            })
            .attr("stroke-width", d => {
                if (selectedKnowledgeNode && d.id === selectedKnowledgeNode.id) return 3;
                return 1.5;
            })
            .attr("opacity", d => {
                if (selectedKnowledgeNode) return d.id === selectedKnowledgeNode.id ? 1 : 0.4;
                if (selectedKnowledgeEdge) {
                    const sId = typeof selectedKnowledgeEdge.source === 'object' ? (selectedKnowledgeEdge.source as any).id : selectedKnowledgeEdge.source;
                    const tId = typeof selectedKnowledgeEdge.target === 'object' ? (selectedKnowledgeEdge.target as any).id : selectedKnowledgeEdge.target;
                    return (d.id === sId || d.id === tId) ? 1 : 0.4;
                }
                return 1;
            });

        // Links visual update
        g.select(".link-group").selectAll<SVGLineElement, D3LinkDatum>("line")
            .transition().duration(500)
            .attr("stroke", d => {
                if (selectedKnowledgeEdge) {
                    const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
                    const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
                    const selSId = typeof selectedKnowledgeEdge.source === 'object' ? (selectedKnowledgeEdge.source as any).id : selectedKnowledgeEdge.source;
                    const selTId = typeof selectedKnowledgeEdge.target === 'object' ? (selectedKnowledgeEdge.target as any).id : selectedKnowledgeEdge.target;
                    return (sId === selSId && tId === selTId) ? "#228be6" : "#ced4da";
                }
                if (selectedKnowledgeNode) {
                    const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
                    const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
                    return (sId === selectedKnowledgeNode.id || tId === selectedKnowledgeNode.id) ? "#228be6" : "#ced4da";
                }
                return "#999";
            })
            .attr("opacity", d => {
                if (selectedKnowledgeEdge) {
                    const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
                    const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
                    const selSId = typeof selectedKnowledgeEdge.source === 'object' ? (selectedKnowledgeEdge.source as any).id : selectedKnowledgeEdge.source;
                    const selTId = typeof selectedKnowledgeEdge.target === 'object' ? (selectedKnowledgeEdge.target as any).id : selectedKnowledgeEdge.target;
                    return (sId === selSId && tId === selTId) ? 1 : 0.2;
                }
                if (selectedKnowledgeNode) {
                    const sId = typeof d.source === 'object' ? (d.source as any).id : d.source;
                    const tId = typeof d.target === 'object' ? (d.target as any).id : d.target;
                    return (sId === selectedKnowledgeNode.id || tId === selectedKnowledgeNode.id) ? 1 : 0.2;
                }
                return 0.6;
            });

        // Labels visual update
        g.select(".label-group").selectAll<SVGTextElement, D3NodeDatum>("text")
            .transition().duration(500)
            .attr("opacity", d => {
                if (selectedKnowledgeNode) return d.id === selectedKnowledgeNode.id ? 1 : 0.3;
                if (selectedKnowledgeEdge) {
                    const sId = typeof selectedKnowledgeEdge.source === 'object' ? (selectedKnowledgeEdge.source as any).id : selectedKnowledgeEdge.source;
                    const tId = typeof selectedKnowledgeEdge.target === 'object' ? (selectedKnowledgeEdge.target as any).id : selectedKnowledgeEdge.target;
                    return (d.id === sId || d.id === tId) ? 1 : 0.3;
                }
                return 0.9;
            });

    }, [isAnalyticsMode, colorBy, sizeBy, selectedKnowledgeNode, selectedKnowledgeEdge]);


    const handleRecenter = () => {
        if (!svgRef.current || !zoomRef.current || !containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8);
        
        d3.select(svgRef.current)
            .transition()
            .duration(750)
            .ease(d3.easeCubicOut)
            .call(zoomRef.current.transform, initialTransform);
    };

    return (
        <Box ref={containerRef} w="100%" h="100%" bg="transparent" pos="relative">
            <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }} />
            <GraphTooltip tooltip={tooltip} />
            
            <Tooltip label="Recenter View" position="left" withArrow>
                <ActionIcon 
                    pos="absolute" 
                    bottom={24} 
                    right={24} 
                    size="xl" 
                    radius="md" 
                    variant="white" 
                    shadow="md"
                    style={{ 
                        zIndex: 10, 
                        border: '1px solid var(--mantine-color-gray-3)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={handleRecenter}
                >
                    <IconFocusCentered size="1.4rem" stroke={2} />
                </ActionIcon>
            </Tooltip>
        </Box>
    );
};

export default D3ForceGraph;
