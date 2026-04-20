import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import GraphStats from './GraphStats';
import React from 'react';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <MantineProvider>
            {children}
        </MantineProvider>
    );
};

describe('GraphStats', () => {
    it('should render node and link counts', () => {
        render(<GraphStats nodeCount={10} linkCount={25} />, { wrapper: AllProviders });
        
        // Use regex or function to match text split by spans
        expect(screen.getByText(/Nodes:/)).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText(/Links:/)).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
    });
});
