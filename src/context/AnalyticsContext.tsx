import React, { createContext, useContext, useState, ReactNode } from 'react';
import { KnowledgeNode, KnowledgeEdge } from './DataContext';

interface AnalyticsContextType {
    isAnalyticsMode: boolean;
    setIsAnalyticsMode: (mode: boolean) => void;
    selectedKnowledgeNode: KnowledgeNode | null;
    setSelectedKnowledgeNode: (node: KnowledgeNode | null) => void;
    selectedKnowledgeEdge: KnowledgeEdge | null;
    setSelectedKnowledgeEdge: (edge: KnowledgeEdge | null) => void;
    colorBy: 'community' | 'social_class' | 'gender';
    setColorBy: (val: 'community' | 'social_class' | 'gender') => void;
    sizeBy: 'uniform' | 'total_events' | 'agency_score';
    setSizeBy: (val: 'uniform' | 'total_events' | 'agency_score') => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAnalyticsMode, setIsAnalyticsMode] = useState<boolean>(false);
    const [selectedKnowledgeNode, setSelectedKnowledgeNode] = useState<KnowledgeNode | null>(null);
    const [selectedKnowledgeEdge, setSelectedKnowledgeEdge] = useState<KnowledgeEdge | null>(null);
    const [colorBy, setColorBy] = useState<'community' | 'social_class' | 'gender'>('community');
    const [sizeBy, setSizeBy] = useState<'uniform' | 'total_events' | 'agency_score'>('uniform');

    return (
        <AnalyticsContext.Provider value={{
            isAnalyticsMode,
            setIsAnalyticsMode,
            selectedKnowledgeNode,
            setSelectedKnowledgeNode,
            selectedKnowledgeEdge,
            setSelectedKnowledgeEdge,
            colorBy,
            setColorBy,
            sizeBy,
            setSizeBy
        }}>
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error('useAnalytics must be used within an AnalyticsProvider');
    }
    return context;
};
