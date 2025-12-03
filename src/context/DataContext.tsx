import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import combinedChaptersData from '../data/combined_chapters_all_books_1_86_merged_final.json';
import chapterToBookData from '../data/chapter_to_book.json';
import charactersGroupedData from '../data/middlemarch_characters_grouped.json';

// Define types based on expected JSON structure
export interface InteractionDetail {
    type: string;
    snippet: string;
}

export interface Node {
    id: string;
    group: number;
    groupName: string;
    degree?: number; // Add degree for sizing
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
                    groupMap.set(charName, { id: index + 1, name: groupName });
                });
            });

            // Transform the raw data into the expected GraphData structure
            const rawData = combinedChaptersData as any;
            const transformedData: ChapterData = {};

            Object.keys(rawData).forEach(chapterKey => {
                const chapter = rawData[chapterKey];

                // Collect all unique characters from both the 'characters' list and 'interactions'
                const uniqueChars = new Set<string>(chapter.characters || []);
                (chapter.interactions || []).forEach((interaction: any) => {
                    if (interaction.character_1) uniqueChars.add(interaction.character_1);
                    if (interaction.character_2) uniqueChars.add(interaction.character_2);
                });

                // Create nodes
                const nodes: Node[] = Array.from(uniqueChars).map((charName: string) => {
                    const groupInfo = groupMap.get(charName) || { id: 0, name: 'Unknown' };
                    return {
                        id: charName,
                        group: groupInfo.id,
                        groupName: groupInfo.name,
                        degree: 0 // Will be calculated based on links
                    };
                });

                // Create links and aggregate interactions
                const linkMap = new Map<string, Link>();

                (chapter.interactions || []).forEach((interaction: any) => {
                    const source = interaction.character_1;
                    const target = interaction.character_2;

                    // Ensure consistent ordering for the key to aggregate A->B and B->A
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

            // Transform chapter-to-book mapping into Book -> Chapters structure
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

            // Sort chapters for each book
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
