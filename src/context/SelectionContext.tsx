import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Node } from './DataContext';

interface SelectionContextType {
    selectedNode: Node | null;
    setSelectedNode: (node: Node | null) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    return (
        <SelectionContext.Provider value={{ selectedNode, setSelectedNode }}>
            {children}
        </SelectionContext.Provider>
    );
};

export const useSelection = () => {
    const context = useContext(SelectionContext);
    if (context === undefined) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context;
};
