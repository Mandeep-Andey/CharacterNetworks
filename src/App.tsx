import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/layout/MainLayout';
import D3ForceGraph from './components/graph/D3ForceGraph';

// Mock data for graph
const MOCK_NODES = [
  { id: "Dorothea", group: 1 },
  { id: "Casaubon", group: 1 },
  { id: "Lydgate", group: 2 },
  { id: "Rosamond", group: 2 },
  { id: "Fred", group: 3 },
  { id: "Mary", group: 3 },
  { id: "Ladislaw", group: 1 },
];

const MOCK_LINKS = [
  { source: "Dorothea", target: "Casaubon", value: 5 },
  { source: "Dorothea", target: "Ladislaw", value: 3 },
  { source: "Lydgate", target: "Rosamond", value: 5 },
  { source: "Fred", target: "Mary", value: 4 },
  { source: "Rosamond", target: "Fred", value: 1 },
];

const GraphView = () => {
  const { bookId, chapterId } = useParams();

  // In a real app, we would filter data based on bookId and chapterId
  // For now, we just pass the mock data

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1 rounded shadow text-sm font-serif">
        Viewing: {bookId} - Chapter {chapterId}
      </div>
      <D3ForceGraph
        nodes={MOCK_NODES.map(n => ({ ...n }))} // Clone to avoid mutation issues in strict mode
        links={MOCK_LINKS.map(l => ({ ...l }))}
      />
    </div>
  );
};

import { SelectionProvider } from './context/SelectionContext';

function App() {
  return (
    <Router>
      <DataProvider>
        <SelectionProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/BookI/1" replace />} />
              <Route path=":bookId/:chapterId" element={<GraphView />} />
            </Route>
          </Routes>
        </SelectionProvider>
      </DataProvider>
    </Router>
  );
}

export default App;