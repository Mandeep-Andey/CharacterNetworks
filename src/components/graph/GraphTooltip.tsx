import React from 'react';
import { Paper, Text } from '@mantine/core';
import { TooltipState } from './types';

interface GraphTooltipProps {
    tooltip: TooltipState | null;
}

const GraphTooltip: React.FC<GraphTooltipProps> = ({ tooltip }) => {
    if (!tooltip) return null;

    return (
        <Paper
            data-testid="graph-tooltip"
            shadow="md"
            p="xs"
            radius="sm"
            withBorder
            style={{
                position: 'fixed',
                left: tooltip.x,
                top: tooltip.y,
                zIndex: 9999,
                transform: 'translate(-50%, -100%)',
                marginTop: '-8px',
                pointerEvents: 'none'
            }}
        >
            <Text size="xs" fw={700}>{tooltip.content}</Text>
        </Paper>
    );
};

export default GraphTooltip;
