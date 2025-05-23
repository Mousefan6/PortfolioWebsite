/**************************************************************
* Author(s): Jaden Lee, Bryan Lee
* Last Updated: 5/23/2025
*
* File:: AudioManager.ts
*
* Description:: This file controls the audio for the scene and tracks the frequency data.
*
**************************************************************/

export class AudioManager {
    // Audio handlers
    public context: AudioContext | null;
    private vocalSource: AudioBufferSourceNode | null;
    private instrumentalSource: AudioBufferSourceNode | null = null;
    public vocalAnalyser: AnalyserNode | null = null;
    public instrumentalAnalyser: AnalyserNode | null = null;

    // Audio metadata
    private vocalData: Float32Array | null;
    private instrumentalData: Float32Array | null;
    private gainNode: GainNode | null;
    private vocalBuffer: AudioBuffer | null = null;
    private instrumentalBuffer: AudioBuffer | null = null;

    // Audio state
    public initialized: boolean;
    public playing: boolean;
    public muted: boolean;

    // Audio settings
    public currentSong: string | null;
    public autoplay: boolean;

    importedSounds: Map<string, [string, string]>;

    constructor() {
        // Audio handlers
        this.context = null;
        this.vocalSource = null;
        this.instrumentalSource = null;
        this.vocalAnalyser = null;
        this.instrumentalAnalyser = null;

        // Audio metadata
        this.vocalData = null;
        this.instrumentalData = null;
        this.gainNode = null;
        this.vocalBuffer = null;
        this.instrumentalBuffer = null;

        // Audio state
        this.initialized = false;
        this.playing = false;
        this.muted = false;

        // Audio settings
        this.currentSong = null;
        this.autoplay = false;

        this.importedSounds = new Map<string, [string, string]>();
    }

    /**
     * Initialize the audio manager with an audio context, analyser, and gain node (volume)
     * 
     * @returns True if audio is initialized, false otherwise
     */
    public initializeAudio(): boolean {
        if (this.initialized) {
            return true;
        }

        try {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

            this.gainNode = this.context.createGain();
            this.gainNode.gain.value = 0.5;
            this.gainNode.connect(this.context.destination);

            this.initialized = true;
            console.log("Audio Manager initialized!");
            return true;
        } catch (e) {
            console.error("Failed to initialize audio manager:", e);
            return false;
        }
    }

    /**
     * Registers a single audio file
     * 
     * @param name The name of the audio file.
     * @param fileUrlVocal The file URL of the vocal audio file.
     * @param fileUrlInstrumental The file URL of the instrumental audio file.
     */
    public registerAudio(name: string, fileUrlVocal: string, fileUrlInstrumental: string): void {
        this.importedSounds.set(name, [fileUrlVocal, fileUrlInstrumental]);
    }

    /**
     * Registers multiple audio files
     * 
     * @param audios An array of tuples containing the name and tuple of files vocal
     *               and instrumental of each audio file.
     * 
     * Example:
     * audioManager.registerAudios([
     *     ["song1", ["/audio/vocals1.mp3", "/audio/instrumental1.mp3"]],
     *     ["song2", ["/audio/vocals2.mp3", "/audio/instrumental2.mp3"]],
     * ]);
     *
     */
    public registerAudios(audios: [string, [string, string]][]): void {
        audios.forEach(([name, [fileUrlVocal, fileUrlInstrumental]]) => {
            this.registerAudio(name, fileUrlVocal, fileUrlInstrumental);
        });
    }

    /**
     * Loads a audio file for playing
     * 
     * @param name The registered audio's name.
     * @returns Whether loading the audio was successful or not.
     */
    public async loadAudio(name: string): Promise<boolean> {
        if (!this.initialized && !this.initializeAudio()) {
            return false;
        }

        try {
            const urls = this.importedSounds.get(name);
            if (!urls) throw new Error(`Audio "${name}" not found.`);

            const [vocalUrl, instrumentalUrl] = urls;

            const [vocalBuffer, instrumentalBuffer] = await Promise.all([
                fetch(vocalUrl).then(res => res.arrayBuffer()).then(buf => this.context!.decodeAudioData(buf)),
                fetch(instrumentalUrl).then(res => res.arrayBuffer()).then(buf => this.context!.decodeAudioData(buf)),
            ]);

            this.vocalBuffer = vocalBuffer;
            this.instrumentalBuffer = instrumentalBuffer;
            this.currentSong = name;

            if (this.autoplay) {
                this.play();
            }

            return true;
        } catch (e) {
            console.error("Failed to load audio:", e);
            return false;
        }
    }

    // Play the vocal and instrumental audio at the same time
    public play(): void {
        this.stop();

        if (!this.context || !this.vocalBuffer || !this.instrumentalBuffer || !this.gainNode) {
            console.error("Audio state before play; null found:", {
                context: this.context,
                vocalBuffer: this.vocalBuffer,
                instrumentalBuffer: this.instrumentalBuffer,
                gainNode: this.gainNode,
                vocalAnalyser: this.vocalAnalyser,
                instrumentalAnalyser: this.instrumentalAnalyser
            });
            return;
        }

        try {
            // Create sources
            this.vocalSource = this.context.createBufferSource();
            this.instrumentalSource = this.context.createBufferSource();
            this.vocalSource.buffer = this.vocalBuffer;
            this.instrumentalSource.buffer = this.instrumentalBuffer;

            // Create analysers
            this.vocalAnalyser = this.context.createAnalyser();
            this.instrumentalAnalyser = this.context.createAnalyser();
            this.vocalAnalyser.fftSize = 32768;
            this.instrumentalAnalyser.fftSize = 32768;
            this.vocalAnalyser.smoothingTimeConstant = 0.8;
            this.instrumentalAnalyser.smoothingTimeConstant = 0.8;

            const vocalBufferLength = this.vocalAnalyser.frequencyBinCount;
            this.vocalData = new Float32Array(vocalBufferLength);

            const instrumentalBufferLength = this.instrumentalAnalyser.frequencyBinCount;
            this.instrumentalData = new Float32Array(instrumentalBufferLength);

            // Connect nodes
            this.vocalSource.connect(this.vocalAnalyser);
            this.instrumentalSource.connect(this.instrumentalAnalyser);
            this.vocalAnalyser.connect(this.gainNode);
            this.instrumentalAnalyser.connect(this.gainNode);
            this.gainNode.connect(this.context.destination);

            // Start playback
            this.vocalSource.start(0);
            this.instrumentalSource.start(0);

            this.playing = true;

            this.vocalSource.onended = () => {
                this.playing = false;
            };
        } catch (e) {
            console.error("Playback failed:", e);
        }
    }

    // Stops the audio
    public stop(): void {
        if (this.vocalSource) {
            this.vocalSource.stop();
            this.vocalSource.disconnect();
            this.vocalSource = null;
        }

        if (this.instrumentalSource) {
            this.instrumentalSource.stop();
            this.instrumentalSource.disconnect();
            this.instrumentalSource = null;
        }

        this.playing = false;
    }

    // Toggle the audio
    public toggle(): void {
        this.playing ? this.stop() : this.play();
    }

    // Mute the audio
    public mute(): void {
        if (!this.gainNode) return;
        this.gainNode.gain.value = this.muted ? 0.5 : 0.0;
        this.muted = !this.muted;
    }

    /**
     * Set the volume of the audio
     * 
     * @param value The value to set the volume to.
     */
    public setVolume(value: number): void {
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }

    /**
     * Acquire the vocal audio's frequency data
     * 
     * @returns The frequency data
     */
    public getVocalData(): Float32Array {
        if (!this.vocalAnalyser || !this.vocalData) {
            return new Float32Array(); // Return empty but safe
        }

        this.vocalAnalyser.getFloatFrequencyData(this.vocalData);
        return this.vocalData;
    }

    /**
     * Acquire the instrumental audio's frequency data
     * 
     * @returns The frequency data
     */
    public getInstrumentalData(): Float32Array {
        if (!this.instrumentalAnalyser || !this.instrumentalData) {
            return new Float32Array(); // Return empty but safe
        }

        this.instrumentalAnalyser.getFloatFrequencyData(this.instrumentalData);
        return this.instrumentalData;
    }

    /**
     * Acquire merged audio frequency data (vocal + instrumental).
     * 
     * @returns The merged frequency data.
     */
    public getAudioData(): Float32Array {
        if (!this.vocalData || !this.instrumentalData) {
            return new Float32Array(); // Return empty but safe
        }

        const vocalReady = this.vocalAnalyser && this.vocalData;
        const instrReady = this.instrumentalAnalyser && this.instrumentalData;

        if (vocalReady) this.vocalAnalyser!.getFloatFrequencyData(this.vocalData);
        if (instrReady) this.instrumentalAnalyser!.getFloatFrequencyData(this.instrumentalData);

        // If both voca and instrumental are available then merge
        if (vocalReady && instrReady) {
            const len = Math.min(this.vocalData.length, this.instrumentalData.length);
            const merged = new Float32Array(len);

            // Taking the max of the two
            for (let i = 0; i < len; i++) {
                merged[i] = Math.max(this.vocalData[i], this.instrumentalData[i]);
            }

            return merged;
        }

        // If only one is available then return that
        if (vocalReady) return this.vocalData;
        if (instrReady) return this.instrumentalData;

        return new Float32Array(); // safe fallback
    }

    // TODO: Add more methods for other features later
}

export const audioManager = new AudioManager();