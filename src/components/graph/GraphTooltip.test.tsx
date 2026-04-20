import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import GraphTooltip from './GraphTooltip';
import React from 'react';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <MantineProvider>
            {children}
        </MantineProvider>
    );
};

describe('GraphTooltip', () => {
    it('should not render when tooltip is null', () => {
        render(<GraphTooltip tooltip={null} />, { wrapper: AllProviders });
        expect(screen.queryByTestId('graph-tooltip')).not.toBeInTheDocument();
    });

    it('should render content when tooltip is provided', () => {
        const tooltip = { x: 100, y: 100, content: 'Dorothea Brooke' };
        render(<GraphTooltip tooltip={tooltip} />, { wrapper: AllProviders });
        
        expect(screen.getByTestId('graph-tooltip')).toBeInTheDocument();
        expect(screen.getByText('Dorothea Brooke')).toBeInTheDocument();
    });
});
