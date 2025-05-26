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

const playlist = [
    {
        name: "song1",
        vocal: "/audios/song1/song1_Vocal.m4a",
        instrumental: "/audios/song1/song1_Instrumental.m4a"
    },
    {
        name: "song2",
        vocal: "/audios/song2/song2_Vocal.m4a",
        instrumental: "/audios/song2/song2_Instrumental.m4a"
    },
    {
        name: "song3",
        vocal: "/audios/song3/song3_Vocal.m4a",
        instrumental: "/audios/song3/song3_Instrumental.m4a"
    }
];

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const init = async () => {
            await audioManager.initializeAudio();
            audioManager.registerPlaylist(playlist);
            await audioManager.playNext();
            audioManager.setVolume(0.1);
            
            // Play next when current ends
            audioManager.setOnEndedHandler(async () => {
                await audioManager.playNext();
            });

            console.log("Audio is fully ready!");
            setIsReady(true);
        };

        init();

        return () => {
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
