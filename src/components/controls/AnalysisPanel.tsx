import React, { useMemo } from 'react';
import { Stack, Text, Group, Badge, Paper, RingProgress, ScrollArea, Divider, Box } from '@mantine/core';
import { Node, Link } from '../../context/DataContext';

interface AnalysisPanelProps {
    nodes: Node[];
    links: Link[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ nodes, links }) => {
    const stats = useMemo(() => {
        if (!nodes.length) return null;

        // 1. Top Characters by Degree
        const sortedByDegree = [...nodes].sort((a, b) => (b.degree || 0) - (a.degree || 0)).slice(0, 5);

        // 2. Interaction Types Distribution
        const typeCounts: Record<string, number> = {};
        let totalInteractions = 0;
        links.forEach(l => {
            l.interactions.forEach(i => {
                typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
                totalInteractions++;
            });
        });

        const typeDistribution = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({
                type,
                count,
                percentage: totalInteractions > 0 ? Math.round((count / totalInteractions) * 100) : 0
            }));

        // 3. Graph Density
        // Density = 2 * |E| / (|V| * (|V| - 1)) for undirected graph
        const possibleConnections = nodes.length * (nodes.length - 1) / 2;
        const density = possibleConnections > 0 ? (links.length / possibleConnections) : 0;

        return {
            topCharacters: sortedByDegree,
            typeDistribution,
            density: (density * 100).toFixed(1),
            totalNodes: nodes.length,
            totalLinks: links.length
        };
    }, [nodes, links]);

    if (!stats) return <Text c="dimmed" size="sm">No data available for analysis.</Text>;

    return (
        <Stack gap="md">
            {/* Overview Stats */}
            <Group grow>
                <Paper p="xs" withBorder bg="gray.0">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Density</Text>
                    <Text size="xl" fw={700} c="primary">{stats.density}%</Text>
                </Paper>
                <Paper p="xs" withBorder bg="gray.0">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Characters</Text>
                    <Text size="xl" fw={700} c="primary">{stats.totalNodes}</Text>
                </Paper>
            </Group>

            <Divider label="Top Characters" labelPosition="center" />

            {/* Top Characters List */}
            <Stack gap="xs">
                {stats.topCharacters.map((node, idx) => (
                    <Group key={node.id} justify="space-between" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap">
                            <Badge size="sm" circle variant="filled" color="gray">{idx + 1}</Badge>
                            <Text size="sm" fw={500} truncate>{node.id}</Text>
                        </Group>
                        <Badge variant="light" color="primary">
                            {node.degree} conn
                        </Badge>
                    </Group>
                ))}
            </Stack>

            <Divider label="Interaction Types" labelPosition="center" />

            {/* Interaction Types Distribution */}
            <ScrollArea h={150}>
                <Stack gap="xs">
                    {stats.typeDistribution.map((item) => (
                        <Box key={item.type}>
                            <Group justify="space-between" mb={4}>
                                <Text size="xs" fw={500}>{item.type}</Text>
                                <Text size="xs" c="dimmed">{item.count} ({item.percentage}%)</Text>
                            </Group>
                            <RingProgress
                                size={24}
                                thickness={4}
                                roundCaps
                                sections={[{ value: item.percentage, color: 'primary' }]}
                                label={null}
                                style={{ display: 'none' }} // Hidden, just using progress bar below if needed, or simple text
                            />
                            <Box w="100%" h={6} bg="gray.2" style={{ borderRadius: 4, overflow: 'hidden' }}>
                                <Box w={`${item.percentage}%`} h="100%" bg="var(--mantine-color-primary-6)" />
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </ScrollArea>
        </Stack>
    );
};

export default AnalysisPanel;
