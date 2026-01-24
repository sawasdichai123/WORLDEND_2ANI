import { create } from 'zustand';

export const useStore = create((set) => ({
    // Interaction State
    hovered: false,
    hoverText: null,
    setHover: (isHovered, text = null) => set({ hovered: isHovered, hoverText: text }),

    // Mobile Input State
    joystick: { x: 0, y: 0 },
    setJoystick: (x, y) => set({ joystick: { x, y } }),

    joystickLook: { x: 0, y: 0 },
    setJoystickLook: (x, y) => set({ joystickLook: { x, y } }),
}));
