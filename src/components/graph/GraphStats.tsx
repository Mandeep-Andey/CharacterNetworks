import React from 'react';
import { Paper, Text } from '@mantine/core';

interface GraphStatsProps {
    nodeCount: number;
    linkCount: number;
}

const GraphStats: React.FC<GraphStatsProps> = ({ nodeCount, linkCount }) => {
    return (
        <Paper
            shadow="sm"
            p="xs"
            radius="sm"
            withBorder
            style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                pointerEvents: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)'
            }}
        >
            <Text size="xs" c="dimmed">
                Nodes: <Text span fw={700} c="dark">{nodeCount}</Text> | Links: <Text span fw={700} c="dark">{linkCount}</Text>
            </Text>
        </Paper>
    );
};

export default GraphStats;
