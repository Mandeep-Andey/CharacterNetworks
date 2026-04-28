import React, { useState } from 'react';
import { Box, Select, Stack, Text, Divider, Modal, Button, Group } from '@mantine/core';
import { useAnalytics } from '../../context/AnalyticsContext';
import { useData } from '../../context/DataContext';
import { IconInfoCircle } from '@tabler/icons-react';

const ControlsSidebar: React.FC = () => {
    const { isAnalyticsMode, colorBy, setColorBy, sizeBy, setSizeBy } = useAnalytics();
    const {
        currentBook, setCurrentBook,
        currentChapter, setCurrentChapter,
        availableBooks, availableChapters
    } = useData();
    const [aboutOpen, setAboutOpen] = useState(false);

    return (
        <Stack gap="md">
            <Button 
                variant="light" 
                color="blue" 
                leftSection={<IconInfoCircle size="1.2rem" />}
                onClick={() => setAboutOpen(true)}
                fullWidth
            >
                About This Graph
            </Button>

            <Divider />

            <Stack gap="xs">
                <Text fw={600} size="sm">Narrative Navigation</Text>
                <Group grow>
                    <Select
                        label="Book"
                        data={availableBooks.map(b => ({ value: b, label: `Book ${b}` }))}
                        value={currentBook}
                        onChange={(val) => {
                            setCurrentBook(val || '1');
                            setCurrentChapter('all'); 
                        }}
                        size="xs"
                    />
                    <Select
                        label="Chapter"
                        data={[
                            { value: 'all', label: 'All Chapters' },
                            ...availableChapters.map(c => ({ value: c, label: `Chapter ${c}` }))
                        ]}
                        value={currentChapter}
                        onChange={(val) => setCurrentChapter(val || 'all')}
                        size="xs"
                    />
                </Group>
            </Stack>

            <Divider />

            {!isAnalyticsMode ? (
                <Box p="sm" bg="gray.0" style={{ borderRadius: '8px' }}>
                    <Text size="sm" c="dimmed" ta="center">
                        Analytics Mode is disabled. Enable it from the top control bar to unlock advanced filters and narrative metrics.
                    </Text>
                </Box>
            ) : (
                <Box>
                    <Text fw={600} mb="xs">Advanced Controls</Text>
                    <Stack gap="sm">
                        <Select
                            label="Color Nodes By"
                            data={[
                                { value: 'community', label: 'Family/Clique' },
                                { value: 'social_class', label: 'Social Class' },
                                { value: 'gender', label: 'Gender' }
                            ]}
                            value={colorBy}
                            onChange={(val) => setColorBy(val as any)}
                        />
                        <Select
                            label="Size Nodes By"
                            data={[
                                { value: 'uniform', label: 'Uniform Size' },
                                { value: 'total_events', label: 'Total Events (Prominence)' },
                                { value: 'agency_score', label: 'Agency Score' }
                            ]}
                            value={sizeBy}
                            onChange={(val) => setSizeBy(val as any)}
                        />
                        <Text size="xs" c="dimmed" mt="xs">
                            Select nodes or edges in the graph to see detailed textual evidence and exact metric values in the right panel.
                        </Text>
                    </Stack>
                </Box>
            )}

            <Modal opened={aboutOpen} onClose={() => setAboutOpen(false)} title="About This Graph" size="lg" centered>
                <Stack gap="md">
                    <Text fw={700}>Interacting with the Graph</Text>
                    <Text size="sm">
                        - <b>Pan & Zoom:</b> Scroll or drag the background to explore.
                        <br/>- <b>Hover:</b> Hover over a character to see their name and highlight their connections.
                        <br/>- <b>Click Node:</b> Select a character to view their profile in the right panel.
                        <br/>- <b>Click Edge:</b> Click the line between two characters to read the actual book excerpts where they interact.
                    </Text>
                    
                    <Divider />

                    <Text fw={700}>Glossary of Metrics (Analytics Mode)</Text>
                    <Text size="sm">
                        <b>Agency Score:</b> Measures a character's active involvement in the narrative. A high score means they initiate many events, while a low score means they are mostly recipients.
                    </Text>
                    <Text size="sm">
                        <b>Influence Ratio:</b> Indicates how much a character influences others or is discussed in the narrative context.
                    </Text>
                    <Text size="sm">
                        <b>Mention in Absence:</b> Count of times a character is talked about when not physically present, reflecting their reputation or gossip value.
                    </Text>
                </Stack>
            </Modal>
        </Stack>
    );
};

export default ControlsSidebar;
