import { describe, it, expect } from 'vitest';
import { detectCommunities } from './louvain';

describe('detectCommunities', () => {
    it('should assign all nodes to a community', () => {
        const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
        const links = [
            { source: 'A', target: 'B', value: 1 },
            { source: 'B', target: 'C', value: 1 }
        ];

        const result = detectCommunities(nodes, links);

        expect(Object.keys(result)).toHaveLength(3);
        expect(result['A']).toBeDefined();
        expect(result['B']).toBeDefined();
        expect(result['C']).toBeDefined();
    });

    it('should group connected components together', () => {
        // Two separate triangles
        const nodes = [
            { id: '1' }, { id: '2' }, { id: '3' },
            { id: '4' }, { id: '5' }, { id: '6' }
        ];
        const links = [
            { source: '1', target: '2', value: 1 },
            { source: '2', target: '3', value: 1 },
            { source: '3', target: '1', value: 1 },
            { source: '4', target: '5', value: 1 },
            { source: '5', target: '6', value: 1 },
            { source: '6', target: '4', value: 1 }
        ];

        const result = detectCommunities(nodes, links);

        // Nodes 1, 2, 3 should be in the same community
        expect(result['1']).toBe(result['2']);
        expect(result['2']).toBe(result['3']);

        // Nodes 4, 5, 6 should be in the same community
        expect(result['4']).toBe(result['5']);
        expect(result['5']).toBe(result['6']);

        // They should be in DIFFERENT communities
        expect(result['1']).not.toBe(result['4']);
    });

    it('should handle weighted edges', () => {
        const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
        const links = [
            { source: 'A', target: 'B', value: 10 },
            { source: 'B', target: 'C', value: 1 }
        ];

        // A and B have a much stronger connection than B and C
        // In a simple pass, they might all be together or A-B together.
        const result = detectCommunities(nodes, links);
        
        expect(result['A']).toBe(result['B']);
    });
});
