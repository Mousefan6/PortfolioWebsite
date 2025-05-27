import { useState, useEffect, useRef } from "react";

import AudioVisualizer from "./AudioVisualizer";

import { Volume2, VolumeX, Volume1, SkipBack, Pause, Play, SkipForward } from 'lucide-react';
import { useAudioPlayer } from "../hooks/AudioProvider";

const ControlButtons = () => {
    const { isReady, audioManager } = useAudioPlayer();

    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(5); // Volume from 0-100
    const [isMuted, setIsMuted] = useState(false);
    const previousVolume = useRef(volume);
    const [currentSong, setCurrentSong] = useState(audioManager.getCurrentSong() || null);
    const [progressPercent, setProgressPercent] = useState(0);
    const [draggedPercent, setDraggedPercent] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);


    const togglePlay = () => {
        setIsPlaying(prev => !prev);
        isPlaying ? audioManager.pause() : audioManager.resume();
    };

    const handleVolumeChange = (e: { target: { value: string; }; }) => {
        const newVolume = parseInt(e.target.value);
        setVolume(newVolume);
        previousVolume.current = newVolume;
        setIsMuted(false);
        audioManager.setVolume(newVolume / 100);
    };

    const skipBackward = async () => {
        await audioManager.playPrevious();

        const contextState = audioManager.context?.state;
        setIsPlaying(contextState === 'running');
        setCurrentSong(audioManager.getCurrentSong() || null);
    };

    const skipForward = async () => {
        await audioManager.playNext();

        const contextState = audioManager.context?.state;
        setIsPlaying(contextState === 'running');
        setCurrentSong(audioManager.getCurrentSong() || null);
    }

    const getVolumeIcon = () => {
        if (volume === 0 || isMuted) return <VolumeX size={25} />;
        if (volume < 30) return <Volume1 size={25} />;
        return <Volume2 size={25} />;
    };

    // Handles offset of the progress bar when dragged/clicked
    const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.min(Math.max(clickX / rect.width, 0), 1);

        const duration = audioManager.getDuration();
        const newTime = percent * duration;

        if (isDragging) {
            setDraggedPercent(percent * 100);
        }

        if (e.type === 'mouseup' || e.type === 'click') {
            audioManager.seek(newTime);
            setDraggedPercent(null);
        }
    };

    // Update the text for the song currently being played
    useEffect(() => {
        const updateCurrentSong = () => {
            setCurrentSong(audioManager.getCurrentSong());
        };

        // Init with current song
        updateCurrentSong();

        audioManager.addOnEndedListener(updateCurrentSong);

        return () => {
            audioManager.removeOnEndedListener(updateCurrentSong);
        };
    }, [isReady]);

    // Update the progress bar
    useEffect(() => {
        let animationFrame: number;

        const update = () => {
            if (!isDragging) {
                const currentTime = audioManager.getCurrentTime?.() || 0;
                const duration = audioManager.getDuration?.() || 1;

                setProgressPercent((currentTime / duration) * 100);
            }
            animationFrame = requestAnimationFrame(update);
        };

        update();
        return () => cancelAnimationFrame(animationFrame);
    }, [isDragging]);

    // Handle dragging
    useEffect(() => {
        const onMouseUp = () => setIsDragging(false);
        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, []);

    return (
        <div className="absolute top-4 left-4 flex gap-4">
            <div className="w-96 h-48 flex flex-col gap-1.5">
                {/* Top Slice (40%-60% split) */}
                <div className="flex h-1/4 gap-1.5">
                    <div
                        className="w-[40%] bg-blue-500 px-2 flex items-center justify-start rounded-md opacity-75"
                        style={{
                            clipPath: 'polygon(0 0, 72% 0, 100% 100%, 0 100%)',
                            transform: 'translateX(20.5%)'
                        }}
                    >
                        <button
                            onClick={() => {
                                if (isMuted) {
                                    // Unmute: restore previous volume
                                    setVolume(previousVolume.current);
                                    audioManager.setVolume(previousVolume.current / 100);
                                    setIsMuted(false);
                                } else {
                                    // Mute: store and set volume to 0
                                    previousVolume.current = volume;
                                    setVolume(0);
                                    audioManager.setVolume(0);
                                    setIsMuted(true);
                                }
                            }}
                            disabled={!isReady}
                            className="p-1 hover:bg-blue-400/10 rounded-full"
                        >
                            {getVolumeIcon()}
                        </button>

                        {/* Volume slider */}
                        <div className="relative w-full h-5 flex items-center">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                disabled={!isReady}
                                onChange={handleVolumeChange}
                                className="w-18 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    <div
                        className="w-[60%] mr-[5%] bg-green-500 px-2 flex items-center justify-center rounded-md opacity-75"
                        style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 19% 100%, 0 0)',
                            transform: 'translateX(-5%)'
                        }}
                    >
                        60%
                    </div>
                </div>

                {/* Middle Slice (audio visualizer & progress bar) */}
                <div className="h-1/2 mx-7.5 bg-cyan-400 flex items-center justify-center rounded-md opacity-75 relative">

                    {/* Dark progress fill — playback position */}
                    <div
                        className="absolute top-0 left-0 h-full bg-black/20 rounded-md z-10 pointer-events-none"
                        style={{ width: `${draggedPercent ?? progressPercent}%` }}
                    />


                    {/* Interactive background bar */}
                    <div
                        className="absolute top-0 left-0 w-full h-full bg-cyan-400/10 cursor-pointer rounded-md z-30"
                        onMouseDown={(e) => {
                            setIsDragging(true);
                            handleSeek(e);
                        }}
                        onMouseMove={(e) => {
                            if (isDragging) handleSeek(e);
                        }}
                        onMouseUp={(e) => {
                            if (isDragging) {
                                handleSeek(e);
                                setIsDragging(false);
                            }
                        }}
                        onMouseLeave={() => {
                            if (isDragging) setIsDragging(false);
                        }}
                    />

                    {/* Foreground visualizer */}
                    <AudioVisualizer className="w-[80%] z-40 pointer-events-none" barColor="#FF69B4" />
                </div>

                {/* Bottom Slice (30%-70% split) */}
                <div className="flex h-1/4 gap-1.5">
                    <div
                        className="w-[40%] bg-yellow-500 px-0.5 flex items-center justify-start rounded-md opacity-75"
                        style={{
                            clipPath: 'polygon(0 0, 100% 0, 90% 0, 0 290%)',
                            transform: 'translateX(19.5%)'
                        }}
                    >
                        <button
                            onClick={skipBackward}
                            disabled={!isReady}
                            className="p-2 hover:bg-blue-400/50 rounded-full transition-all"
                        >
                            <SkipBack size={17.5} />
                        </button>

                        <button
                            onClick={togglePlay}
                            disabled={!isReady}
                            className="p-2 hover:bg-green-400/50 rounded-full transition-all"
                        >
                            {isPlaying ? <Pause size={17.5} /> : <Play size={17.5} />}
                        </button>

                        <button
                            onClick={skipForward}
                            disabled={!isReady}
                            className="p-2 hover:bg-blue-400/50 rounded-full transition-all"
                        >
                            <SkipForward size={17.5} />
                        </button>
                    </div>

                    <div
                        className="w-[60%] bg-purple-500 px-2 flex items-center justify-center rounded-md opacity-75"
                        style={{
                            clipPath: 'polygon(0 100%, 20% 0, 100% 0, 0 100000%, 0 0)',
                            transform: 'translateX(-13.5%)'
                        }}
                    >
                        {currentSong}
                    </div>
                </div>
            </div>
        </div>
    )
};

export default ControlButtons;