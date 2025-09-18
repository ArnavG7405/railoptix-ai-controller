import React from 'react';
import type { Train, Action, Station } from '../types';
import { PlayIcon, PlusIcon, MinusIcon } from './icons';

interface TrainListProps {
  trains: Train[];
  stations: Station[];
  onAction: (action: Action, source: 'trainlist') => void;
  platformOccupancy: Map<string, number[]>;
}

const getStatusClasses = (status: Train['status']) => {
  switch (status) {
    case 'On Time': return 'bg-green-500/10 text-green-400';
    case 'Approaching': return 'bg-blue-500/10 text-blue-400';
    case 'Departing': return 'bg-orange-500/10 text-orange-400';
    case 'Delayed': return 'bg-yellow-500/10 text-yellow-400';
    case 'Stopped': return 'bg-red-500/10 text-red-400';
    case 'Siding': return 'bg-purple-500/10 text-purple-400';
    default: return 'bg-gray-500/10 text-gray-400';
  }
};

const getPriorityClasses = (priority: number) => {
    if (priority === 1) return 'text-red-400 font-bold';
    if (priority === 2) return 'text-orange-400 font-semibold';
    if (priority === 3) return 'text-yellow-400';
    return 'text-brand-text-secondary';
};


const TrainList: React.FC<TrainListProps> = ({ trains, stations, onAction, platformOccupancy }) => {

  const handleActionClick = (train: Train, command: Action['command'], platform?: number) => {
    const action: Action = {
      displayText: `Perform ${command} on ${train.id.split('-')[0]}`,
      command: command,
      trainId: train.id.split('-')[0],
      ...(platform && { platform, stationName: train.nextStop })
    };
    onAction(action, 'trainlist');
  };

  return (
    <div className="bg-brand-bg-light p-4 rounded-lg border border-brand-border shadow-lg h-full">
      <h2 className="text-lg font-semibold text-brand-text-primary mb-4 px-2">Active Trains</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-brand-text-secondary uppercase border-b border-brand-border">
            <tr>
              <th scope="col" className="px-4 py-3">Train ID</th>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-center">Priority</th>
              <th scope="col" className="px-4 py-3">Speed</th>
              <th scope="col" className="px-4 py-3">Next Stop</th>
              <th scope="col" className="px-4 py-3">Track</th>
              <th scope="col" className="px-4 py-3">Direction</th>
              <th scope="col" className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trains.sort((a,b) => a.priority - b.priority).map((train) => {
              const nextStation = train.status === 'Approaching' 
                ? stations.find(s => s.name === train.nextStop)
                : null;
              
              const occupiedPlatforms = nextStation ? platformOccupancy.get(nextStation.name) || [] : [];
              const allPlatforms = nextStation ? Array.from({ length: nextStation.platformTracks }, (_, i) => i + 1) : [];
              const availablePlatforms = allPlatforms.filter(pNum => !occupiedPlatforms.includes(pNum));
              
              const isMovable = ['On Time', 'Delayed', 'Departing'].includes(train.status);

              return (
              <tr key={train.id} className="border-b border-brand-border hover:bg-brand-border/50">
                <td className="px-4 py-3 font-mono font-medium text-brand-text-primary whitespace-nowrap">{train.id.split('-')[0]}</td>
                <td className="px-4 py-3 text-brand-text-primary whitespace-nowrap">{train.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(train.status)}`}>
                    {train.status}
                  </span>
                </td>
                <td className={`px-4 py-3 text-center text-lg ${getPriorityClasses(train.priority)}`}>
                  {train.priority}
                </td>
                <td className="px-4 py-3 text-brand-text-secondary">{train.speed !== undefined ? `${train.speed} km/h` : 'N/A'}</td>
                <td className="px-4 py-3 text-brand-text-secondary">{train.nextStop}</td>
                <td className="px-4 py-3 text-brand-text-secondary capitalize">{train.track}</td>
                <td className="px-4 py-3 text-brand-text-secondary">{train.direction}</td>
                <td className="px-4 py-3 text-center">
                  {train.status === 'Approaching' && nextStation ? (
                    <div className="flex items-center justify-center gap-1.5">
                      {availablePlatforms.length > 0 ? availablePlatforms.map(platformNum => (
                          <button
                            key={platformNum}
                            onClick={() => handleActionClick(train, 'ASSIGN_PLATFORM', platformNum)}
                            className="text-xs px-2.5 py-1.5 rounded transition-colors bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 font-semibold"
                            aria-label={`Assign train ${train.id.split('-')[0]} to platform ${platformNum}`}
                          >
                            P{platformNum}
                          </button>
                      )) : (
                         <span className="text-xs text-yellow-400 font-semibold px-2">No Platforms</span>
                      )}
                    </div>
                  ) : (train.status === 'Stopped' || train.status === 'Siding') ? (
                    <button
                      onClick={() => handleActionClick(train, 'PROCEED')}
                      className="flex items-center gap-1.5 justify-center text-xs px-2.5 py-1.5 rounded text-center transition-colors bg-brand-accent/20 text-brand-accent-hover hover:bg-brand-accent/40 font-semibold"
                      aria-label={`Proceed with train ${train.id}`}
                    >
                      <PlayIcon className="w-3 h-3" />
                      Proceed
                    </button>
                  ) : isMovable ? (
                     <div className="flex items-center justify-center gap-1">
                        <button 
                            onClick={() => handleActionClick(train, 'DECREASE_SPEED')}
                            className="p-1.5 rounded-full transition-colors bg-brand-border/50 text-brand-text-secondary hover:bg-brand-border"
                            aria-label={`Decrease speed for ${train.id.split('-')[0]}`}
                        >
                            <MinusIcon className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={() => handleActionClick(train, 'INCREASE_SPEED')}
                            className="p-1.5 rounded-full transition-colors bg-brand-border/50 text-brand-text-secondary hover:bg-brand-border"
                            aria-label={`Increase speed for ${train.id.split('-')[0]}`}
                        >
                           <PlusIcon className="w-3 h-3" />
                        </button>
                     </div>
                  ) : (
                    <span className="text-brand-text-secondary/50">-</span>
                  )}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrainList;