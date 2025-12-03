import React from 'react';
import { Breadcrumbs, Anchor, Text, Box } from '@mantine/core';

interface GraphBreadcrumbsProps {
    activeCommunity: number | null;
    onReset: () => void;
}

const GraphBreadcrumbs: React.FC<GraphBreadcrumbsProps> = ({ activeCommunity, onReset }) => {
    if (activeCommunity === null) return null;

    return (
        <Box
            style={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 100,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '8px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(4px)'
            }}
        >
            <Breadcrumbs separator="→" style={{ fontSize: '14px' }}>
                <Anchor onClick={onReset} style={{ cursor: 'pointer', fontWeight: 600 }}>
                    All Characters
                </Anchor>
                <Text c="dimmed" size="sm" fw={500}>
                    Community {activeCommunity + 1}
                </Text>
            </Breadcrumbs>
        </Box>
    );
};

export default GraphBreadcrumbs;
