# System Architecture Diagram

## High-Level Architecture
The application follows a standard React + Three.js (R3F) architecture.
- **Frontend Framework**: React 19 (Vite)
- **3D Engine**: React Three Fiber (Three.js)
- **State Management**: Local State (migrating to Global Store recommended)
- **Styling**: CSS Modules / Global CSS

```mermaid
graph TD
    subgraph Client [Client Browser]
        Entry[index.html / main.jsx]
        
        subgraph Logic [App Logic]
            App[App.jsx]
            State[State Management (Props/State)]
        end
        
        subgraph ThreeScene [3D Canvas (R3F)]
            Player[Player Controller]
            Camera[Perspective Camera]
            
            subgraph Environment
                Env[EnvironmentEnhancements]
                Lights[Ambient/Point Lights]
                Particles[Particles System]
            end
            
            subgraph Venue
                Stage[Stage Area]
                Screen[Video Board]
                Walls[Collision Boundaries]
                Decor[SpecialThanks / Portraits]
            end
        end
        
        subgraph UI_Overlay [UI Overlay (HTML)]
            Welcome[WelcomeScreen]
            Reticle[Cursor Reticle]
            Controls[Control Panel (Video)]
        end
        
        Entry --> App
        App --> State
        App --> ThreeScene
        App --> UI_Overlay
        
        State -- "IsPlaying / Volume" --> Stage
        State -- "GameStarted" --> Player
        
        Player -- "Position Updates" --> Camera
        Player -- "Collision Checks" --> Walls
    end
```

## Component Breakdown

| Component | Responsibility | Current Location |
|-----------|---------------|------------------|
| **App** | Main composition, State holder | `src/App.jsx` |
| **Player** | First-person controls, Collision logic | `src/App.jsx` (Internal) |
| **Stage** | Video player screen, Frame, Speakers | `src/App.jsx` (Internal) |
| **VideoDisplay** | Renders the video texture | `src/App.jsx` (Internal) |
| **ControlPanel** | UI for video playback | `src/App.jsx` (Internal) |
| **SpecialThanks** | Credits board | `src/App.jsx` (Internal) |
| **Environment** | Fog, Stars, Particles | `src/components/EnvironmentEnhancements.jsx` |
| **WelcomeScreen** | distinct entry UI | `src/components/WelcomeScreen.jsx` |

## Data Flow
1. **User Input** (Keyboard/Mouse) -> **Player Component** -> **Camera Position**.
2. **User Interaction** (Click) -> **ControlPanel** -> **App State** -> **VideoDisplay**.
