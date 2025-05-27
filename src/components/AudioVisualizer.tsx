import { useEffect, useRef } from "react";
import { audioManager } from "../util/AudioManager";

interface AudioVisualizerProp {
    width?: number;
    height?: number;
    barWidth?: number;
    gap?: number;
    backgroundColor?: string;
    barColor?: string;
    className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProp> = ({
    width = 250,
    height = 100,
    barWidth = 3,
    gap = 2,
    backgroundColor = "transparent",
    barColor = "rgb(160, 198, 255)",
    className = ""
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const draw = () => {
            requestAnimationFrame(draw);

            const data = audioManager.getAudioData();
            if (!data.length) return;

            // Compute the number of bars
            const barCount = Math.round((width + gap) / (barWidth + gap));
            const barSpacing = barWidth + gap;
            const minBarHeight = 1;

            // Clear the canvas
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, width, height);

            // Taking a quarter of the data to get a better average and visualization
            const fftBins = data.length / 8;

            const silenceThreshold = -95;
            const isSilent = data.every((val) => val <= silenceThreshold);

            // Iterate through each bar and compute their normalized amplitude
            for (let i = 0; i < barCount; i++) {
                let barHeight = minBarHeight;

                if (!isSilent) {
                    // Map bar i to a frequency range using log scale
                    const startFreq = Math.floor(Math.pow(i / barCount, 2) * fftBins);
                    const endFreq = Math.floor(Math.pow((i + 1) / barCount, 2) * fftBins);
                    
                    // Acquire the lowest and highest values in the frequency range
                    let minVal = Infinity;
                    let maxVal = -Infinity;
                    for (let j = startFreq; j < endFreq; j++) {
                        const val = data[j];
                        if (val !== undefined) {
                            if (val > maxVal) maxVal = val;
                            if (val < minVal) minVal = val;
                        }
                    }
                    
                    // Normalize the difference between minVal and maxVal to [0, 1] 
                    const span = maxVal - minVal;
                    const normalized = Math.max(0, span / 90);

                    barHeight = Math.max(normalized * (height / 2), minBarHeight);
                }
                
                // Update the bar size according to frequency
                ctx.fillStyle = barColor;
                ctx.fillRect(
                    i * barSpacing,
                    height / 2 - barHeight,
                    barWidth,
                    barHeight * 2
                );
            }
        };

        draw();
    }, [width, height, barWidth, gap, backgroundColor, barColor]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`rounded-md ${className}`}
        />
    );
};

export default AudioVisualizer;
