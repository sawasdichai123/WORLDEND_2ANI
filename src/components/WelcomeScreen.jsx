import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';

export function WelcomeScreen({ onEnter, started }) {
    const { progress } = useProgress();
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        if (progress === 100) {
            // Longer artificial delay for "Cinematic" feel
            setTimeout(() => setShowButton(true), 2000);
        }
    }, [progress]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(5, 5, 5, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            fontFamily: "'Courier New', Courier, monospace",
            color: 'white',
            textAlign: 'center',
            userSelect: 'none',
            opacity: started ? 0 : 1,
            pointerEvents: started ? 'none' : 'auto',
            transform: started ? 'scale(1.1)' : 'scale(1)',
            transition: 'opacity 4s ease-in-out, transform 4s ease-in-out',
            animation: 'fadeInOverlay 2s ease-out' // Initial fade-in when site loads
        }}>

            {/* Decorative Borders */}
            <div style={{
                position: 'absolute',
                top: '20px', left: '20px', right: '20px', bottom: '20px',
                border: '1px solid #333',
                pointerEvents: 'none',
                opacity: 0.5
            }}>
                {/* Corner Accents */}
                <div style={{ position: 'absolute', top: '-1px', left: '-1px', width: '20px', height: '20px', borderTop: '2px solid cyan', borderLeft: '2px solid cyan' }} />
                <div style={{ position: 'absolute', top: '-1px', right: '-1px', width: '20px', height: '20px', borderTop: '2px solid cyan', borderRight: '2px solid cyan' }} />
                <div style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '20px', height: '20px', borderBottom: '2px solid magenta', borderLeft: '2px solid magenta' }} />
                <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '20px', height: '20px', borderBottom: '2px solid magenta', borderRight: '2px solid magenta' }} />
            </div>

            {/* Main Content */}
            <h3 style={{
                color: 'cyan',
                letterSpacing: '0.2em',
                fontSize: '1rem',
                marginBottom: '1rem',
                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
            }}>
                PROJECT: ARCHIVE
            </h3>

            <h1 style={{
                fontSize: '4rem',
                fontWeight: '900',
                margin: '0 0 2rem 0',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #00ffff, #ffffff, #ff00ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))'
            }}>
                WORLD END
                <br />
                <span style={{ fontSize: '2rem', letterSpacing: '0.5em', color: 'white', WebkitTextFillColor: 'white' }}>
                    2nd ANNIVERSARY
                </span>
            </h1>

            <div style={{
                width: '60%',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, cyan, magenta, transparent)',
                marginBottom: '3rem'
            }} />

            {/* LOADING / ENTER LOGIC */}
            {!showButton ? (
                <div style={{ width: '300px', textAlign: 'center' }}>
                    <p style={{ color: 'cyan', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: '10px' }}>
                        INITIALIZING SIMULATION... {Math.round(progress)}%
                    </p>
                    <div style={{ width: '100%', height: '4px', background: '#333', position: 'relative' }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'cyan',
                            boxShadow: '0 0 10px cyan',
                            transition: 'width 1.0s ease-out' // Slower filling visual
                        }} />
                    </div>
                </div>
            ) : (
                <button
                    onClick={onEnter}
                    style={{
                        background: 'transparent',
                        color: 'cyan',
                        border: '1px solid cyan',
                        padding: '15px 40px',
                        fontSize: '1.2rem',
                        letterSpacing: '0.2em',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        boxShadow: '0 0 10px rgba(0, 255, 255, 0.2)',
                        animation: 'fadeIn 2s ease forwards' // Slower button reveal
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'cyan';
                        e.currentTarget.style.color = 'black';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'cyan';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.2)';
                    }}
                >
                    ENTER SIMULATION
                </button>
            )}

            <p style={{
                marginTop: '2rem',
                color: '#666',
                fontSize: '0.8rem'
            }}>
                [ SYSTEM STATUS: {showButton ? 'ONLINE' : 'LOADING'} ] &nbsp; [ AUDIO: STANDBY ]
            </p>

            {/* Add keyframe for button fadein AND overlay enter */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
        </div>
    );
}
