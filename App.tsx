import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import type { RailwayData } from './types';
import { getRailwayData } from './services/geminiService';

const App: React.FC = () => {
  const [data, setData] = useState<RailwayData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const railwayData = await getRailwayData();
      setData(railwayData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch real-time railway data. Please check your Gemini API key and connection.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg-dark text-brand-text-primary font-sans">
      <Header lastUpdated={lastUpdated} onRefresh={fetchData} isLoading={isLoading} />
      <main className="p-4 sm:p-6 lg:p-8">
        {isLoading && !data && (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-brand-text-secondary text-lg">Initializing AI Simulation...</p>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-[80vh]">
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg max-w-md text-center">
              <h3 className="font-bold">Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}
        {data && !isLoading && <Dashboard data={data} setData={setData} onRefresh={fetchData} />}
         {data && isLoading && <div className="absolute inset-0 bg-brand-bg-dark/70 z-50 flex items-center justify-center"><div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div></div>}
      </main>
    </div>
  );
};

export default App;