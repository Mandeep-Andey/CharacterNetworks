// import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import MainLayout from './components/layout/MainLayout';
import GraphView from './components/graph/GraphView';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <DataProvider>
        <AnalyticsProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<GraphView />} />
            </Route>
          </Routes>
        </AnalyticsProvider>
      </DataProvider>
    </Router>
  );
}

export default App;