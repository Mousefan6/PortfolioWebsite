import React, { useState } from "react";

import { audioManager } from '../util/AudioManager';

import MusicIcon from '/assets/Music.png';
import PlayIcon from '/assets/Play.png';
import PauseIcon from '/assets/Pause.png';
import MusicMax from '/assets/VolumeMax.png';
import MusicLow from '/assets/VolumeLow.png';
import MusicNone from '/assets/VolumeX.png';
import MusicBack from '/assets/GoBackward.png';
import MusicSkip from '/assets/SkipForward.png';

const ControlButtons = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(50); // Volume from 0-100
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);

    const togglePlay = () => {
        setIsPlaying(prev => !prev);
        console.log('Toggled play/pause button');
    };

    const handleVolumeChange = (e: { target: { value: string; }; }) => {
        const newVolume = parseInt(e.target.value);
        setVolume(newVolume); // CHANGE AUDIO SHOULD BE CALLED HERE
        console.log('Volume changed to:', newVolume);
    };

    const skipBackward = () => {
        console.log('Skip backward clicked');
    };

    const skipForward = () => {
        console.log('Skip forward clicked');
    };

    const getVolumeIcon = () => {
        if (volume === 0) return <img src={MusicNone} alt="Muted" className="w-6 h-6" />;
        if (volume < 30) return <img src={MusicLow} alt="Low Volume" className="w-6 h-6" />;
        return <img src={MusicMax} alt="High Volume" className="w-6 h-6" />;
    };

    return (
        <div className="absolute top-4 left-4 flex-container gap-4">
            <div className="rounded-lg bg-amber-50">
                {/* Music Icon */}
                    <img src={MusicIcon} alt="Music Icon" className="w-6 h-6" />

                {/* Popup Tag*/}
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-blue-600 h-2.5 rounded-full w-[10%]"></div>
                </div>
                <text>
                    Song Playing:
                </text>

                {/* Back button for songs */}
                <button
                    onClick={skipBackward}
                    className="hover:opacity-80 transition-opacity"
                >
                    <img src={MusicBack} alt="Skip Backward" className="w-6 h-6" />
                </button>

                {/* Play button */}
                <button
                    onClick={togglePlay}
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
                    className="hover:opacity-80 transition-opacity"
                >
                    <img src={MusicSkip} alt="Skip Forward" className="w-6 h-6" />
                </button>
            

            <div className="rounded-lg bg-amber-50">
                {/* Volume Control */}
                <div className="relative flex items-center gap-2">
                    <button
                        onMouseEnter={() => setShowVolumeSlider(true)}
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
                                    min="0"
                                    max={volume}
                                    onChange={handleVolumeChange} // Calls function to update volume
                                    className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

export default ControlButtons;