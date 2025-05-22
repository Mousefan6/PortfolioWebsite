// Package imports
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Three.js function imports
import WEBGL from 'three/examples/jsm/capabilities/WebGL';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Custom function imports
import { setUpBackground, createStars } from '../util/Background';
import { audioManager } from '../util/AudioManager';

import { createAtmosphereMaterial, createAtmosphereGlow } from '../util/AtmosphericGlow';

export default function SaturnScene() {
    const mountRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!WEBGL.isWebGL2Available()) {
            document.body.innerHTML = '<div style="color:white;background:red;padding:20px;font-family:sans-serif">' +
                '<h1>WebGL Not Supported</h1>' +
                '<p>Your browser or device does not support WebGL.</p>' +
                '</div>';
            return;
        }

        // Scene Setup
        const scene = new THREE.Scene();
        setUpBackground(scene);

        // Instantiate 450 star objects into the scene
        Array(450).fill(null).forEach(() => createStars(scene));

        // Camera Setup
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.setZ(30);

        // Renderer Setup
        const renderer = new THREE.WebGLRenderer({
            canvas: mountRef.current!,
            antialias: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Camera Orbit controls (panning, zooming, and rotation)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 20;
        controls.maxDistance = 100;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Instantiate Saturn object
        const planetTexture = new THREE.TextureLoader().load('models/saturn.JPEG');
        const planet = new THREE.Mesh(
            new THREE.SphereGeometry(20, 128, 128),
            new THREE.MeshStandardMaterial({ map: planetTexture })
        );
        scene.add(planet);

        // Instantiate Saturn Rings object
        const ringSegments = 512;
        const innerRadius = 30;
        const outerRadius = 40;
        const ringParent = new THREE.Object3D();
        scene.add(ringParent);

        const ringSegmentsArray: THREE.Mesh[] = [];

        const segmentCount = ringSegments;
        const segmentAngle = (Math.PI * 2) / segmentCount;
        const segmentDepth = 12; // Length of segments
        const segmentWidth = (2 * Math.PI * ((innerRadius + outerRadius) / 2)) / segmentCount;
        const segmentHeight = 0.5; // Vertical thickness
        const segmentRadius = (innerRadius + outerRadius) / 2;

        for (let i = 0; i < segmentCount; i++) {
            const angle = i * segmentAngle;

            const geometry = new THREE.BoxGeometry(
                segmentDepth,   // width (radial direction; outwards from center)
                segmentHeight,  // height (upward Y)
                segmentWidth    // depth (along the arc)
            );

            const material = new THREE.MeshStandardMaterial({
                color: 0xffbb88,
                transparent: true,
                opacity: 0.8
            });

            const segment = new THREE.Mesh(geometry, material);

            // Position around ring
            segment.position.set(
                Math.cos(angle) * segmentRadius,
                0,
                Math.sin(angle) * segmentRadius
            );

            segment.userData.originalY = segment.position.y;

            // Rotate so it faces outward from the center
            segment.lookAt(0, 0, 0);
            segment.rotateY(Math.PI / 2); // orient long side along the arc

            ringParent.add(segment);
            ringSegmentsArray.push(segment);
        }

        // Atmospheric glow
        const atmosphereMaterial = createAtmosphereMaterial();
        const atmosphere = createAtmosphereGlow(20.3, ringSegments, ringSegments, atmosphereMaterial)
        scene.add(atmosphere);

        // Animation Loop that operates celestial object's movement, 
        // camera, and audio visualization on the ring
        const animate = () => {
            requestAnimationFrame(animate);
            // ringParent.rotation.y += 0.005;
            controls.update();
            renderer.render(scene, camera);

            if (audioManager.analyser && audioManager.playing) {
                const freqData = audioManager.getFrequencyData();

                for (let i = 0; i < ringSegments; i++) {
                    const segment = ringSegmentsArray[i];

                    const freqIndex = i % freqData.length;
                    const raw = freqData[freqIndex] ?? -70;
                    let intensity = Math.max(0, (raw + 70) / 70);

                    // Boost intensity on second half of the ring
                    if (i >= ringSegments / 2) {
                        intensity *= 1.6;
                        intensity = Math.min(intensity, 1.0);
                    }

                    // Add sine modulation to create wavy pattern
                    const waveAmplitude = 0.5;
                    const waveFrequency = 8;
                    const wave = Math.sin((i / ringSegments) * Math.PI * 2 * waveFrequency + performance.now() * 0.003);

                    const waveFactor = 1.0 + waveAmplitude * wave;

                    const scaleY = (1.0 + intensity * 5.5) * waveFactor;
                    const scaleX = 1.0 + intensity * 1.1;
                    const scaleZ = 1.0 + intensity * 4;

                    segment.scale.set(scaleX, scaleY, scaleZ);
                    segment.position.y = (scaleY - 1) * 0.5;

                    const hue = (1.0 - intensity) * 0.9;
                    const lightness = 0.4 + intensity * 0.7;
                    const color = new THREE.Color().setHSL(hue, 1.0, lightness);

                    const mat = segment.material as THREE.MeshStandardMaterial;
                    mat.color = color;
                    mat.emissive = color;
                    mat.emissiveIntensity = 0.2 + intensity * 1.5;
                }

            }
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup resources on unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            scene.clear();
        };
    }, []);

    useEffect(() => {
        audioManager.initializeAudio();

        const setUpAudio = async () => {
            // audioManager.registerAudio("song1", "/audios/song.m4a");
            audioManager.registerAudio("song1", "/audios/song4.mp3");
            await audioManager.loadAudio("song1");
            audioManager.setVolume(0.1);
        };

        setUpAudio();

        const unlockAudioContext = async () => {
            if (audioManager.context?.state === "suspended") {
                await audioManager.context.resume();
            }

            if (!audioManager.playing) {
                audioManager.play();
            }

            window.removeEventListener('click', unlockAudioContext);
        };

        // Register a one-time click handler to unlock audio
        window.addEventListener('click', unlockAudioContext);

        return () => {
            window.removeEventListener('click', unlockAudioContext);
            audioManager.stop();
        };
    }, []);

    return <canvas id="bg" ref={mountRef} />;
}
