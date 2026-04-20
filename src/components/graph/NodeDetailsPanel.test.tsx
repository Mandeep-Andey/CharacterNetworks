import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import NodeDetailsPanel from './NodeDetailsPanel';
import { useSelection } from '../../context/SelectionContext';
import React from 'react';

// Mock the SelectionContext to control state in tests
vi.mock('../../context/SelectionContext', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useSelection: vi.fn(),
    };
});

const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <MantineProvider>
            {children}
        </MantineProvider>
    );
};

describe('NodeDetailsPanel', () => {
    it('should show empty state when no node is selected', () => {
        (useSelection as any).mockReturnValue({
            selectedNode: null,
            setSelectedNode: vi.fn(),
        });

        render(<NodeDetailsPanel />, { wrapper: AllProviders });
        
        expect(screen.getByText(/Select a character on the graph to view details/)).toBeInTheDocument();
    });

    it('should show character details when a node is selected', () => {
        const mockNode = {
            id: 'Dorothea Brooke',
            community: 1,
            degree: 15,
            groupName: 'The Brookes'
        };
        const setSelectedNode = vi.fn();

        (useSelection as any).mockReturnValue({
            selectedNode: mockNode,
            setSelectedNode,
        });

        render(<NodeDetailsPanel />, { wrapper: AllProviders });
        
        expect(screen.getByText('Dorothea Brooke')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('The Brookes')).toBeInTheDocument();
        expect(screen.getByText('Group 1')).toBeInTheDocument();
    });

    it('should call setSelectedNode(null) when clear button is clicked', () => {
        const mockNode = { id: 'Dorothea', community: 1 };
        const setSelectedNode = vi.fn();

        (useSelection as any).mockReturnValue({
            selectedNode: mockNode,
            setSelectedNode,
        });

        render(<NodeDetailsPanel />, { wrapper: AllProviders });
        
        const clearButton = screen.getByText('Clear Selection');
        fireEvent.click(clearButton);
        
        expect(setSelectedNode).toHaveBeenCalledWith(null);
    });
});
