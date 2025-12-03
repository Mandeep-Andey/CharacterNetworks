import React from 'react';
import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader';
import SidePanel from './SidePanel';
import ChapterList from '../navigation/ChapterList';
import ControlsSidebar from '../controls/ControlsSidebar';

const MainLayout: React.FC = () => {
    return (
        <div className="flex flex-col h-screen w-full bg-bg-white overflow-hidden">
            <SiteHeader />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Sidebar - Navigation */}
                <SidePanel side="left" className="w-72 flex-shrink-0 border-r border-gray-200 bg-[#f8f9fa] shadow-inner z-10">
                    <div className="p-6">
                        <h3 className="font-serif font-bold text-xl mb-6 text-primary-dark border-b pb-2 border-gray-300">
                            Chapters
                        </h3>
                        <ChapterList />
                    </div>
                </SidePanel>

                {/* Center Content - Graph */}
                <main className="flex-1 relative overflow-hidden bg-white">
                    <Outlet />
                </main>

                {/* Right Sidebar - Controls */}
                <SidePanel side="right" className="w-80 flex-shrink-0 border-l border-gray-200 bg-[#f8f9fa] shadow-inner z-10">
                    <div className="p-6">
                        <h3 className="font-serif font-bold text-xl mb-6 text-primary-dark border-b pb-2 border-gray-300">
                            Controls
                        </h3>
                        <ControlsSidebar />
                    </div>
                </SidePanel>
            </div>
        </div>
    );
};

export default MainLayout;
