import React, { useEffect, useRef } from 'react';
import type { RailwayData, Action, Train, Station, Alert, Recommendation } from '../types';
import TrackVisualizer from './TrackVisualizer';
import TrainList from './TrainList';
import Recommendations from './Recommendations';
import Alerts from './Alerts';

interface DashboardProps {
  data: RailwayData;
  setData: React.Dispatch<React.SetStateAction<RailwayData | null>>;
  onRefresh: () => void;
}

const DWELL_TIME_MS = 30 * 1000; // 30 seconds for simulation
const ARRIVAL_THRESHOLD_KM = 5; // 5% progress = 5km
const APPROACHING_THRESHOLD_KM = 15; // 15% progress = 15km
const CONFLICT_THRESHOLD_KM = 10; // 10% progress = 10km
const SPEED_INCREMENT = 10; // km/h
const MIN_SPEED = 20; // km/h
const MAX_SPEEDS = {
    'Express': 140,
    'Freight': 80,
    'Local': 70,
    'Special': 160,
};


// Define static routes for trains to follow.
const TRAIN_ROUTES: { [key: string]: string[] } = {
    'Vande Bharat': ['Prayagraj', 'Vindhyachal', 'Mirzapur', 'Chunar'],
    'Rajdhani Express': ['Chunar', 'Mirzapur', 'Vindhyachal', 'Prayagraj'],
    'Goods Hauler': ['Prayagraj', 'Chunar'],
    'Freight Train': ['Chunar', 'Prayagraj'],
    'Local Passenger': ['Prayagraj', 'Vindhyachal', 'Mirzapur', 'Chunar'],
    'Prayagraj Express': ['Chunar', 'Mirzapur', 'Vindhyachal', 'Prayagraj'],
};


const Dashboard: React.FC<DashboardProps> = ({ data, setData, onRefresh }) => {
  const { trains, stations, recommendations, alerts } = data;
  const lastSimTime = useRef(Date.now());

  // This effect runs the client-side simulation logic for arrivals and departures.
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      setData(currentData => {
        if (!currentData) return null;

        const newData: RailwayData = JSON.parse(JSON.stringify(currentData));
        const now = Date.now();
        const deltaTimeMs = now - lastSimTime.current;
        lastSimTime.current = now;
        let changed = false;
        
        // --- TRAIN MOVEMENT LOGIC ---
        // update train progress based on speed to make the simulation dynamic.
        newData.trains.forEach(train => {
            if (train.speed && train.speed > 0 && (train.status === 'On Time' || train.status === 'Delayed' || train.status === 'Approaching' || train.status === 'Departing')) {
                // distance (km) = speed (km/h) * time (h)
                const distanceMoved = (train.speed / 3600000) * deltaTimeMs;
                if (train.direction === 'Eastbound') {
                    train.progress += distanceMoved;
                } else {
                    train.progress -= distanceMoved;
                }
                train.progress = Math.max(0, Math.min(100, train.progress));
                changed = true;
            }
        });


        // --- REMOVE COMPLETED TRAINS ---
        const originalTrainCount = newData.trains.length;
        newData.trains = newData.trains.filter(train => {
            if (train.nextStop === 'End of Line') {
                if (train.direction === 'Eastbound' && train.progress >= 100) return false;
                if (train.direction === 'Westbound' && train.progress <= 0) return false;
            }
            return true;
        });
        if (newData.trains.length < originalTrainCount) {
            changed = true;
        }

        // --- DEPARTING TRANSITION LOGIC ---
        // Trains in 'Departing' status are fully accelerated to their cruising speed and set to 'On Time'.
        // This provides a clear, temporary state for departure.
        newData.trains.forEach(train => {
            if (train.status === 'Departing') {
                train.status = 'On Time'; // In a more complex sim, this could be 'Delayed'.
                
                // Assign full cruising speed
                switch (train.type) {
                    case 'Express': train.speed = 110; break;
                    case 'Freight': train.speed = 60; break;
                    case 'Local': train.speed = 50; break;
                    case 'Special': train.speed = 130; break;
                    default: train.speed = 80;
                }
                changed = true;
            }
        });

        // --- STATUS UPDATE LOGIC ---
        // Proactively set train status to 'Approaching' to make arrival logic more reliable.
        newData.trains.forEach(train => {
            if ((train.status === 'On Time' || train.status === 'Delayed') && train.nextStop && train.nextStop !== 'End of Line') {
                const nextStation = newData.stations.find(s => s.name === train.nextStop);
                if (nextStation) {
                    const distance = Math.abs(train.progress - nextStation.position);
                    if (distance < APPROACHING_THRESHOLD_KM) {
                        train.status = 'Approaching';
                        changed = true;
                    }
                }
            }
        });

        // --- DEPARTURE LOGIC ---
        newData.trains.forEach(train => {
          if (train.status === 'Stopped' && train.departureTime && now >= train.departureTime) {
            
            // Check for conflicts before departing
            const isPathBlocked = newData.trains.some(otherTrain => {
              if (train.id === otherTrain.id || otherTrain.status === 'Siding') return false;
              const progressDiff = Math.abs(train.progress - otherTrain.progress);
              if (progressDiff > CONFLICT_THRESHOLD_KM) return false;

              // Path is blocked if another train is on the same track section ahead
              if (train.direction === 'Eastbound' && otherTrain.progress > train.progress) return true;
              if (train.direction === 'Westbound' && otherTrain.progress < train.progress) return true;
              
              return false;
            });

            if (isPathBlocked) {
                 const conflictAlertExists = newData.alerts.some(a => a.message.includes(`Departure conflict for ${train.id.split('-')[0]}`));
                 if (!conflictAlertExists) {
                    const newAlert: Alert = {
                        id: `conflict-${train.id.split('-')[0]}-${now}`,
                        message: `Departure conflict for ${train.id.split('-')[0]} at ${train.currentLocation}. Path is blocked.`,
                        severity: 'High',
                        suggestedActions: [{
                            displayText: `Hold ${train.id.split('-')[0]}`,
                            command: 'HOLD',
                            trainId: train.id.split('-')[0],
                            stationName: train.currentLocation,
                        }],
                        expiresAt: now + 120000,
                    };
                    newData.alerts.push(newAlert);
                    changed = true;
                 }
            } else {
              // --- PATH IS CLEAR, BEGIN DEPARTURE ---
              train.currentLocation = 'In Transit';
              train.track = 'main';
              train.departureTime = undefined;
              train.status = 'Departing';
              train.speed = 30; // Initial acceleration speed
              changed = true;
            }
          }
        });
        
        // --- ARRIVAL LOGIC ---
        newData.trains.forEach(train => {
            if (train.status === 'Approaching' && train.nextStop && train.nextStop !== 'End of Line') {
                const nextStation = newData.stations.find(s => s.name === train.nextStop);
                if (nextStation) {
                    const distanceToStation = Math.abs(train.progress - nextStation.position);
                    if (distanceToStation < ARRIVAL_THRESHOLD_KM) {
                        const arrivalRecExists = newData.recommendations.some(
                            r => r.title.includes(train.id.split('-')[0]) && r.reason.includes(`approaching its next stop: ${train.nextStop}`)
                        );

                        if (!arrivalRecExists) {
                             // Check for available platforms
                            const occupiedPlatforms = newData.trains
                                .filter(t => t.currentLocation === nextStation.name && t.status === 'Stopped' && t.track.startsWith('platform-'))
                                .map(t => parseInt(t.track.split('-')[1], 10));
                            
                            const availablePlatforms = Array.from({ length: nextStation.platformTracks })
                                .map((_, i) => i + 1)
                                .filter(pNum => !occupiedPlatforms.includes(pNum));

                            if (availablePlatforms.length > 0) {
                                const platformActions: Action[] = availablePlatforms.map(pNum => ({
                                    displayText: `Assign Platform ${pNum}`,
                                    command: 'ASSIGN_PLATFORM',
                                    trainId: train.id.split('-')[0],
                                    stationName: nextStation.name,
                                    platform: pNum,
                                }));

                                const newRec: Recommendation = {
                                    id: `arrival-rec-${train.id.split('-')[0]}-${now}`,
                                    title: `Assign platform for ${train.name} (${train.id.split('-')[0]})`,
                                    reason: `Train is approaching its next stop: ${train.nextStop}. Assign a platform for a smooth arrival.`,
                                    actions: platformActions,
                                    expiresAt: now + 120000,
                                };
                                newData.recommendations.push(newRec);
                                changed = true;
                            }
                        }
                    }
                }
            }
        });


        return changed ? newData : currentData;
      });
    }, 50); // Run simulation check frequently for smooth animation

    return () => clearInterval(simulationInterval);
  }, [setData]);


  const handleAction = (action: Action, source: 'rec' | 'alert' | 'trainlist', sourceId?: string) => {
    setData(currentData => {
      if (!currentData) return null;

      const newData: RailwayData = JSON.parse(JSON.stringify(currentData));
      
      const train = newData.trains.find((t: Train) => t.id.startsWith(action.trainId));
      if (!train) {
        console.warn(`Action failed: Train with ID starting with ${action.trainId} not found.`);
        return currentData;
      }
      
      const station = newData.stations.find(s => s.name === action.stationName);

      switch (action.command) {
        case 'MOVE_SIDING':
          if (station && station.hasSiding) {
              train.track = 'siding';
              train.progress = station.position;
              train.status = 'Siding';
              train.speed = 0;
              train.currentLocation = station.name;
          }
          break;
        case 'HOLD':
          train.status = 'Stopped';
          train.speed = 0;
          if (station) {
            train.progress = station.position;
            train.currentLocation = station.name;
          }
          break;
        case 'PROCEED':
          train.status = 'On Time';
          train.track = 'main';
          switch (train.type) {
            case 'Express': train.speed = 110; break;
            case 'Freight': train.speed = 60; break;
            case 'Local': train.speed = 50; break;
            case 'Special': train.speed = 130; break;
            default: train.speed = 80;
          }
          break;
        case 'INCREASE_SPEED': {
            const maxSpeed = MAX_SPEEDS[train.type] || 120;
            train.speed = Math.min(maxSpeed, (train.speed || 0) + SPEED_INCREMENT);
            break;
        }
        case 'DECREASE_SPEED': {
            train.speed = Math.max(MIN_SPEED, (train.speed || 0) - SPEED_INCREMENT);
            break;
        }
        case 'ASSIGN_PLATFORM':
            if (station && action.platform) {
                train.status = 'Stopped';
                train.track = `platform-${action.platform}`;
                train.progress = station.position;
                train.speed = 0;
                train.currentLocation = station.name;
                train.departureTime = Date.now() + DWELL_TIME_MS; // Set dwell time

                // Immediately update the next stop for the next leg of the journey.
                const route = TRAIN_ROUTES[train.name];
                let nextStopForJourney = 'End of Line';
                if (route) {
                    const currentStopIndex = route.indexOf(train.currentLocation);
                    if (currentStopIndex !== -1 && currentStopIndex < route.length - 1) {
                        nextStopForJourney = route[currentStopIndex + 1];
                    }
                }
                train.nextStop = nextStopForJourney;

                 // Also remove the corresponding arrival recommendation, using the action's stationName
                 newData.recommendations = newData.recommendations.filter(
                    r => !(r.title.includes(train.id.split('-')[0]) && r.reason.includes(`approaching its next stop: ${action.stationName}`))
                );
            }
            break;
        default:
          console.warn(`Unknown command: ${(action as any).command}`);
      }

      if (source === 'rec' && sourceId) {
        newData.recommendations = newData.recommendations.filter((r) => r.id !== sourceId);
      } else if (source === 'alert' && sourceId) {
        newData.alerts = newData.alerts.filter((a) => a.id !== sourceId);
      }
      
      return newData;
    });
  };

  const platformOccupancy = new Map<string, number[]>();
  trains.forEach(train => {
      if (train.status === 'Stopped' && train.track.startsWith('platform-')) {
          const platformNum = parseInt(train.track.split('-')[1], 10);
          if (!platformOccupancy.has(train.currentLocation)) {
              platformOccupancy.set(train.currentLocation, []);
          }
          platformOccupancy.get(train.currentLocation)?.push(platformNum);
      }
  });


  return (
    <div className="space-y-6">
      <TrackVisualizer trains={trains} stations={stations} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <TrainList trains={trains} stations={stations} onAction={handleAction} platformOccupancy={platformOccupancy} />
        </div>
        <div className="space-y-6">
            <Recommendations recommendations={recommendations} onAction={handleAction} data={data} setData={setData} />
            <Alerts alerts={alerts} onAction={handleAction} data={data} setData={setData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;