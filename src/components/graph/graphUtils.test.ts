import { describe, it, expect } from 'vitest';
import { nodeRadius, computeNodeOpacity, computeLabelOpacity } from './graphUtils';
import { Node, Link } from '../../context/DataContext';

describe('graphUtils', () => {
    describe('nodeRadius', () => {
        it('should return default radius when degree is missing', () => {
            expect(nodeRadius({ id: 'A' })).toBe(6);
        });

        it('should return scaled radius based on degree', () => {
            // Math.sqrt(4) * 4 + 4 = 2 * 4 + 4 = 12
            expect(nodeRadius({ id: 'A', degree: 4 })).toBe(12);
        });
    });

    describe('computeNodeOpacity', () => {
        const mockNodes: Node[] = [
            { id: 'A', community: 1, group: 1, groupName: 'G1' }, 
            { id: 'B', community: 1, group: 1, groupName: 'G1' }, 
            { id: 'C', community: 2, group: 2, groupName: 'G2' }
        ];
        const mockLinks: Link[] = [{ source: 'A', target: 'B', value: 1, interactions: [] }];

        it('should return 1 when no filters are active', () => {
            expect(computeNodeOpacity(mockNodes[0], null, '', null, mockLinks)).toBe(1);
        });

        it('should return 0.1 when node is not in active community', () => {
            expect(computeNodeOpacity(mockNodes[2], 1, '', null, mockLinks)).toBe(0.1);
        });

        it('should return 1 when node is in active community', () => {
            expect(computeNodeOpacity(mockNodes[0], 1, '', null, mockLinks)).toBe(1);
        });

        it('should return 0.1 when search term does not match', () => {
            expect(computeNodeOpacity(mockNodes[0], null, 'B', null, mockLinks)).toBe(0.1);
        });

        it('should return 0.1 when node is not connected to selected node', () => {
            const selectedNode = mockNodes[0];
            // C is not connected to A
            expect(computeNodeOpacity(mockNodes[2], null, '', selectedNode, mockLinks)).toBe(0.1);
        });

        it('should return 1 for selected node itself', () => {
            const selectedNode = mockNodes[0];
            expect(computeNodeOpacity(mockNodes[0], null, '', selectedNode, mockLinks)).toBe(1);
        });

        it('should return 1 for connected nodes', () => {
            const selectedNode = mockNodes[0];
            // B is connected to A
            expect(computeNodeOpacity(mockNodes[1], null, '', selectedNode, mockLinks)).toBe(1);
        });
    });

    describe('computeLabelOpacity', () => {
        const mockNodes: any[] = [{ id: 'A', degree: 10, community: 1 }, { id: 'B', degree: 2, community: 1 }];
        const mockLinks: Link[] = [{ source: 'A', target: 'B', value: 1, interactions: [] }];

        it('should return 1 for prominent nodes at low zoom', () => {
            expect(computeLabelOpacity(mockNodes[0], null, null, mockLinks, 1.0)).toBe(1);
        });

        it('should return 0 for non-prominent nodes at low zoom', () => {
            expect(computeLabelOpacity(mockNodes[1], null, null, mockLinks, 1.0)).toBe(0);
        });

        it('should return 1 for all nodes at high zoom', () => {
            expect(computeLabelOpacity(mockNodes[1], null, null, mockLinks, 1.5)).toBe(1);
        });

        it('should return 0 when node is not in active community', () => {
            expect(computeLabelOpacity(mockNodes[0], 2, null, mockLinks, 1.5)).toBe(0);
        });
    });
});
