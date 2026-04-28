import * as d3 from 'd3';
import { KnowledgeNode, KnowledgeEdge } from '../../context/DataContext';

export type D3NodeDatum = d3.SimulationNodeDatum & KnowledgeNode & { 
    id: string; 
};

export type D3LinkDatum = d3.SimulationLinkDatum<D3NodeDatum> & KnowledgeEdge & {
    source: string | D3NodeDatum;
    target: string | D3NodeDatum;
};

export interface TooltipState {
    x: number;
    y: number;
    content: string;
}
