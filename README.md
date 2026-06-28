# KrishakBondhu Farmer App

KrishakBondhu (Farmer's Friend) is a comprehensive React Native mobile application built with Expo, designed to empower farmers with modern agricultural tools, community engagement, and AI-driven insights.

## About the Project

The Farmer App serves as the primary mobile interface for farmers interacting with the KrishakBondhu platform. It provides a seamless, intuitive experience tailored for agricultural use cases. Key features include:

*   **AI Disease Detection**: Farmers can upload photos of their crops, and the integrated AI model will instantly detect potential diseases and provide actionable recommendations.
*   **Community Feed**: A social platform where farmers can share updates, ask questions, and interact with peers through posts, likes, and comments.
*   **Expert Consultation**: Direct access to agricultural experts. Farmers can submit specific queries along with images to receive professional advice and diagnoses.
*   **Localized Experience**: Built-in support for multiple languages to ensure accessibility for farmers across different regions.
*   **Weather & Insights**: Real-time dashboard providing localized weather conditions and relevant farming insights.

## Technology Stack

*   **Framework**: React Native with Expo (Expo Router for navigation)
*   **State Management**: Zustand
*   **Styling**: NativeWind / Tailwind CSS
*   **API Client**: Axios
*   **Internationalization**: i18next

## Prerequisites

Before you begin, ensure you have the following installed on your development machine:

*   Node.js (v18 or higher recommended)
*   npm or yarn
*   Expo CLI
*   Expo Go app installed on your physical mobile device (Android or iOS), or an appropriate emulator/simulator configured on your machine.

## Installation and Setup

Follow these steps to get the development environment running:

1.  **Navigate to the project directory:**
    ```bash
    cd KrishakBondhu/farmer-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the `farmer-app` directory and configure the required environment variables. A typical configuration requires the backend API URL:
    ```env
    EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:8000/api/v1
    ```
    *Note: Replace `<YOUR_LOCAL_IP>` with your machine's actual IP address (e.g., `192.168.1.100`) if testing on a physical device, as `localhost` will resolve to the device itself.*

4.  **Start the development server:**
    ```bash
    npx expo start -c
    ```

5.  **Run the application:**
    *   **Physical Device**: Scan the QR code displayed in your terminal using the Expo Go app.
    *   **Android Emulator**: Press `a` in the terminal.
    *   **iOS Simulator**: Press `i` in the terminal (Requires macOS).

## Development Guidelines

*   **Components**: Reusable UI components are located in the `src/components` directory.
*   **Screens**: Application screens and routing logic are handled within the `src/app` directory using Expo Router.
*   **Services**: API integration and external service calls are abstracted in the `src/services` directory.
*   **State**: Global state management stores are defined in the `src/store` directory.

## Troubleshooting

*   **Network Errors**: Ensure your mobile device and development machine are connected to the same Wi-Fi network. Verify that the `EXPO_PUBLIC_API_URL` is pointing to the correct local IP address.
*   **Cache Issues**: If you experience unexpected behavior after updating dependencies or assets, clear the bundler cache by starting the server with the `-c` flag (`npx expo start -c`).
