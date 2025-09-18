
import React from 'react';
import { RailwayIcon, RefreshCwIcon } from './icons';

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, isLoading }) => {
  return (
    <header className="bg-brand-bg-light/50 backdrop-blur-sm sticky top-0 z-40 border-b border-brand-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <RailwayIcon className="h-8 w-8 text-brand-accent" />
            <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">
              RailOptix <span className="text-brand-accent">AI Controller</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-brand-text-primary">Last Update</p>
              <p className="text-xs text-brand-text-secondary">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
              </p>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center justify-center h-10 w-10 bg-brand-bg-light rounded-full text-brand-text-secondary hover:bg-brand-border hover:text-brand-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh Data"
            >
              <RefreshCwIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
