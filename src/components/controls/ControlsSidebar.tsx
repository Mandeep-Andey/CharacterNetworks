import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelection } from '../../context/SelectionContext';
import { useControls } from '../../context/ControlsContext';
import { useData } from '../../context/DataContext';
import AnalysisPanel from './AnalysisPanel';
import { Stack, Title, Text, Slider, TextInput, Paper, Divider, Box, Button, Group, Badge, ScrollArea, Accordion, ThemeIcon, Tabs, Checkbox, MultiSelect } from '@mantine/core';

const ControlsSidebar: React.FC = () => {
    const {
        minConnections, setMinConnections,
        forceStrength, setForceStrength,
        searchTerm, setSearchTerm,
        selectedGroups, setSelectedGroups,
        selectedInteractionTypes, setSelectedInteractionTypes
    } = useControls();

    const { selectedNode } = useSelection();
    const { data, chapters } = useData();
    const { bookId, chapterId } = useParams();
    const navigate = useNavigate();

    // Auto-Play Logic
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying && chapters && bookId && chapterId) {
            interval = setInterval(() => {
                const currentBookChapters = chapters[bookId];
                if (!currentBookChapters) return;

                const currentChapterNum = parseInt(chapterId, 10);
                const currentIndex = currentBookChapters.indexOf(currentChapterNum);

                if (currentIndex !== -1 && currentIndex < currentBookChapters.length - 1) {
                    // Next chapter in same book
                    navigate(`/${bookId}/${currentBookChapters[currentIndex + 1]}`);
                } else {
                    // Try next book
                    const bookKeys = Object.keys(chapters);
                    const currentBookIndex = bookKeys.indexOf(bookId);
                    if (currentBookIndex !== -1 && currentBookIndex < bookKeys.length - 1) {
                        const nextBookId = bookKeys[currentBookIndex + 1];
                        const nextBookChapters = chapters[nextBookId];
                        if (nextBookChapters && nextBookChapters.length > 0) {
                            navigate(`/${nextBookId}/${nextBookChapters[0]}`);
                        } else {
                            setIsPlaying(false); // End of content
                        }
                    } else {
                        setIsPlaying(false); // End of all books
                    }
                }
            }, 3000); // 3 seconds per chapter
        }
        return () => clearInterval(interval);
    }, [isPlaying, chapters, bookId, chapterId, navigate]);

    // Helper to get interactions for selected node
    const getInteractions = () => {
        if (!selectedNode || !bookId || !chapterId || !data) return [];
        const dataKey = `Chapter ${chapterId}`;
        const chapterData = data[dataKey];
        if (!chapterData) return [];

        // Find links connected to selected node
        return chapterData.links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
            .map(l => {
                const otherId = l.source === selectedNode.id ? l.target : l.source;
                // Find the other node object to get its group
                const otherNode = chapterData.nodes.find(n => n.id === otherId);
                return {
                    otherId,
                    otherNode,
                    value: l.value,
                    interactions: l.interactions
                };
            })
            .sort((a, b) => b.value - a.value); // Sort by strength
    };

    const nodeInteractions = getInteractions();

    // Get current chapter data for analysis and filters
    const currentChapterData = (bookId && chapterId && data) ? data[`Chapter ${chapterId}`] : null;

    // Extract unique groups and interaction types for filters
    const availableGroups = React.useMemo(() => {
        if (!currentChapterData) return [];
        const groups = new Set(currentChapterData.nodes.map(n => n.groupName || 'Unknown'));
        return Array.from(groups).sort();
    }, [currentChapterData]);

    const availableInteractionTypes = React.useMemo(() => {
        if (!currentChapterData) return [];
        const types = new Set<string>();
        currentChapterData.links.forEach(l => l.interactions.forEach(i => types.add(i.type)));
        return Array.from(types).sort();
    }, [currentChapterData]);

    // Auto-select tab based on context
    const [activeTab, setActiveTab] = useState<string | null>('analysis');

    useEffect(() => {
        if (selectedNode) {
            setActiveTab('inspector');
        }
    }, [selectedNode]);

    return (
        <Stack gap="sm" h="100%" p="md">
            {/* Navigation / Playback Header */}
            <Box pb="xs">
                <Button
                    fullWidth
                    variant={isPlaying ? "light" : "filled"}
                    color={isPlaying ? "red" : "primary"}
                    onClick={() => setIsPlaying(!isPlaying)}
                    mb="xs"
                >
                    {isPlaying ? "Pause Auto-Play" : "Start Auto-Play"}
                </Button>
                <TextInput
                    placeholder="Search character..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                    rightSection="🔍"
                    radius="md"
                    size="xs"
                />
            </Box>

            <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="sm" color="primary" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <Tabs.List grow mb="md">
                    <Tabs.Tab value="analysis">Analysis</Tabs.Tab>
                    <Tabs.Tab value="filters">Filters</Tabs.Tab>
                    <Tabs.Tab value="inspector">Inspector</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="analysis" style={{ flex: 1, overflow: 'hidden' }}>
                    <ScrollArea h="100%" offsetScrollbars>
                        {currentChapterData ? (
                            <AnalysisPanel nodes={currentChapterData.nodes} links={currentChapterData.links} />
                        ) : (
                            <Text c="dimmed" size="sm">Loading data...</Text>
                        )}
                    </ScrollArea>
                </Tabs.Panel>

                <Tabs.Panel value="filters" style={{ flex: 1, overflow: 'hidden' }}>
                    <ScrollArea h="100%" offsetScrollbars>
                        <Stack gap="lg">
                            <Box>
                                <Title order={6} mb="xs" tt="uppercase" c="dimmed">Graph Settings</Title>
                                <Stack gap="xs">
                                    <Box>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="xs" fw={600}>Min Connections</Text>
                                            <Badge variant="light" color="gray">{minConnections}</Badge>
                                        </Group>
                                        <Slider
                                            min={1}
                                            max={10}
                                            value={minConnections}
                                            onChange={setMinConnections}
                                            color="primary"
                                            size="sm"
                                        />
                                    </Box>
                                    <Box>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="xs" fw={600}>Force Strength</Text>
                                            <Badge variant="light" color="gray">{forceStrength}</Badge>
                                        </Group>
                                        <Slider
                                            min={1}
                                            max={100}
                                            value={forceStrength}
                                            onChange={setForceStrength}
                                            color="primary"
                                            size="sm"
                                        />
                                    </Box>
                                </Stack>
                            </Box>

                            <Divider />

                            <Box>
                                <Title order={6} mb="xs" tt="uppercase" c="dimmed">Groups</Title>
                                <MultiSelect
                                    data={availableGroups}
                                    value={selectedGroups.length > 0 ? selectedGroups : []}
                                    onChange={setSelectedGroups}
                                    placeholder="Filter by group..."
                                    searchable
                                    clearable
                                    nothingFoundMessage="No groups found"
                                    hidePickedOptions
                                    label="Show only selected groups"
                                    description="Leave empty to show all"
                                />
                            </Box>

                            <Box>
                                <Title order={6} mb="xs" tt="uppercase" c="dimmed">Interaction Types</Title>
                                <Stack gap="xs">
                                    {availableInteractionTypes.map(type => (
                                        <Checkbox
                                            key={type}
                                            label={type}
                                            checked={selectedInteractionTypes.length === 0 || selectedInteractionTypes.includes(type)}
                                            onChange={(e) => {
                                                const checked = e.currentTarget.checked;
                                                if (selectedInteractionTypes.length === 0) {
                                                    // If currently "all", and we uncheck one, we need to select all others
                                                    if (!checked) {
                                                        setSelectedInteractionTypes(availableInteractionTypes.filter(t => t !== type));
                                                    } else {
                                                        // If currently "all" and we check one... wait, logic for "all" is empty array.
                                                        // If we are starting from empty (all), clicking one usually means "only this one" or "toggle this one"?
                                                        // Let's stick to: Empty = All.
                                                        // If user clicks a checkbox when Empty:
                                                        // It's ambiguous. Let's assume standard filter behavior:
                                                        // If Empty, and user clicks one, it becomes [type] (only that one).
                                                        // But here we are rendering checkboxes as "checked".
                                                        // So if it's checked (because Empty=All), and user clicks it to uncheck...
                                                        // Then we want everything EXCEPT this one.
                                                        setSelectedInteractionTypes(availableInteractionTypes.filter(t => t !== type));
                                                    }
                                                } else {
                                                    if (checked) {
                                                        setSelectedInteractionTypes([...selectedInteractionTypes, type]);
                                                    } else {
                                                        setSelectedInteractionTypes(selectedInteractionTypes.filter(t => t !== type));
                                                    }
                                                }
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        </Stack>
                    </ScrollArea>
                </Tabs.Panel>

                <Tabs.Panel value="inspector" style={{ flex: 1, overflow: 'hidden' }}>
                    <ScrollArea h="100%" offsetScrollbars>
                        <Paper withBorder p="md" shadow="sm" radius="md" bg="gray.0">
                            {selectedNode ? (
                                <Stack gap="sm">
                                    <Box>
                                        <Title order={4} style={{ fontFamily: 'var(--mantine-font-family-headings)', color: 'var(--mantine-color-primary-9)' }}>
                                            {selectedNode.id}
                                        </Title>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{selectedNode.groupName || 'Unknown Group'}</Text>
                                    </Box>

                                    <Group gap="xs">
                                        <Badge color="primary" variant="light">Degree: {selectedNode.degree || 0}</Badge>
                                        <Badge color="gray" variant="light">{nodeInteractions.length} Connections</Badge>
                                    </Group>

                                    <Divider my="xs" label="Interactions" labelPosition="center" />

                                    {nodeInteractions.length > 0 ? (
                                        <Accordion variant="separated" radius="md" chevronPosition="left">
                                            {nodeInteractions.map((interaction) => (
                                                <Accordion.Item key={interaction.otherId} value={interaction.otherId} mb="xs">
                                                    <Accordion.Control>
                                                        <Group justify="space-between">
                                                            <Text size="sm" fw={600}>{interaction.otherId}</Text>
                                                            <Badge size="xs" circle>{interaction.value}</Badge>
                                                        </Group>
                                                    </Accordion.Control>
                                                    <Accordion.Panel>
                                                        <Stack gap="xs">
                                                            {interaction.interactions.map((detail, idx) => (
                                                                <Paper key={idx} p="xs" bg="gray.1" radius="sm">
                                                                    <Text size="xs" fw={700} c="primary" mb={2}>{detail.type}</Text>
                                                                    <Text size="xs" style={{ lineHeight: 1.4 }}>"{detail.snippet}"</Text>
                                                                </Paper>
                                                            ))}
                                                        </Stack>
                                                    </Accordion.Panel>
                                                </Accordion.Item>
                                            ))}
                                        </Accordion>
                                    ) : (
                                        <Text size="sm" c="dimmed" fs="italic">No visible connections in this chapter.</Text>
                                    )}
                                </Stack>
                            ) : (
                                <Stack align="center" py="xl" gap="xs">
                                    <ThemeIcon size="xl" radius="xl" variant="light" color="gray">
                                        <Text size="xl">👆</Text>
                                    </ThemeIcon>
                                    <Text c="dimmed" fs="italic" size="sm" ta="center">
                                        Select a node to view details and evidence.
                                    </Text>
                                </Stack>
                            )}
                        </Paper>
                    </ScrollArea>
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
};

export default ControlsSidebar;
