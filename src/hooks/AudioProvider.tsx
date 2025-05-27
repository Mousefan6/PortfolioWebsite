/**************************************************************
* Author(s): Bryan Lee
* Last Updated: 5/25/2025
*
* File:: AudioProvider.ts
*
* Description:: This file serves the global hook provider for the Audio Manager object
*               and handles the initialization of it. Prevents double rendering.
*
**************************************************************/

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { audioManager } from '../util/AudioManager';

type AudioContextType = {
    isReady: boolean;
    audioManager: typeof audioManager;
};

const AudioContext = createContext<AudioContextType>({
    isReady: false,
    audioManager
});

const base = import.meta.env.BASE_URL;
const playlist = [
    {
        name: "song1",
        vocal: `${base}audios/song1/song1_Vocal.m4a`,
        instrumental: `${base}audios/song1/song1_Instrumental.m4a`
    },
    {
        name: "song2",
        vocal: `${base}audios/song2/song2_Vocal.m4a`,
        instrumental: `${base}audios/song2/song2_Instrumental.m4a`
    },
    {
        name: "song3",
        vocal: `${base}audios/song3/song3_Vocal.m4a`,
        instrumental: `${base}audios/song3/song3_Instrumental.m4a`
    }
];

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const initialized = useRef(false);

    const startAudio = async () => {
        if (initialized.current) return;
        initialized.current = true;

        await audioManager.initializeAudio();
        audioManager.registerPlaylist(playlist);
        await audioManager.playNext();
        audioManager.setVolume(0.05);

        audioManager.addOnEndedListener(async () => {
            await audioManager.playNext();
        });

        console.log("Audio is fully ready!");
        setIsReady(true);
    };

    useEffect(() => {
        const handleFirstClick = async () => {
            await startAudio();
            window.removeEventListener('click', handleFirstClick);
        };

        window.addEventListener('click', handleFirstClick, { once: true });

        return () => {
            window.removeEventListener('click', handleFirstClick);
            audioManager.stop();
        };
    }, []);

    return (
        <AudioContext.Provider value={{ isReady, audioManager }}>
            {children}
        </AudioContext.Provider>
    );
}

export const useAudioPlayer = () => useContext(AudioContext);
