import React from 'react';

const SiteHeader: React.FC = () => {
  return (
    <header className="bg-primary-dark text-white border-b-4 border-accent shadow-md z-20 relative">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Placeholder for logo if needed */}
          <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-serif font-bold text-xl">
            M
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-wide leading-tight">
              George Eliot Archive
            </h1>
            <h2 className="text-sm font-sans opacity-80 uppercase tracking-wider">
              Middlemarch Character Network
            </h2>
          </div>
        </div>
        <nav className="hidden md:flex space-x-6 text-sm font-semibold uppercase tracking-wide">
          <a href="#" className="hover:text-accent transition-colors">Home</a>
          <a href="#" className="hover:text-accent transition-colors">About</a>
          <a href="#" className="hover:text-accent transition-colors">Projects</a>
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader;
