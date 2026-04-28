import React, { useEffect } from 'react';
import { Center, Text, Box, Paper, Switch, Group } from '@mantine/core';
import { useData } from '../../context/DataContext';
import { useAnalytics } from '../../context/AnalyticsContext';
import D3ForceGraph from './D3ForceGraph';
import { IconChartDots, IconChartLine } from '@tabler/icons-react';

const GraphView: React.FC = () => {
    const { filteredGraphData, loading, currentBook, currentChapter } = useData();
    const { 
        isAnalyticsMode, setIsAnalyticsMode,
        setSelectedKnowledgeNode, setSelectedKnowledgeEdge 
    } = useAnalytics();
    
    // Reset selection when navigation changes
    useEffect(() => {
        setSelectedKnowledgeNode(null);
        setSelectedKnowledgeEdge(null);
    }, [currentBook, currentChapter, setSelectedKnowledgeNode, setSelectedKnowledgeEdge]);
    
    // Default force strength since we removed the slider
    const forceStrength = -200;

    if (loading) {
        return <Center h="100%"><Text c="dimmed">Loading knowledge graph...</Text></Center>;
    }

    if (!filteredGraphData || !filteredGraphData.nodes.length) {
        return (
            <Center h="100%">
                <Text c="dimmed" size="lg">No interaction data found for Book {currentBook} Chapter {currentChapter}.</Text>
            </Center>
        );
    }

    return (
        <Box w="100%" h="100%" bg={isAnalyticsMode ? "gray.0" : "gray.1"} pos="relative" style={{ transition: 'background-color 0.5s ease' }}>
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
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}
            >
                <Text size="md" fw={700} ff="serif" c="dark.6">
                    Character Network: Book {currentBook} {currentChapter === 'all' ? '(All Chapters)' : `- Chapter ${currentChapter}`}
                </Text>
                
                <Box style={{ width: '1px', height: '20px', backgroundColor: '#e9ecef' }} />
                
                <Group gap="xs">
                    <Text size="sm" fw={500} c={isAnalyticsMode ? "blue.6" : "dimmed"}>Analytics Mode</Text>
                    <Switch 
                        checked={isAnalyticsMode} 
                        onChange={(event) => setIsAnalyticsMode(event.currentTarget.checked)} 
                        color="blue"
                        size="md"
                        onLabel={<IconChartLine size="1rem" stroke={2.5} color="var(--mantine-color-white)" />}
                        offLabel={<IconChartDots size="1rem" stroke={2.5} color="var(--mantine-color-gray-5)" />}
                    />
                </Group>
            </Paper>

            <D3ForceGraph
                nodes={filteredGraphData.nodes}
                links={filteredGraphData.links}
                forceStrength={forceStrength}
            />
        </Box>
    );
};

export default GraphView;
