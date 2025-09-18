export interface Action {
  displayText: string;
  command: 'MOVE_SIDING' | 'HOLD' | 'PROCEED' | 'ASSIGN_PLATFORM' | 'INCREASE_SPEED' | 'DECREASE_SPEED';
  trainId: string;
  stationName?: string;
  platform?: number;
}

export interface Train {
  id: string;
  name: string;
  type: 'Express' | 'Freight' | 'Local' | 'Special';
  priority: number;
  status: 'On Time' | 'Delayed' | 'Approaching' | 'Stopped' | 'Siding' | 'Departing';
  currentLocation: string;
  nextStop: string;
  progress: number;
  track: string;
  direction: 'Eastbound' | 'Westbound';
  speed?: number;
  departureTime?: number;
}

export interface Station {
  id: string;
  name: string;
  position: number;
  hasSiding: boolean;
  platformTracks: number;
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  actions: Action[];
  expiresAt?: number;
}

export interface Alert {
  id: string;
  message: string;
  severity: 'High' | 'Medium' | 'Low';
  suggestedActions: Action[];
  expiresAt?: number;
}

export interface RailwayData {
  trains: Train[];
  stations: Station[];
  recommendations: Recommendation[];
  alerts: Alert[];
}