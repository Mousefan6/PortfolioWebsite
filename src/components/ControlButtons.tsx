import React, { useState } from "react";

import PlayIcon from '/assets/PlayButton.png';
import PauseIcon from '/assets/PauseButton.png';
import MusicOnIcon from '/assets/MusicOn.png';
import MusicOffIcon from '/assets/MusicOff.png';
// import ListIcon from 'models/ListButton.png';

const ControlButtons = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [musicOn, setMusicOn] = useState(true);

    const togglePlay = () => {
        setIsPlaying(prev => !prev);
        
    };

    const toggleMusic = () => {
        setMusicOn(prev => !prev);
    };

    return (
        <div className="absolute top-4 right-4 flex gap-4">
            <button onClick={togglePlay}>
                <img src={isPlaying ? PauseIcon : PlayIcon} alt="Play/Pause" className="w-10 h-10" />
            </button>

            <button onClick={toggleMusic}>
                <img src={musicOn ? MusicOnIcon : MusicOffIcon} alt="Music Toggle" className="w-10 h-10" />
            </button>
        </div>
    );
};

export default ControlButtons;