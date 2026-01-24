# Migration & Refactoring Plan

## 1. Goal
Scalability and Maintainability.
The current `App.jsx` is monolithic (containing Player, Stage, UI logic mixed together). As the system grows, this will become unmaintainable.
We need to decouple components and introduce a proper state management system.

## 2. Proposed Directory Structure
```
src/
├── assets/             # Static assets (images, videos)
├── components/
│   ├── core/           # Essential 3D components (Player, CameraRig)
│   ├── venue/          # World objects (Stage, Walls, SpecialThanks)
│   ├── ui/             # 2D Interfaces (WelcomeScreen, ControlPanel, Reticle)
│   └── effects/        # Visual effects (EnvironmentEnhancements)
├── hooks/              # Custom hooks (useVideoPlayer, useKeyboard)
├── store/              # Global state (Zustand)
├── utils/              # Helper functions (math, collision helpers)
├── App.jsx             # Main composition only
└── main.jsx            # Entry point
```

## 3. Migration Steps

### Phase 1: Dependency Updates
- [ ] Install **Zustand** for state management (better than Context for 3D/game state).
  - `npm install zustand`

### Phase 2: Component Extraction (Iterative)
Break down `App.jsx` by extracting internal functions into dedicated files.

| Component | New Location | Dependencies to Pass |
|-----------|--------------|----------------------|
| `Player` | `components/core/Player.jsx` | `checkCollision` logic (move to utils or hook) |
| `Stage` | `components/venue/Stage.jsx` | `videoTexture`, `isPlaying` |
| `ControlPanel` | `components/ui/ControlPanel.jsx` | `setBrightness`, `videoControl` |
| `SpecialThanksBoard` | `components/venue/SpecialThanks.jsx` | None |
| `Reticle` | `components/ui/Reticle.jsx` | Mouse events |

### Phase 3: Global State Implementation
Replace Prop Drilling with a Global Store.

**Store Schema (provisional):**
```javascript
// src/store/gameStore.js
import { create } from 'zustand'

export const useGameStore = create((set) => ({
  gameStarted: false,
  setGameStarted: (v) => set({ gameStarted: v }),
  
  // Video State
  isPlaying: false,
  volume: 0.5,
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  // UI State
  brightness: 1.2,
  setBrightness: (v) => set({ brightness: v })
}))
```

### Phase 4: Main Composition
Clean up `App.jsx` to be a declarative composition of the Scene.

```jsx
// Future App.jsx
<Canvas>
  <Physics> {/* if needed later */}
    <Player />
    <Stage />
    <Venue />
    <Effects />
  </Physics>
</Canvas>
<UIOverlay />
```

## 4. Crosscheck & Validation
### Feasibility Report
- **Risk**: Extracting `Player` requires careful handling of the `ref` passed to `Camera`.
- **Validation**:
  - The `Player` component currently relies on closures for `checkCollision`. This logic must be moved to a standalone function or hook `useCollision()` to work in a separate file.
  - Video HTML element is created inside `App`. Pass this as a Ref to the store or keep it in a `VideoManager` component.

### Next Immediate Steps
1. Create directories.
2. Extract `Stage` and `SpecialThanksBoard` first (easiest, fewest dependencies).
3. Validate application still runs.
4. Extract `Player` (Complex, needs collision logic refactor).
