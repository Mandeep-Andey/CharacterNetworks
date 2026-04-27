import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    parseInteractionsJsonl,
    buildExperimentalGraphData,
    ExperimentalGraphData,
    LintReport,
    InteractionEvent
} from '../utils/experimentalParser';

import ch1Interactions from '../data/new_pipeline data/book_1/chapter_1/interactions.jsonl?raw';
import ch15Interactions from '../data/new_pipeline data/book_2/chapter_15/interactions.jsonl?raw';
import ch48Interactions from '../data/new_pipeline data/book_5/chapter_48/interactions.jsonl?raw';

import ch1Lint from '../data/new_pipeline data/book_1/chapter_1/evidence_lint_report.json';
import ch15Lint from '../data/new_pipeline data/book_2/chapter_15/evidence_lint_report.json';
import ch48Lint from '../data/new_pipeline data/book_5/chapter_48/evidence_lint_report.json';

const EXPERIMENTAL_SOURCES: Record<string, { interactions: string; lint: any }> = {
    "1": { interactions: ch1Interactions, lint: ch1Lint },
    "15": { interactions: ch15Interactions, lint: ch15Lint },
    "48": { interactions: ch48Interactions, lint: ch48Lint }
};

interface ExperimentalDataContextType {
    currentChapter: string;
    setCurrentChapter: (ch: string) => void;
    availableChapters: string[];
    graphData: ExperimentalGraphData | null;
    rawEvents: InteractionEvent[];
    lintReport: LintReport | null;
    loading: boolean;
}

const ExperimentalDataContext = createContext<ExperimentalDataContextType | undefined>(undefined);

export const ExperimentalDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentChapter, setCurrentChapter] = useState<string>("1");
    const [graphData, setGraphData] = useState<ExperimentalGraphData | null>(null);
    const [rawEvents, setRawEvents] = useState<InteractionEvent[]>([]);
    const [lintReport, setLintReport] = useState<LintReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const availableChapters = Object.keys(EXPERIMENTAL_SOURCES).sort((a, b) => parseInt(a) - parseInt(b));

    useEffect(() => {
        setLoading(true);
        try {
            const source = EXPERIMENTAL_SOURCES[currentChapter];
            if (!source) {
                setGraphData(null);
                setLintReport(null);
                setRawEvents([]);
                setLoading(false);
                return;
            }

            const events = parseInteractionsJsonl(source.interactions);
            const data = buildExperimentalGraphData(events);

            setRawEvents(events);
            setGraphData(data);
            setLintReport(source.lint as LintReport);
            
            // Artificial delay to simulate nice loading UI
            setTimeout(() => {
                setLoading(false);
            }, 300);
        } catch (err) {
            console.error("Failed to load experimental data", err);
            setLoading(false);
        }
    }, [currentChapter]);

    return (
        <ExperimentalDataContext.Provider value={{
            currentChapter,
            setCurrentChapter,
            availableChapters,
            graphData,
            rawEvents,
            lintReport,
            loading
        }}>
            {children}
        </ExperimentalDataContext.Provider>
    );
};

export const useExperimentalData = () => {
    const context = useContext(ExperimentalDataContext);
    if (context === undefined) {
        throw new Error('useExperimentalData must be used within an ExperimentalDataProvider');
    }
    return context;
};
