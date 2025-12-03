import React from 'react';
import { NavLink } from 'react-router-dom';

// Mock data until JSON is available
const MOCK_CHAPTERS = [
    { book: 'Book I', chapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { book: 'Book II', chapters: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22] },
    // ... add more as needed for testing
];

const ChapterList: React.FC = () => {
    return (
        <div className="space-y-6">
            {MOCK_CHAPTERS.map((book) => (
                <div key={book.book}>
                    <h4 className="font-serif font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">
                        {book.book}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                        {book.chapters.map((chapter) => (
                            <NavLink
                                key={chapter}
                                to={`/${book.book.replace(/\s+/g, '')}/${chapter}`}
                                className={({ isActive }) =>
                                    `flex items-center justify-center h-8 w-8 rounded text-sm font-sans transition-colors
                  ${isActive
                                        ? 'bg-accent text-white font-bold shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                                    }`
                                }
                            >
                                {chapter}
                            </NavLink>
                        ))}
                    </div>
                </div>
            ))}

            <div className="pt-4 border-t border-gray-300">
                <button className="w-full py-2 px-4 bg-primary-dark text-white font-bold rounded shadow hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2">
                    <span>▶</span>
                    <span>Auto-Play Chapters</span>
                </button>
            </div>
        </div>
    );
};

export default ChapterList;
