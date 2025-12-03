import React, { useState } from 'react';
import { useSelection } from '../../context/SelectionContext';
import Legend from '../graph/Legend';

const ControlsSidebar: React.FC = () => {
    const [minConnections, setMinConnections] = useState(1);
    const [forceStrength, setForceStrength] = useState(50);
    const [searchTerm, setSearchTerm] = useState('');
    const { selectedNode } = useSelection();

    return (
        <div className="space-y-8">
            {/* Graph Controls */}
            <section>
                <h4 className="font-serif font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">
                    Graph Settings
                </h4>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="min-connections" className="block text-sm font-semibold text-gray-600 mb-1">
                            Minimum Connections
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="range"
                                id="min-connections"
                                min="1"
                                max="10"
                                value={minConnections}
                                onChange={(e) => setMinConnections(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                            <span className="text-sm font-mono w-6 text-right">{minConnections}</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="force-strength" className="block text-sm font-semibold text-gray-600 mb-1">
                            Force Strength
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="range"
                                id="force-strength"
                                min="1"
                                max="100"
                                value={forceStrength}
                                onChange={(e) => setForceStrength(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
                            />
                            <span className="text-sm font-mono w-8 text-right">{forceStrength}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Search */}
            <section>
                <h4 className="font-serif font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">
                    Find Character
                </h4>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
                </div>
            </section>

            {/* Legend */}
            <section className="border-t border-gray-300 pt-6">
                <h4 className="font-serif font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">
                    Legend
                </h4>
                <Legend />
            </section>

            {/* Node Inspector */}
            <section className="border-t border-gray-300 pt-6">
                <h4 className="font-serif font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">
                    Inspector
                </h4>
                <div className="bg-white p-4 rounded border border-gray-200 shadow-sm min-h-[150px]">
                    {selectedNode ? (
                        <div>
                            <h5 className="font-serif font-bold text-lg text-primary-dark mb-2">{selectedNode.id}</h5>
                            <div className="space-y-2 text-sm">
                                <p><span className="font-semibold text-gray-600">Group:</span> {selectedNode.group}</p>
                                {/* Add more details here when available in data */}
                                <p className="text-gray-500 italic">More details coming soon...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                            Select a node to view details
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ControlsSidebar;
