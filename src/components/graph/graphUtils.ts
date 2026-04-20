import { Node, Link } from '../../context/DataContext';
import { D3NodeDatum } from './types';
import { 
    DEFAULT_NODE_RADIUS, 
    NODE_RADIUS_SCALE_FACTOR, 
    NODE_RADIUS_OFFSET 
} from './constants';

/** Compute node radius from degree */
export const nodeRadius = (d: { degree?: number } | D3NodeDatum): number => {
    if (!d.degree) return DEFAULT_NODE_RADIUS;
    return Math.sqrt(d.degree) * NODE_RADIUS_SCALE_FACTOR + NODE_RADIUS_OFFSET;
};

/** Compute node opacity based on active filters and selection */
export const computeNodeOpacity = (
    d: any,
    activeCommunity: number | null,
    searchTerm: string,
    selectedNode: Node | null,
    filteredLinks: Link[]
): number => {
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
};

/** Compute label opacity based on active filters, selection, and zoom level */
export const computeLabelOpacity = (
    d: any,
    activeCommunity: number | null,
    selectedNode: Node | null,
    filteredLinks: Link[],
    zoomScale: number
): number => {
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
    
    // Semantic zoom:
    // If zoomed in (k > 1.3), show ALL node labels.
    // If zoomed out, only show prominent nodes (degree > 5).
    if (zoomScale > 1.3) {
        return 1;
    }
    return (d.degree || 0) > 5 ? 1 : 0;
};
