import React from 'react';
import * as d3 from 'd3';

// Mock groups for now, ideally passed from parent or context
const GROUPS = [
    { id: 1, label: "Brooke Family" },
    { id: 2, label: "Vincy Family" },
    { id: 3, label: "Garth Family" },
    { id: 4, label: "Others" }
];

const Legend: React.FC = () => {
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    return (
        <div className="space-y-2">
            {GROUPS.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                    <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: colorScale(group.id.toString()) }}
                    ></span>
                    <span className="text-sm text-gray-600">{group.label}</span>
                </div>
            ))}
        </div>
    );
};

export default Legend;
