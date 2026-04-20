import * as d3 from 'd3';
import { Node, Link } from '../../context/DataContext';

export type D3NodeDatum = d3.SimulationNodeDatum & { 
    degree?: number; 
    community?: number; 
    id: string; 
};

export interface D3ForceGraphProps {
    nodes: Node[];
    links: Link[];
    width?: number;
    height?: number;
    forceStrength?: number;
}

export interface TooltipState {
    x: number;
    y: number;
    content: string;
}
