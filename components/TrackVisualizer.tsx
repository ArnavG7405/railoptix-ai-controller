import React from 'react';
import type { Train, Station } from '../types';

interface TrackVisualizerProps {
  trains: Train[];
  stations: Station[];
}

const getStatusTextColor = (status: Train['status']) => {
  switch (status) {
    case 'On Time': return 'text-green-400';
    case 'Approaching': return 'text-blue-400';
    case 'Departing': return 'text-orange-400';
    case 'Delayed': return 'text-yellow-400';
    case 'Stopped': return 'text-red-400';
    case 'Siding': return 'text-purple-400';
    default: return 'text-gray-400';
  }
};

const getTrainVerticalPosition = (track: string): string => {
    if (track === 'main') return 'translateY(-50%)';
    if (track === 'siding') return 'translateY(calc(-50% - 28px))';
    const platformMatch = track.match(/platform-(\d+)/);
    if (platformMatch) {
        const platformNum = parseInt(platformMatch[1], 10);
        // Position platform tracks closely around the main line
        const offset = (platformNum - 1) * 8 - 4; // e.g., platform-1 is -4px, platform-2 is +4px from center
        return `translateY(calc(-50% + ${offset}px))`;
    }
    return 'translateY(-50%)'; // Default to main line
};

const TrackVisualizer: React.FC<TrackVisualizerProps> = ({ trains, stations }) => {
  return (
    <div className="bg-brand-bg-light p-6 rounded-lg border border-brand-border shadow-lg">
      <h2 className="text-lg font-semibold text-brand-text-primary mb-12">Section Overview: Ganga-Yamuna Corridor</h2>
      <div className="relative h-28 flex items-center">
        {/* Main Track Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-brand-border rounded-full -translate-y-1/2 z-0"></div>
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-500 rounded-full -translate-y-1/2 z-0"></div>
        
        {/* Station Tracks (Sidings and Platforms) */}
        {stations.map(station => (
          <React.Fragment key={`tracks-${station.id}`}>
            {/* Siding Track */}
            {station.hasSiding && (
              <div 
                className="absolute top-1/2 h-0.5 bg-gray-600 rounded-full z-0"
                style={{ 
                  left: `${station.position - 5}%`,
                  width: '10%',
                  transform: 'translateY(calc(-50% - 28px))'
                }}
              ></div>
            )}
            {/* Platform Tracks */}
            {station.platformTracks > 1 && Array.from({ length: station.platformTracks }).map((_, i) => {
              const platformNum = i + 1;
              const verticalOffset = (platformNum - 1) * 8 - 4;
              return (
                 <div
                    key={`platform-${station.id}-${platformNum}`}
                    className="absolute top-1/2 h-1 bg-gray-600 rounded-full z-0"
                    style={{
                      left: `${station.position - 4}%`,
                      width: '8%',
                      transform: `translateY(calc(-50% + ${verticalOffset}px))`
                    }}
                  ></div>
              )
            })}
          </React.Fragment>
        ))}

        {/* Stations Markers */}
        {stations.map(station => (
          <div key={station.id} className="absolute top-1/2 -translate-y-1/2 z-10 group" style={{ left: `${station.position}%` }}>
            <div className="relative flex flex-col items-center">
              <div className="w-3 h-3 bg-brand-accent rounded-full border-2 border-brand-bg-dark cursor-pointer"></div>
              <div className="absolute top-6 text-center">
                <span className="block text-xs text-brand-text-secondary whitespace-nowrap">{station.name}</span>
                <span className="block text-[10px] font-mono text-brand-text-secondary/70 whitespace-nowrap mt-0.5">({station.id})</span>
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 w-max bg-brand-bg-dark text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="font-bold">{station.name} ({station.id})</p>
                <p>{station.platformTracks} Platform(s)</p>
                {station.hasSiding && <p>Siding Available</p>}
              </div>
            </div>
          </div>
        ))}
        
        {/* Trains */}
        {trains.map(train => (
          <div 
            key={train.id} 
            className="absolute top-1/2 group z-20" 
            style={{ 
              left: `${train.progress}%`,
              transform: `translateX(-50%) ${getTrainVerticalPosition(train.track)}`,
              transition: 'left 50ms linear'
            }}
          >
             <div className="relative">
                <span 
                  className={`text-3xl transition-transform duration-300 inline-block ${getStatusTextColor(train.status)}`} 
                  style={{ transform: train.direction === 'Westbound' ? 'scaleX(1)' : 'scaleX(-1)' }}
                  role="img" 
                  aria-label={`Train ${train.name}`}
                >
                  🚂
                </span>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-brand-bg-dark text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="font-bold">{train.name} ({train.id.split('-')[0]})</p>
                    <p>Next Stop: {train.nextStop}</p>
                    <p>Status: {train.status}</p>
                    <p>Track: {train.track}</p>
                    <p>Speed: {train.speed || 0} km/h</p>
                    <p>Direction: {train.direction}</p>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackVisualizer;