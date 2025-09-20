# RailOptix AI Controller 

A prototype of an intelligent decision-support system prototype that assists railway traffic controllers in making optimized, real-time decisions for train movements using AI-powered recommendations and simulations. This project leverages the Google Gemini API to generate dynamic, realistic railway scenarios and provide actionable insights.

![RailOptix AI Controller Screenshot](https://github.com/ArnavG7405/railoptix-ai-controller/blob/main/Screenshot%20(2).png?raw=true)
![RailOptix AI Controller Simulation 1 Screenshot](https://github.com/ArnavG7405/railoptix-ai-controller/blob/main/Screenshot%20(4).png?raw=true)
![RailOptix AI Controller Simulation 2 Screenshot](https://github.com/ArnavG7405/railoptix-ai-controller/blob/main/Screenshot%20(6).png?raw=true)
---

##  Key Features

*   **Real-time Track Visualization**: A dynamic overview of the entire railway section, showing live train positions, stations, sidings, and platform tracks.
*   **Dynamic Train Fleet**: View a detailed list of active trains, including their status, priority, speed, and next stop.
*   **AI-Powered Recommendations**: Google Gemini generates intelligent recommendations to optimize traffic flow, improve punctuality, and manage platform assignments.
*   **Critical Conflict Alerts**: The system identifies potential conflicts and raises high-severity alerts with suggested mitigation actions.
*   **"What-If" Scenario Simulation**: Use a natural language prompt to ask the AI to predict the consequences of a proposed action, enabling proactive decision-making.
*   **Interactive Controls**: Directly manage train speeds or assign platforms from the UI to resolve situations.
*   **Client-Side Simulation**: A lightweight simulation engine handles train movement, arrivals, and departures between AI updates for a smooth, continuous experience.

##  Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS
*   **AI**: Google Gemini API (`gemini-2.5-flash`) for data generation and simulation.
*   **Runtime**: Browser-native (no build step required).

##  Getting Started

This project is configured to run directly in the browser without a build step.

### Prerequisites

*   A modern web browser.
*   A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/railoptix-ai-controller.git
    cd railoptix-ai-controller
    ```

2.  **Set up your API Key:**
    The application is designed to be deployed in an environment where the `process.env.API_KEY` is already configured (like Google AI Studio). To run it locally, you will need to serve the files and manually inject the API key. A simple way to do this is to temporarily replace `process.env.API_KEY` in `services/geminiService.ts` with your actual key **for local testing only**.

3.  **Serve the files:**
    You need a local web server to run the project. If you have Node.js installed, you can use `serve`:
    ```bash
    npx serve
    ```
    Then, open your browser to the URL provided (e.g., `http://localhost:3000`).

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
