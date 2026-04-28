import React from 'react';
import { Stack, Text, Box, Group, ThemeIcon, Progress, ScrollArea, Badge, Divider, Center, Paper } from '@mantine/core';
import { IconUser, IconMessageCircle, IconUsers, IconHeartbeat } from '@tabler/icons-react';
import { useAnalytics } from '../../context/AnalyticsContext';

const NodeDetailsPanel: React.FC = () => {
    const { selectedKnowledgeNode, selectedKnowledgeEdge } = useAnalytics();

    if (selectedKnowledgeEdge) {
        // Find names since edge source/target might be just string IDs depending on state, 
        // but if populated by D3, they might be full node objects.
        const sName = typeof selectedKnowledgeEdge.source === 'object' ? (selectedKnowledgeEdge.source as any).display_name : selectedKnowledgeEdge.source;
        const tName = typeof selectedKnowledgeEdge.target === 'object' ? (selectedKnowledgeEdge.target as any).display_name : selectedKnowledgeEdge.target;

        return (
            <Stack gap="md">
                <Box>
                    <Text fw={700} size="lg" c="dark.6">Relationship Evidence</Text>
                    <Text size="sm" c="dimmed">
                        {sName} ↔ {tName}
                    </Text>
                </Box>
                
                <Group gap="xs">
                    <Badge color="blue" variant="light">Weight: {selectedKnowledgeEdge.total_weight}</Badge>
                    <Badge color="gray" variant="light">{selectedKnowledgeEdge.evidence?.length || 0} interactions</Badge>
                </Group>

                <Divider />

                <Text fw={600} size="sm">Source Text Snippets</Text>
                <ScrollArea h={400} offsetScrollbars>
                    <Stack gap="xs">
                        {selectedKnowledgeEdge.evidence?.map((ev, idx) => (
                            <Box key={idx} p="xs" bg="gray.0" style={{ borderRadius: '6px', borderLeft: '4px solid var(--mantine-color-blue-filled)' }}>
                                <Text size="xs" c="dimmed" mb={4} fw={600}>Book {ev.book}, Chapter {ev.chapter}</Text>
                                <Text size="sm" fs="italic" style={{ lineHeight: 1.4 }}>
                                    "{ev.text}"
                                </Text>
                            </Box>
                        ))}
                    </Stack>
                </ScrollArea>
            </Stack>
        );
    }

    if (selectedKnowledgeNode) {
        const { display_name, family_clique, social_class, gender, metrics } = selectedKnowledgeNode;
        return (
            <Stack gap="md">
                <Group wrap="nowrap" align="flex-start">
                    <ThemeIcon size={48} radius="md" color="blue" variant="light">
                        <IconUser size="1.8rem" />
                    </ThemeIcon>
                    <Box>
                        <Text fw={700} size="xl" c="dark.6" style={{ lineHeight: 1.2 }}>{display_name}</Text>
                        <Group gap="xs" mt={4}>
                            {family_clique && <Badge size="sm" color="grape" variant="dot">{family_clique}</Badge>}
                            {social_class && <Badge size="sm" color="cyan" variant="dot">{social_class}</Badge>}
                            {gender && <Badge size="sm" color="gray" variant="dot">{gender}</Badge>}
                        </Group>
                    </Box>
                </Group>

                <Divider />

                <Box>
                    <Group justify="space-between" mb={4}>
                        <Text fw={600} size="sm">Agency Score</Text>
                        <Text size="sm" fw={700}>{metrics.agency_score.toFixed(2)}</Text>
                    </Group>
                    <Progress value={Math.min(100, Math.max(0, metrics.agency_score * 100))} color="blue" size="md" radius="xl" />
                    <Text size="xs" c="dimmed" mt={4}>Measures active vs passive narrative role</Text>
                </Box>

                <Box>
                    <Group justify="space-between" mb={4}>
                        <Text fw={600} size="sm">Influence Ratio</Text>
                        <Text size="sm" fw={700}>{metrics.influence_ratio.toFixed(2)}</Text>
                    </Group>
                    <Progress value={Math.min(100, Math.max(0, metrics.influence_ratio * 100))} color="teal" size="md" radius="xl" />
                    <Text size="xs" c="dimmed" mt={4}>Ratio of initiating events to total events</Text>
                </Box>

                <Divider />

                <Text fw={600} size="sm">Interaction Breakdown</Text>
                
                <Group grow>
                    <Paper p="xs" radius="md" bg="gray.0" withBorder>
                        <Group gap="xs" wrap="nowrap">
                            <ThemeIcon color="green" variant="light" size="sm"><IconMessageCircle size="0.8rem"/></ThemeIcon>
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Initiated</Text>
                                <Text fw={700}>{metrics.initiator_count}</Text>
                            </Box>
                        </Group>
                    </Paper>
                    <Paper p="xs" radius="md" bg="gray.0" withBorder>
                        <Group gap="xs" wrap="nowrap">
                            <ThemeIcon color="orange" variant="light" size="sm"><IconUsers size="0.8rem"/></ThemeIcon>
                            <Box>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Received</Text>
                                <Text fw={700}>{metrics.recipient_count}</Text>
                            </Box>
                        </Group>
                    </Paper>
                </Group>

                <Paper p="sm" radius="md" bg="blue.0" mt="xs">
                    <Group gap="sm" wrap="nowrap">
                        <ThemeIcon color="blue" variant="filled" radius="xl"><IconHeartbeat size="1rem"/></ThemeIcon>
                        <Box>
                            <Text size="sm" fw={600} c="blue.9">Mentions in Absence: {metrics.mention_in_absence_count}</Text>
                            <Text size="xs" c="blue.8" style={{ lineHeight: 1.2 }}>Times this character is discussed by others when not present.</Text>
                        </Box>
                    </Group>
                </Paper>

            </Stack>
        );
    }

    return (
        <Center h={200}>
            <Text c="dimmed" ta="center" size="sm">
                Select a character or relationship<br/>in the graph to view details
            </Text>
        </Center>
    );
};

export default NodeDetailsPanel;
