import React, { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SidePanelProps {
    children: ReactNode;
    side: 'left' | 'right';
    className?: string;
}

const SidePanel: React.FC<SidePanelProps> = ({ children, side, className }) => {
    return (
        <aside
            className={twMerge(
                "flex flex-col h-full overflow-y-auto",
                className
            )}
        >
            {children}
        </aside>
    );
};

export default SidePanel;
