import React, { useEffect } from 'react';
import { Center, Text, Box, Paper, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useExperimentalData } from '../../context/ExperimentalDataContext';
import { useControls } from '../../context/ControlsContext';
import D3ForceGraph from './D3ForceGraph';

interface ExperimentalGraphViewProps {
    bookId?: string;
    chapterId?: string;
}

const ExperimentalGraphView: React.FC<ExperimentalGraphViewProps> = ({ bookId, chapterId }) => {
    const { currentChapter, setCurrentChapter, availableChapters, graphData, loading } = useExperimentalData();
    const { forceStrength } = useControls();
    const navigate = useNavigate();

    // Sync route with context
    useEffect(() => {
        if (chapterId && chapterId !== currentChapter) {
            // Only sync if it's a valid experimental chapter.
            // If the user navigates randomly via URL, ExperimentalDataContext will try its best
            // and fallback gracefully if it doesn't exist in EXPERIMENTAL_SOURCES.
            setCurrentChapter(chapterId);
        }
    }, [chapterId, currentChapter, setCurrentChapter]);

    if (loading) {
        return <Center h="100%"><Text c="dimmed">Loading graph data...</Text></Center>;
    }

    // If chapterId isn't loaded or doesn't exist in our current scope
    if (!graphData || !availableChapters.includes(chapterId || '')) {
        return (
            <Center h="100%" style={{ flexDirection: 'column', gap: '1rem' }}>
                <Text c="dimmed" size="lg">Graph data not available for Chapter {chapterId}.</Text>
                <Text size="sm">Processed data currently resides in chapters: {availableChapters.join(', ')}.</Text>
                {availableChapters.length > 0 && (
                    <Button variant="light" onClick={() => navigate(`/${bookId}/${availableChapters[0]}`)}>
                        Jump to Chapter {availableChapters[0]}
                    </Button>
                )}
            </Center>
        );
    }

    return (
        <Box w="100%" h="100%" bg="gray.1" pos="relative">
            <Paper
                pos="absolute"
                top={20}
                left="50%"
                px="lg"
                py="xs"
                shadow="md"
                radius="md"
                withBorder
                style={{
                    zIndex: 10,
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    transform: 'translateX(-50%)',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                }}
            >
                <Text size="md" fw={700} ff="serif" c="dark.6">
                    Viewing: Chapter {chapterId}
                </Text>
            </Paper>
            <D3ForceGraph
                nodes={graphData.nodes as any}
                links={graphData.links as any}
                forceStrength={forceStrength}
            />
        </Box>
    );
};

export default ExperimentalGraphView;
