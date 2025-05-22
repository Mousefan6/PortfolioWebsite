export class AudioManager {
    context: AudioContext | null;
    source: AudioBufferSourceNode | null;
    analyser: AnalyserNode | null;
    frequencyData: Float32Array | null;
    gainNode: GainNode | null;
    initialized: boolean;
    playing: boolean;
    muted: boolean;
    currentSong: string | null;
    songList: string[];
    buffer: AudioBuffer | null;
    autoplay: boolean;
    defaultSong: string;
    importedSounds: Map<string, string>;

    constructor() {
        this.context = null;
        this.source = null;
        this.analyser = null;
        this.frequencyData = null;
        this.gainNode = null;
        this.initialized = false;
        this.playing = false;
        this.muted = false;
        this.currentSong = null;
        this.songList = [];
        this.buffer = null;
        this.autoplay = false;
        this.defaultSong = 'audios/song.m4a';
        this.importedSounds = new Map<string, string>();
    }

    /**
     * Initialize the audio manager with an audio context, analyser, and gain node
     * 
     * @returns True if audio is initialized, false otherwise
     */
    public initializeAudio(): boolean {
        try {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

            this.analyser = this.context.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            const bufferLength = this.analyser.frequencyBinCount;
            this.frequencyData = new Float32Array(bufferLength);

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
     * @param fileUrl The file URL of the audio file.
     */
    public registerAudio(name: string, fileUrl: string): void {
        this.importedSounds.set(name, fileUrl);
    }

    /**
     * Registers multiple audio files
     * 
     * @param audios An array of tuples containing the name and URL of each audio file.
     */
    public registerAudios(audios: [string, string][]): void {
        audios.forEach(([name, url]) => {
            this.registerAudio(name, url);
        });
    }


    /**
     * Loads a audio file for playing
     * 
     * @param name The registered audio's name.
     * @returns The promise of loading the audio.
     */
    public async loadAudio(name: string): Promise<boolean> {
        if (!this.initialized && !this.initializeAudio()) {
            return false;
        }

        try {
            const url = this.importedSounds.get(name);
            if (!url) {
                throw new Error(`Sound "${name}" not found.`);
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);

            this.buffer = audioBuffer;
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

    // Play the audio
    public play(): void {
        if (this.playing) {
            this.stop();
        }

        if (!this.context || !this.buffer || !this.analyser || !this.gainNode) {
            console.error("Audio state before play; null found:", {
                context: this.context,
                buffer: this.buffer,
                analyser: this.analyser,
                gainNode: this.gainNode
            });
            return;
        }

        try {
            this.source = this.context.createBufferSource();
            this.source.buffer = this.buffer;

            this.source.connect(this.analyser);
            this.analyser.connect(this.gainNode);
            this.gainNode.connect(this.context.destination);

            this.source.start(0);
            this.playing = true;

            this.source.onended = () => {
                this.playing = false;
            };
        } catch (e) {
            console.error("Playback failed:", e);
        }
    }

    // Stops the audio
    public stop(): void {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
            this.source = null;
        }

        this.playing = false;
    }

    // Toggle the audio
    public toggle(): void {
        if (this.playing) {
            this.stop();
        } else {
            this.play();
        }
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
     * Acquire the audio's frequency data
     * 
     * @returns The frequency data
     */
    public getFrequencyData() {
        if (this.analyser && this.frequencyData) {
            return this.analyser.getFloatFrequencyData(this.frequencyData);
        }
        return [];
    }

    // TODO: Add more methods for other features later
}

export const audioManager = new AudioManager();