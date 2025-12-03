import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import combinedChaptersData from '../data/combined_chapters_all_books_1_86_merged_final.json';
import chapterToBookData from '../data/chapter_to_book.json';
import charactersGroupedData from '../data/middlemarch_characters_grouped.json';
import { detectCommunities } from '../utils/louvain';

import aliasesData from '../data/aliases.json';

// Define types based on expected JSON structure
export interface InteractionDetail {
    type: string;
    snippet: string;
}

export interface Node {
    id: string;
    group: number;
    groupName: string;
    degree?: number;
    community?: number;
}

export interface Link {
    source: string;
    target: string;
    value: number;
    interactions: InteractionDetail[];
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
}

export interface ChapterData {
    [key: string]: GraphData;
}

export interface BookChapters {
    [key: string]: number[];
}

export interface CharacterGroup {
    [key: string]: string[];
}

interface DataContextType {
    data: ChapterData;
    chapters: BookChapters | null;
    groups: CharacterGroup | null;
    loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to resolve aliases
// Pre-process aliases for case-insensitive lookup
const aliasMap = new Map<string, string>();
Object.entries(aliasesData).forEach(([key, value]) => {
    aliasMap.set(key.toLowerCase().trim(), value);
});

const resolveName = (name: string): string => {
    if (!name) return "";
    const lower = name.toLowerCase().trim();
    return aliasMap.get(lower) || name.trim();
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<ChapterData>({});
    const [chapters, setChapters] = useState<BookChapters | null>(null);
    const [groups, setGroups] = useState<CharacterGroup | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            // Process groups for easier lookup
            const groupMap = new Map<string, { id: number, name: string }>();
            const rawGroups = charactersGroupedData as CharacterGroup;

            Object.keys(rawGroups).forEach((groupName, index) => {
                rawGroups[groupName].forEach(charName => {
                    // We should also map the canonical names in groups if they aren't already
                    // But usually groups file uses canonical names.
                    groupMap.set(charName, { id: index + 1, name: groupName });
                });
            });

            // Transform the raw data into the expected GraphData structure
            const rawData = combinedChaptersData as any;
            const transformedData: ChapterData = {};

            Object.keys(rawData).forEach(chapterKey => {
                const chapter = rawData[chapterKey];

                // Collect all unique characters (resolved)
                const uniqueChars = new Set<string>();

                // Process explicit characters list
                (chapter.characters || []).forEach((charName: string) => {
                    uniqueChars.add(resolveName(charName));
                });

                // Process interactions to find characters and resolve them
                (chapter.interactions || []).forEach((interaction: any) => {
                    if (interaction.character_1) uniqueChars.add(resolveName(interaction.character_1));
                    if (interaction.character_2) uniqueChars.add(resolveName(interaction.character_2));
                });

                // Create links first to use for community detection
                const linkMap = new Map<string, Link>();
                (chapter.interactions || []).forEach((interaction: any) => {
                    const source = resolveName(interaction.character_1);
                    const target = resolveName(interaction.character_2);

                    if (!source || !target || source === target) return; // Skip invalid or self-loops if desired

                    const [p1, p2] = [source, target].sort();
                    const key = `${p1}|${p2}`;

                    if (linkMap.has(key)) {
                        const link = linkMap.get(key)!;
                        link.value += 1;
                        link.interactions.push({
                            type: interaction.interaction_type,
                            snippet: interaction.evidence_snippet
                        });
                    } else {
                        linkMap.set(key, {
                            source,
                            target,
                            value: 1,
                            interactions: [{
                                type: interaction.interaction_type,
                                snippet: interaction.evidence_snippet
                            }]
                        });
                    }
                });
                const links = Array.from(linkMap.values());

                // Detect communities
                const nodesForCommunity = Array.from(uniqueChars).map(id => ({ id }));
                const communities = detectCommunities(nodesForCommunity, links);

                // Create nodes with community info
                const nodes: Node[] = Array.from(uniqueChars).map((charName: string) => {
                    const groupInfo = groupMap.get(charName) || { id: 0, name: 'Unknown' };
                    return {
                        id: charName,
                        group: groupInfo.id,
                        groupName: groupInfo.name,
                        degree: 0,
                        community: communities[charName] || 0
                    };
                });

                // Calculate degrees
                const degreeMap = new Map<string, number>();
                links.forEach(link => {
                    degreeMap.set(link.source, (degreeMap.get(link.source) || 0) + link.value);
                    degreeMap.set(link.target, (degreeMap.get(link.target) || 0) + link.value);
                });

                nodes.forEach(node => {
                    node.degree = degreeMap.get(node.id) || 0;
                });

                transformedData[chapterKey] = { nodes, links };
            });

            // Transform chapter-to-book mapping
            const rawChapterToBook = chapterToBookData as Record<string, number>;
            const bookChaptersMap: BookChapters = {};
            const toRoman = (num: number) => {
                const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
                return roman[num] || num.toString();
            };

            Object.entries(rawChapterToBook).forEach(([chapterStr, bookNum]) => {
                const bookName = `Book ${toRoman(bookNum)}`;
                if (!bookChaptersMap[bookName]) {
                    bookChaptersMap[bookName] = [];
                }
                bookChaptersMap[bookName].push(parseInt(chapterStr));
            });

            Object.keys(bookChaptersMap).forEach(book => {
                bookChaptersMap[book].sort((a, b) => a - b);
            });

            setData(transformedData);
            setChapters(bookChaptersMap);
            setGroups(rawGroups);
            setLoading(false);

        } catch (err) {
            console.error("Failed to load data", err);
            setLoading(false);
        }
    }, []);

    return (
        <DataContext.Provider value={{ data, chapters, groups, loading }}>
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
