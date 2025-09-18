import React, { useState, useEffect } from 'react';
import type { Recommendation, RailwayData, Action } from '../types';
import { LightbulbIcon } from './icons';
import SimulationModal from './SimulationModal';

interface RecommendationsProps {
  recommendations: Recommendation[];
  data: RailwayData;
  setData: React.Dispatch<React.SetStateAction<RailwayData | null>>;
  onAction: (action: Action, source: 'rec', sourceId: string) => void;
}

const Recommendations: React.FC<RecommendationsProps> = ({ recommendations, data, setData, onAction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // This effect handles removing expired items
    if (recommendations.some(r => r.expiresAt && r.expiresAt < now)) {
      setData(currentData => {
        if (!currentData) return null;
        const newRecs = currentData.recommendations.filter(r => r.expiresAt && r.expiresAt >= now);
        return { ...currentData, recommendations: newRecs };
      });
    }
  }, [now, recommendations, setData]);

  return (
    <div className="bg-brand-bg-light p-4 rounded-lg border border-brand-border shadow-lg">
      <h2 className="text-lg font-semibold text-brand-text-primary mb-4 flex items-center">
        <LightbulbIcon className="w-5 h-5 mr-2 text-yellow-400" />
        AI Recommendations
      </h2>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {recommendations.map(rec => {
          const createdAt = parseInt(rec.id.split('-').pop() || `${now}`, 10);
          const initialDuration = rec.expiresAt ? rec.expiresAt - createdAt : 75000;
          const timeLeft = rec.expiresAt ? rec.expiresAt - now : 0;
          const percentage = Math.max(0, (timeLeft / initialDuration) * 100);

          return (
            <div key={rec.id} className="p-3 rounded-md transition-all border-l-4 border-brand-accent bg-brand-bg-dark/30">
              <p className="font-semibold text-brand-text-primary text-sm">{rec.title}</p>
              <p className="text-xs text-brand-text-secondary mt-1">{rec.reason}</p>
              <div className="flex flex-col items-stretch space-y-2 mt-3">
                {(rec.actions || []).map((action, index) => (
                  <button 
                    key={`${rec.id}-action-${index}`}
                    onClick={() => onAction(action, 'rec', rec.id)}
                    className="text-xs px-2 py-1.5 rounded text-center transition-colors bg-brand-accent/20 text-brand-accent-hover hover:bg-brand-accent/40"
                  >
                    {action.displayText}
                  </button>
                ))}
              </div>
              {rec.expiresAt && (
                <div className="w-full bg-brand-border/50 rounded-full h-1 mt-3">
                  <div className='bg-brand-accent' style={{ width: `${percentage}%`, height: '100%', borderRadius: 'inherit', transition: 'width 0.5s linear' }}></div>
                </div>
              )}
            </div>
          )
        })}
         {recommendations.length === 0 && (
          <p className="text-sm text-brand-text-secondary text-center py-4">No recommendations at the moment.</p>
        )}
      </div>
       <button 
        onClick={() => setIsModalOpen(true)}
        className="mt-4 w-full bg-brand-accent/80 hover:bg-brand-accent text-white font-bold py-2 px-4 rounded transition-colors"
      >
        Run What-If Scenario
      </button>
      <SimulationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} railwayData={data} />
    </div>
  );
};

export default Recommendations;