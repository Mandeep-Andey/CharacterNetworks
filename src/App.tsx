import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import MainLayout from './components/layout/MainLayout';
import D3ForceGraph from './components/graph/D3ForceGraph';

import { Center, Text, Box, Paper } from '@mantine/core';

const GraphView = () => {
  const { bookId, chapterId } = useParams();
  const { data, loading } = useData();
  const { selectedGroups, selectedInteractionTypes, minConnections, forceStrength } = useControls();

  if (loading || !data) {
    return <Center h="100%"><Text c="dimmed">Loading graph data...</Text></Center>;
  }

  // Construct key to match JSON structure (e.g., "BookI_1")
  // Note: bookId from URL might be "BookI" and chapterId "1"
  const dataKey = `Chapter ${chapterId}`;
  const chapterData = data[dataKey];

  if (!chapterData) {
    return (
      <Center h="100%">
        <Text c="dimmed">Data not found for {bookId} Chapter {chapterId}</Text>
      </Center>
    );
  }

  const { graphNodes, graphLinks } = React.useMemo(() => {
    const fNodes = chapterData.nodes.filter(node => {
      if ((node.degree || 0) < minConnections) return false;
      if (selectedGroups.length === 0) return true;
      return selectedGroups.includes(node.groupName || 'Unknown');
    });

    const filteredNodeIds = new Set(fNodes.map(n => n.id));

    const fLinks = chapterData.links.filter(link => {
      if (!filteredNodeIds.has(link.source) || !filteredNodeIds.has(link.target)) return false;
      if (selectedInteractionTypes.length === 0) return true;
      return link.interactions.some(i => selectedInteractionTypes.includes(i.type));
    });

    return {
      graphNodes: fNodes.map(n => ({ ...n })),
      graphLinks: fLinks.map(l => ({ ...l }))
    };
  }, [chapterData, minConnections, selectedGroups, selectedInteractionTypes]);

  return (
    <Box w="100%" h="100%" bg="gray.0" pos="relative">
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
        <Text size="md" fw={600} ff="serif" c="dark.4">
          Viewing: {bookId?.replace(/([A-Z])/g, ' $1').trim()} - Chapter {chapterId}
        </Text>
      </Paper>
      <D3ForceGraph
        nodes={graphNodes}
        links={graphLinks}
        forceStrength={forceStrength}
      />
    </Box>
  );
};

import { SelectionProvider } from './context/SelectionContext';
import { ControlsProvider, useControls } from './context/ControlsContext';

function App() {
  return (
    <Router>
      <DataProvider>
        <ControlsProvider>
          <SelectionProvider>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to="/BookI/1" replace />} />
                <Route path=":bookId/:chapterId" element={<GraphView />} />
              </Route>
            </Routes>
          </SelectionProvider>
        </ControlsProvider>
      </DataProvider>
    </Router>
  );
}

export default App;