import React, { useState, useCallback } from 'react';
import { runWhatIfSimulation } from '../services/geminiService';
import { XIcon } from './icons';
import type { RailwayData } from '../types';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  railwayData: RailwayData;
}

const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose, railwayData }) => {
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSimulate = useCallback(async () => {
    if (!action.trim()) {
      setError('Please enter an action to simulate.');
      return;
    }
    setIsLoading(true);
    setResult('');
    setError('');
    try {
      const simulationResult = await runWhatIfSimulation(railwayData, action);
      setResult(simulationResult);
    } catch (err) {
      setError('Failed to run simulation. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [action, railwayData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-bg-light border border-brand-border rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <h2 className="text-xl font-semibold text-brand-text-primary">What-If Scenario Simulation</h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="action-input" className="block text-sm font-medium text-brand-text-secondary mb-2">
              Proposed Action
            </label>
            <textarea
              id="action-input"
              rows={3}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full bg-brand-bg-dark border border-brand-border rounded-md p-2 text-brand-text-primary focus:ring-2 focus:ring-brand-accent focus:outline-none"
              placeholder="e.g., 'Reroute freight T54321 to siding at Mirzapur to allow Vande Bharat to pass.'"
            />
          </div>
          <button
            onClick={handleSimulate}
            disabled={isLoading}
            className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Simulating...
              </span>
            ) : 'Run Simulation'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {result && (
            <div className="bg-brand-bg-dark/50 p-4 rounded-md border border-brand-border">
              <h3 className="font-semibold text-brand-accent mb-2">Simulation Result:</h3>
              <p className="text-brand-text-secondary text-sm whitespace-pre-wrap">{result.replace('Simulation Result:', '')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationModal;