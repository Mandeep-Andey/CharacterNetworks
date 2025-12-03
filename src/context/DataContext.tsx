import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types based on expected JSON structure
export interface Node {
    id: string;
    group: number;
    // Add other properties as discovered
}

export interface Link {
    source: string;
    target: string;
    value: number;
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
}

export interface ChapterData {
    [key: string]: GraphData;
}

interface DataContextType {
    data: ChapterData | null;
    loading: boolean;
    error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<ChapterData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // TODO: Load actual JSON files here
                // For now, we'll simulate loading or load empty/mock data if files are missing
                // const response = await fetch('/src/data/combined_chapters.json');
                // const jsonData = await response.json();
                setData({}); // Placeholder
                setLoading(false);
            } catch (err) {
                console.error("Failed to load data", err);
                setError("Failed to load data");
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return (
        <DataContext.Provider value={{ data, loading, error }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
