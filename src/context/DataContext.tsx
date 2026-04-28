import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import networkKnowledgeRaw from '../data/new_pipeline data/network_knowledge.json';

// We must cast the raw JSON to our interfaces.
// The JSON has a specific shape we need to define.

export interface InteractionEvidence {
    xml_id: string;
    book: number;
    chapter: number;
    text: string;
}

export interface KnowledgeMetrics {
    agency_score: number;
    influence_ratio: number;
    total_events: number;
    initiator_count: number;
    recipient_count: number;
    mention_in_absence_count: number;
}

export interface KnowledgeNode {
    id: string;
    display_name: string;
    family_clique: string;
    social_class: string;
    gender: string;
    metrics: KnowledgeMetrics;
}

export interface KnowledgeEdge {
    source: string;
    target: string;
    total_weight: number;
    evidence: InteractionEvidence[];
}

export interface KnowledgeGraphData {
    nodes: KnowledgeNode[];
    links: KnowledgeEdge[];
}

interface DataContextType {
    graphData: KnowledgeGraphData | null;
    filteredGraphData: KnowledgeGraphData | null;
    loading: boolean;
    currentBook: string;
    setCurrentBook: (val: string) => void;
    currentChapter: string;
    setCurrentChapter: (val: string) => void;
    availableBooks: string[];
    availableChapters: string[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentBook, setCurrentBook] = useState<string>('1');
    const [currentChapter, setCurrentChapter] = useState<string>('all');

    useEffect(() => {
        setLoading(true);
        try {
            // The JSON is imported directly, so we can just use it
            const data = networkKnowledgeRaw as any;
            
            // Map links source/target to string IDs if they aren't already
            const processedLinks = data.edges.map((edge: any) => ({
                ...edge,
                source: edge.source,
                target: edge.target,
            }));

            // Artificial delay to allow smooth transitions and indicate loading state to the user
            setTimeout(() => {
                setGraphData({
                    nodes: data.nodes,
                    links: processedLinks
                });
                setLoading(false);
            }, 300);
        } catch (error) {
            console.error("Failed to parse network_knowledge.json", error);
            setLoading(false);
        }
    }, []);

    const availableBooks = useMemo(() => {
        if (!graphData) return [];
        const books = new Set<string>();
        graphData.links.forEach(link => {
            link.evidence.forEach(ev => books.add(ev.book.toString()));
        });
        return Array.from(books).sort((a, b) => parseInt(a) - parseInt(b));
    }, [graphData]);

    const availableChapters = useMemo(() => {
        if (!graphData) return [];
        const chapters = new Set<string>();
        graphData.links.forEach(link => {
            link.evidence.forEach(ev => {
                if (ev.book.toString() === currentBook) {
                    chapters.add(ev.chapter.toString());
                }
            });
        });
        return Array.from(chapters).sort((a, b) => parseInt(a) - parseInt(b));
    }, [graphData, currentBook]);

    const filteredGraphData = useMemo(() => {
        if (!graphData) return null;
        
        const bookNum = parseInt(currentBook);
        const chapterNum = currentChapter === 'all' ? null : parseInt(currentChapter);

        // First filter links based on book and (optionally) chapter
        const filteredLinks = graphData.links.filter(link => 
            link.evidence.some(ev => 
                ev.book === bookNum && (chapterNum === null || ev.chapter === chapterNum)
            )
        ).map(link => ({
            ...link,
            // Only keep evidence related to the current selection for clarity in sidebar
            evidence: link.evidence.filter(ev => 
                ev.book === bookNum && (chapterNum === null || ev.chapter === chapterNum)
            )
        }));

        // Identify which nodes are present in these filtered links
        const activeNodeIds = new Set<string>();
        filteredLinks.forEach(link => {
            activeNodeIds.add(link.source);
            activeNodeIds.add(link.target);
        });

        // Filter nodes
        const filteredNodes = graphData.nodes.filter(node => activeNodeIds.has(node.id));

        return {
            nodes: filteredNodes,
            links: filteredLinks
        };
    }, [graphData, currentBook, currentChapter]);

    return (
        <DataContext.Provider value={{ 
            graphData, 
            filteredGraphData,
            loading,
            currentBook,
            setCurrentBook,
            currentChapter,
            setCurrentChapter,
            availableBooks,
            availableChapters
        }}>
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
