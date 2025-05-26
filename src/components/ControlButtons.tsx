import { useState, useRef } from "react";

import { useAudioPlayer } from '../hooks/AudioProvider';

import PlayIcon from '/assets/Play.png';
import PauseIcon from '/assets/Pause.png';
import MusicMax from '/assets/VolumeMax.png';
import MusicLow from '/assets/VolumeLow.png';
import MusicNone from '/assets/VolumeX.png';
import MusicBack from '/assets/GoBackward.png';
import MusicSkip from '/assets/SkipForward.png';

const ControlButtons = () => {
    const { isReady, audioManager } = useAudioPlayer();

    const [isPlaying, setIsPlaying] = useState(true);
    const [volume, setVolume] = useState(10); // Volume from 0-100
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const previousVolume = useRef(volume);

    const togglePlay = () => {
        setIsPlaying(prev => !prev);

        if (isPlaying) {
            audioManager.pause();
        } else {
            audioManager.resume();
        }
        console.log('Toggled play/pause button');
    };

    const handleVolumeChange = (e: { target: { value: string; }; }) => {
        const newVolume = parseInt(e.target.value);
        setVolume(newVolume);
        audioManager.setVolume(newVolume / 100);
        console.log('Volume changed to:', newVolume);
    };

    const skipBackward = async () => {
        console.log('Skip backward clicked');
        await audioManager.playPrevious();

        const contextState = audioManager.context?.state;
        setIsPlaying(contextState === 'running');
    };

    const skipForward = async () => {
        console.log('Skip forward clicked');
        await audioManager.playNext();

        const contextState = audioManager.context?.state;
        setIsPlaying(contextState === 'running');
    }

    const getVolumeIcon = () => {
        if (volume === 0) return <img src={MusicNone} alt="Muted" className="w-6 h-6" />;
        if (volume < 30) return <img src={MusicLow} alt="Low Volume" className="w-6 h-6" />;
        return <img src={MusicMax} alt="High Volume" className="w-6 h-6" />;
    };

    return (
        <div className="absolute top-4 left-4 flex gap-4">
            {/* Back button for songs*/}
            <button
                onClick={skipBackward}
                disabled={!isReady}
                className="hover:opacity-80 transition-opacity"
            >
                <img src={MusicBack} alt="Skip Backward" className="w-6 h-6" />
            </button>

            {/* Play button */}
            <button
                onClick={togglePlay}
                disabled={!isReady}
                className="hover:opacity-80 transition-opacity"
            >
                <img
                    src={isPlaying ? PauseIcon : PlayIcon}
                    alt={isPlaying ? "Pause" : "Play"}
                    className="w-6 h-6"
                />
            </button>

            {/* Skip Forward Button */}
            <button
                onClick={skipForward}
                disabled={!isReady}
                className="hover:opacity-80 transition-opacity"
            >
                <img src={MusicSkip} alt="Skip Forward" className="w-6 h-6" />
            </button>

            {/* Volume Control */}
            <div className="relative flex items-center gap-2">
                <button
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    disabled={!isReady}
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
                    className="hover:opacity-80 transition-opacity"
                >
                    {getVolumeIcon()}
                </button>

                {/* Volume Slider */}
                {showVolumeSlider && (
                    <div
                        className="absolute left-14 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
                        onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                disabled={!isReady}
                                min="0"
                                max="100"
                                value={volume}
                                onChange={handleVolumeChange} // Calls function to update volume
                                className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ControlButtons;