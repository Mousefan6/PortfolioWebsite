import { useState, useEffect } from 'react';

interface OrbUIProps {
    isVisible: boolean;
    onClose: () => void;
    orbData: {
        position: { x: number; y: number; z: number };
        type: string;
        title: string;
    } | null;
}

export default function OrbUI({ isVisible, onClose, orbData }: OrbUIProps) {
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    if (!isVisible || !orbData || !isBrowser) return null;

    return (
        <div style={{ // The main UI panel
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(0%, 0%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #00FFFF',
            borderRadius: '10px',
            padding: '20px',
            color: 'white',
            zIndex: 1000,
            minWidth: '300px',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#00FFFF' }}>{orbData.title}</h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: '1px solid #00FFFF',
                        color: '#00FFFF', // Blue border around main UI
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer'
                    }}
                >
                    X
                </button>
            </div>
            <p>This is an interactive orb event!</p>
            <p>Position: {`x: ${orbData.position.x.toFixed(2)}, y: ${orbData.position.y.toFixed(2)}, z: ${orbData.position.z.toFixed(2)}`}</p>
            <button
                onClick={() => alert('Orb action triggered!')}
                style={{
                    backgroundColor: '#00FFFF',
                    color: '#000',
                    border: 'none',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '10px'
                }}
            >
                Take Action
            </button>
        </div>
    );
}