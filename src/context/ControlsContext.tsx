import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ControlsContextType {
    minConnections: number;
    setMinConnections: (val: number) => void;
    forceStrength: number;
    setForceStrength: (val: number) => void;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    isPlaying: boolean;
    setIsPlaying: (val: boolean) => void;
    playbackSpeed: number;
    setPlaybackSpeed: (val: number) => void;
    selectedGroups: string[];
    setSelectedGroups: (val: string[]) => void;
    selectedInteractionTypes: string[];
    setSelectedInteractionTypes: (val: string[]) => void;
}

const ControlsContext = createContext<ControlsContextType | undefined>(undefined);

export const ControlsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [minConnections, setMinConnections] = useState(1);
    const [forceStrength, setForceStrength] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(2000); // ms per chapter
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]); // Empty means all selected by default logic
    const [selectedInteractionTypes, setSelectedInteractionTypes] = useState<string[]>([]); // Empty means all

    return (
        <ControlsContext.Provider value={{
            minConnections, setMinConnections,
            forceStrength, setForceStrength,
            searchTerm, setSearchTerm,
            isPlaying, setIsPlaying,
            playbackSpeed, setPlaybackSpeed,
            selectedGroups, setSelectedGroups,
            selectedInteractionTypes, setSelectedInteractionTypes
        }}>
            {children}
        </ControlsContext.Provider>
    );
};

export const useControls = () => {
    const context = useContext(ControlsContext);
    if (context === undefined) {
        throw new Error('useControls must be used within a ControlsProvider');
    }
    return context;
};
