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
    public paused: boolean;
    private startTime: number = 0;
    private offset: number = 0;

    // Audio settings
    public currentSong: string | null;
    public autoplay: boolean;
    public volume: number;

    private importedSounds: Map<string, [string, string]>;
    private onEndedListeners: (() => void | Promise<void>)[] = [];

    // Ring queue audio player variables
    private queue: { name: string, vocal: string, instrumental: string }[] = [];
    private currentIndex: number = -1; // -1 for initial state
    private onEndedHandler: (() => void) | null = null;

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
        this.paused = false;

        // Audio settings
        this.currentSong = null;
        this.autoplay = false;
        this.volume = 0.1;

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
    private play(): void {
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
            this.startTime = this.context.currentTime;
            this.vocalSource.start(0, this.offset);
            this.instrumentalSource.start(0, this.offset);

            this.playing = true;

            this.vocalSource.onended = () => {
                this.playing = false;
                this.triggerEnded();
            };
        } catch (e) {
            console.error("Playback failed:", e);
        }
    }

    /**
     * Play the audio at a specific time
     * 
     * @param seconds The number of seconds to seek.
     */
    public seek(seconds: number): void {
        this.offset = seconds;
        this.play(); // will use this.offset internally
    }

    // Stops and terminate the audio
    public stop(): void {
        if (this.vocalSource) {
            this.vocalSource.onended = null;
            this.vocalSource.stop(0);
            this.vocalSource.disconnect();
            this.vocalSource = null;
            this.vocalAnalyser = null;
            this.vocalData = null;
        }

        if (this.instrumentalSource) {
            this.instrumentalSource.stop(0);
            this.instrumentalSource.disconnect();
            this.instrumentalSource = null;
            this.instrumentalAnalyser = null;
            this.instrumentalData = null;
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
     * @param value The value to set the volume to. Range: [0, 1]
     */
    public setVolume(value: number): void {
        if (value < 0) value = 0;
        if (value > 1) value = 1;

        if (this.gainNode) {
            this.gainNode.gain.value = value;
            this.volume = value;
        }
    }

    // Get the current volume of the audio. Range: [0, 100]
    public getVolume(): number {
        if (this.gainNode) {
            return this.gainNode.gain.value * 100;
        }
        return 0;
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

        // If both vocal and instrumental are available then merge
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

    /**
     * Registers multiple audio files as a playlist
     * 
     * @param songs An array of tuples containing the name and tuple of files vocal
     *               and instrumental of each audio file.
     * 
     * Example:
     * const playlist = [
     *     {
     *         name: "song1",
     *         vocal: "/audios/song1/song1_Vocal.m4a",
     *         instrumental: "/audios/song1/song1_Instrumental.m4a"
     *     },
     *     {
     *         name: "song2",
     *         vocal: "/audios/song2/song2_Vocal.m4a",
     *         instrumental: "/audios/song2/song2_Instrumental.m4a"
     *     },
     *     {
     *         name: "song3",
     *         vocal: "/audios/song3/song3_Vocal.m4a",
     *          instrumental: "/audios/song3/song3_Instrumental.m4a"
     *     }
     * ];
     *
     */
    public registerPlaylist(songs: { name: string, vocal: string, instrumental: string }[]) {
        this.queue = songs;
        this.currentIndex = -1; // -1 for initial state (auto incremented by playNext)
    }

    // Play the next song in the playlist
    public async playNext() {
        if (this.queue.length === 0) {
            return;
        }

        this.stop();
        this.offset = 0;

        // Disconnect the on ended handler
        if (this.vocalSource) {
            this.vocalSource.onended = null;
        }

        // Increment to the next song index
        this.currentIndex = (this.currentIndex + 1) % this.queue.length;

        // Play the song at the current index
        const song = this.queue[this.currentIndex];
        this.registerAudio(song.name, song.vocal, song.instrumental);
        await this.loadAudio(song.name);
        this.play();

        // If context was paused, resume it
        if (this.context && this.context.state === "suspended") {
            await this.context.resume();
            this.paused = false;
        }

        if (this.vocalSource && this.onEndedHandler) {
            this.vocalSource.onended = this.onEndedHandler;
        }
    }

    // Play the previous song in the playlist
    public async playPrevious() {
        if (this.queue.length === 0) {
            return;
        }

        this.stop();
        this.offset = 0;

        // Disconnect the on ended handler
        if (this.vocalSource) {
            this.vocalSource.onended = null;
        }

        // Decrement to the previous song index
        this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;

        // Play the song at the new index
        const song = this.queue[this.currentIndex];
        this.registerAudio(song.name, song.vocal, song.instrumental);
        await this.loadAudio(song.name);
        this.play();

        // If context was paused, resume it
        if (this.context && this.context.state === "suspended") {
            await this.context.resume();
            this.paused = false;
        }

        if (this.vocalSource && this.onEndedHandler) {
            this.vocalSource.onended = this.onEndedHandler;
        }
    }

    // Set the on ended playlist handler to queue the playlist again
    public setOnEndedHandler(handler: () => void) {
        this.onEndedHandler = handler;
        if (this.vocalSource) {
            this.vocalSource.onended = handler;
        }
    }

    // Register a listener to be called when the playlist ends
    public addOnEndedListener(listener: () => void | Promise<void>) {
        this.onEndedListeners.push(listener);
    }

    // Remove a listener
    public removeOnEndedListener(listener: () => void | Promise<void>) {
        this.onEndedListeners = this.onEndedListeners.filter(fn => fn !== listener);
    }

    // Trigger all the on ended playlist handler
    private async triggerEnded() {
        for (const listener of this.onEndedListeners) {
            await listener();
        }
    }

    // Suspend the audio context
    public async pause() {
        if (this.context && this.context.state === "running") {
            await this.context.suspend();
            this.paused = true;
            this.playing = false;
        }
    }

    // Resume the audio context
    public async resume() {
        if (this.context && this.context.state === "suspended") {
            await this.context.resume();
            this.paused = false;
            this.playing = true;
        }
    }

    /**
     * Get the name of the current song
     * 
     * @returns The name of the current song
     */
    public getCurrentSong(): string | null {
        if (
            this.queue.length === 0 ||
            this.currentIndex < 0 ||
            this.currentIndex >= this.queue.length ||
            !this.queue[this.currentIndex]?.name
        ) {
            return null;
        }

        return this.queue[this.currentIndex].name;
    }


    /**
     * Get the duration of the current song
     * 
     * @returns The duration of the current song
     */
    public getDuration(): number {
        return typeof this.vocalBuffer?.duration === "number" ? this.vocalBuffer.duration : 0;
    }

    /**
     * Get the current time of where the audio is at
     * 
     * @returns The current time in seconds
     */
    public getCurrentTime(): number {
        if (!this.context) return 0;

        if (this.playing) {
            return this.context.currentTime - this.startTime + this.offset;
        } else {
            return this.offset; // paused or stopped, so offset holds the last known time
        }
    }
}

export const audioManager = new AudioManager();