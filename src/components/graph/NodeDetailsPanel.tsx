import React from 'react';
import { Paper, Title, Text, Group, Badge, Stack, Button, Divider, Box } from '@mantine/core';
import { useSelection } from '../../context/SelectionContext';
import { COMMUNITY_COLORS } from './constants';

const NodeDetailsPanel: React.FC = () => {
    const { selectedNode, setSelectedNode } = useSelection();

    if (!selectedNode) {
        return (
            <Box p="md">
                <Text c="dimmed" size="sm" ta="center" fs="italic">
                    Select a character on the graph to view details.
                </Text>
            </Box>
        );
    }

    const color = COMMUNITY_COLORS[(selectedNode.community || 0) % COMMUNITY_COLORS.length];

    return (
        <Stack p="md" gap="md">
            <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-gray-0)">
                <Stack gap="xs">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Title order={4} ff="serif" style={{ color: 'var(--mantine-color-dark-4)' }}>
                            {selectedNode.id}
                        </Title>
                        <Badge color={color} variant="filled">
                            Group {selectedNode.community}
                        </Badge>
                    </Group>
                    
                    <Divider my="xs" />

                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Total Interactions:</Text>
                        <Text size="sm">{selectedNode.degree || 0}</Text>
                    </Group>

                    <Group justify="space-between">
                        <Text size="sm" fw={500}>Group Name:</Text>
                        <Text size="sm">{selectedNode.groupName || 'Unknown'}</Text>
                    </Group>
                </Stack>
            </Paper>

            <Button 
                variant="light" 
                color="gray" 
                fullWidth 
                onClick={() => setSelectedNode(null)}
            >
                Clear Selection
            </Button>
        </Stack>
    );
};

export default NodeDetailsPanel;
