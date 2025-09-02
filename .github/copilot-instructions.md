# TauleChat AI Agent Instructions

This document provides guidelines for AI agents to effectively contribute to the TauleChat codebase.

## Architecture Overview

TauleChat is a hybrid desktop application built with [Tauri](https://tauri.app/).

- **Frontend:** The user interface is built with **React**, **TypeScript**, and **Vite**.
  - **UI Components:** We use [**Shadcn UI**](https://ui.shadcn.com/) for the component library. Find the components in `src/components/ui`.
  - **Styling:** Styling is done with **Tailwind CSS**. Global styles and theme variables are defined in `src/App.css`. Adhere to the component style guidelines in `.github/instructions/style.instructions.md`.
  - **Routing:**: React Router is used for routing.
  - **State Management:** Global state is managed with [**Zustand**](https://github.com/pmndrs/zustand). The store is defined in `src/utils/store.ts`.

- **Backend:** The backend is written in **Rust** and runs within the Tauri runtime.
  - **Core Logic:** The main application logic is in `src-tauri/src/main.rs`.
  - **Communication:** The frontend communicates with the Rust backend via the Tauri API (`@tauri-apps/api`). Rust commands are invoked from the frontend to perform privileged operations.
  - **External APIs:** The Rust backend is responsible for all communication with external AI providers like OpenRouter and Gemini. It uses the fetch plugin from tauri or for making HTTP requests.

## Key Files and Directories

- `src/components/ChatScreen.tsx`: The main chat interface component.
- `src/components/ChatInput.tsx`: Handles user input, attachments, and model selection.
- `src/utils/store.ts`: The Zustand store for global application state.
- `src/lib/database/`: Contains the database connection and methods using `tauri-plugin-sql`.
- `src-tauri/src/main.rs`: The entry point for the Rust backend.
- `.github/instructions/style.instructions.md`: Contains detailed UI component style guidelines.
## Conventions

- **UI Development:** Always use components from the Shadcn UI library (`src/components/ui`) as a base. Follow the styling conventions defined in `.github/instructions/style.instructions.md`.
- **State Management:** For any global state, use the existing Zustand store. Avoid local state for data that needs to be shared across components.
- **Backend Communication:** All backend calls must go through the Tauri command invocation system. Do not make direct HTTP requests from the frontend to external APIs. The Rust layer handles this.
- **Database:** Interact with the SQLite database through the methods exposed by the `tauri-plugin-sql` and defined in `src/lib/database/methods.ts`.
