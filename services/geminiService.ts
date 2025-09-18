import { GoogleGenAI, Type } from "@google/genai";
import type { RailwayData, Action, Train, Station, Recommendation, Alert } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const actionSchema = {
    type: Type.OBJECT,
    properties: {
        displayText: { type: Type.STRING, description: "User-friendly text for the action button, e.g. 'Move T12345 to siding'." },
        command: { type: Type.STRING, description: "Machine-readable command: 'MOVE_SIDING', 'HOLD', or 'PROCEED'." },
        trainId: { type: Type.STRING, description: "The ID of the target train, e.g., 'T12345'." },
        stationName: { type: Type.STRING, description: "The name of the target station (required for MOVE_SIDING and HOLD)." },
    },
    required: ['displayText', 'command', 'trainId'],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    trains: {
      type: Type.ARRAY,
      description: "List of active trains in the section.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique train ID, e.g., T12345" },
          name: { type: Type.STRING, description: "Train name, e.g., 'Rajdhani Express'" },
          type: { type: Type.STRING, description: "Type of train: 'Express', 'Freight', 'Local', 'Special'" },
          priority: { type: Type.INTEGER, description: "Priority from 1 (highest) to 5 (lowest)" },
          status: { type: Type.STRING, description: "Current status: 'On Time', 'Delayed', 'Approaching', 'Stopped', 'Siding'" },
          currentLocation: { type: Type.STRING, description: "Current station or 'In Transit'" },
          nextStop: { type: Type.STRING, description: "The next station on its route." },
          progress: { type: Type.INTEGER, description: "Progress through the section, from 0 to 100." },
          track: { type: Type.STRING, description: "Current track: 'main', 'siding', or 'platform-N' (e.g., 'platform-1')." },
          direction: { type: Type.STRING, description: "Direction of travel: 'Eastbound' (increasing progress) or 'Westbound' (decreasing progress)." },
          speed: { type: Type.INTEGER, description: "Current speed in km/h. 0 if stopped or in siding." },
        },
      },
    },
    stations: {
      type: Type.ARRAY,
      description: "List of stations in this section.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique station code, e.g., 'PRYJ'" },
          name: { type: Type.STRING, description: "Full station name, e.g., 'Prayagraj'" },
          position: { type: Type.INTEGER, description: "Position on the track, from 0 to 100." },
          hasSiding: { type: Type.BOOLEAN, description: "True if the station has a siding track." },
          platformTracks: { type: Type.INTEGER, description: "Number of platform tracks at the station (1 if it's just the main line)." },
        },
      },
    },
    recommendations: {
      type: Type.ARRAY,
      description: "AI-generated recommendations for the controller.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for the recommendation." },
          title: { type: Type.STRING, description: "A brief summary of the recommendation's goal." },
          reason: { type: Type.STRING, description: "Justification for the recommendation." },
          actions: { type: Type.ARRAY, description: "A list of specific, structured action objects.", items: actionSchema },
        },
      },
    },
    alerts: {
      type: Type.ARRAY,
      description: "Urgent alerts about potential conflicts.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique ID for the alert." },
          message: { type: Type.STRING, description: "Description of the conflict or issue." },
          severity: { type: Type.STRING, description: "Severity level: 'High', 'Medium', 'Low'" },
          suggestedActions: { type: Type.ARRAY, description: "A list of suggested structured action objects to mitigate the alert.", items: actionSchema },
        },
      },
    },
  },
};

const PROMPT = `
  Act as a railway traffic simulator for a busy 100km section of Indian Railways named 'Ganga-Yamuna Corridor'.
  
  **Corridor Geography**:
  - The corridor runs West-to-East.
  - 'Prayagraj' is at the western end (position: 5%).
  - 'Vindhyachal' is mid-corridor (position: 35%).
  - 'Mirzapur' is mid-corridor (position: 65%).
  - 'Chunar' is at the eastern end (position: 95%).

  It's peak hours. Generate a realistic, dynamic snapshot of the current state based on the following rules.
  
  **Simulation Rules**:
  - Create 6-8 trains of mixed types ('Express', 'Freight', 'Local'). Include at least one high-priority 'Express' like 'Vande Bharat'.
  - **Directional Logic (Strictly Enforce)**:
    - Trains moving towards Chunar (East) MUST have \`direction: 'Eastbound'\`.
    - Trains moving towards Prayagraj (West) MUST have \`direction: 'Westbound'\`.
  - **Speed Logic**: Assign a realistic speed in km/h for each train. Express trains should be faster (e.g., 90-130 km/h). Freight trains slower (e.g., 50-70 km/h). Local trains moderate (e.g., 40-60 km/h). Trains with status 'Stopped' or 'Siding' MUST have a speed of 0.
  - Ensure some trains are delayed and some are on time to create a challenging scenario.
  - Set train progress realistically. Most trains in transit should be on the 'main' track.
  - Stations have the following infrastructure: 'Prayagraj' (2 platform tracks), 'Vindhyachal' (2 platform tracks, has a siding), 'Mirzapur' (2 platform tracks), and 'Chunar' (3 platform tracks, has a siding).
  - If a train is 'Stopped' at a station with multiple platforms, assign its 'track' to 'platform-1', 'platform-2', etc.
  - Based on the train positions, generate 2-3 actionable recommendations focused on efficiency and punctuality. These are time-sensitive. When describing a train in the 'title' or 'reason' of a recommendation, specify its direction of travel for clarity (e.g., "...T12345 heading Westbound...").
  - Identify 1-2 potential high-severity conflicts or alerts focused on safety. These are very time-sensitive.
  - **Crucially, if a situation generates a 'High' severity alert, the actions to resolve it should ONLY appear under that alert. Do NOT create a separate, redundant recommendation for the same issue.**
  - Each action in 'actions' or 'suggestedActions' MUST be a structured object with 'displayText', a 'command' ('MOVE_SIDING', 'HOLD', 'PROCEED'), a 'trainId', and an optional 'stationName'.
  - Provide the output in a single JSON object matching the provided schema. Do not include any other text or markdown.
`;


const calculateLifetime = (action: Action, trains: Train[], stations: Station[]): number => {
    const train = trains.find(t => t.id.startsWith(action.trainId));
    const station = stations.find(s => s.name === action.stationName);
    
    // User requested minimum lifetime of 2 minutes (120,000 ms)
    const minLifetime = 120000;
    // Set a reasonable maximum lifetime of 5 minutes for UI sanity
    const maxLifetime = 300000;

    if (train && station && train.speed && train.speed > 10) {
        const distance = Math.abs(train.progress - station.position); // distance in km (since corridor is 100km)
        const timeHours = distance / train.speed;
        let lifetimeMs = timeHours * 3600 * 1000;

        // Scale down for better UX pace (e.g., 10 minutes real time becomes 1 minute in UI)
        lifetimeMs /= 10;
        
        // Clamp lifetime to be between 2 minutes and 5 minutes
        return Math.max(minLifetime, Math.min(maxLifetime, lifetimeMs));
    }

    // Fallback for stopped trains, missing data, or other edge cases
    return minLifetime;
};


export const getRailwayData = async (): Promise<RailwayData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: PROMPT,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });
    
    const jsonString = response.text.trim();
    const rawData = JSON.parse(jsonString);
    
    // Sanitize data and provide defaults for missing arrays
    const data: RailwayData = {
        trains: rawData.trains || [],
        stations: rawData.stations || [],
        recommendations: rawData.recommendations || [],
        alerts: rawData.alerts || [],
    };

    const now = Date.now();
    // Use a temporary map for original IDs to find trains before we add the timestamp
    const trainIdMap = new Map(data.trains.map(t => [t.id, t]));
    const stationMap = new Map(data.stations.map(s => [s.name, s]));
    
    data.trains.forEach((t: Train, i: number) => {
        // Store original ID before modification
        const originalId = t.id;
        t.id = `${t.id || `train-${i}`}-${now}`;
        // Update the map to point to the full train object with the new ID
        trainIdMap.set(originalId, t);
    });
    
    data.recommendations.forEach((r: Recommendation, i: number) => {
        r.id = `rec-${i}-${now}`;
        const representativeAction = r.actions[0];
        const lifetime = representativeAction ? calculateLifetime(representativeAction, data.trains, data.stations) : 120000; // Fallback to 2 minutes
        r.expiresAt = now + lifetime;
    });

    data.alerts.forEach((a: Alert, i: number) => {
        a.id = `alert-${i}-${now}`;
        const representativeAction = a.suggestedActions[0];
        const lifetime = representativeAction ? calculateLifetime(representativeAction, data.trains, data.stations) : (a.severity === 'High' ? 120000 : 150000); // Fallbacks also >= 2 minutes
        a.expiresAt = now + lifetime;
    });
    
    return data;
  } catch (error) {
    console.error("Error fetching railway data from Gemini API:", error);
    throw new Error("Failed to generate railway simulation data.");
  }
};


export const runWhatIfSimulation = async (currentState: RailwayData, action: string): Promise<string> => {
    const simulationPrompt = `
      You are a railway operations expert AI.
      Current State:
      - Trains: ${JSON.stringify((currentState?.trains || []).map(t => ({id: t.id, status: t.status, progress: t.progress, priority: t.priority})))}
      - Alerts: ${JSON.stringify((currentState?.alerts || []).map(a => a.message))}
      
      Proposed Action by Controller: "${action}"
      
      Analyze the likely consequences of this action over the next 30 minutes. Provide a concise, bulleted summary of the predicted outcome. Focus on changes to train delays, resolution of existing alerts, and any new conflicts that might arise. Start your response with "Simulation Result:".
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: simulationPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error running what-if simulation:", error);
        throw new Error("Failed to run simulation.");
    }
};