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

        // Instantiate 200 star objects into the scene
        Array(200).fill(null).forEach(() => createStars(scene));

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
            new THREE.SphereGeometry(3, 128, 128),
            new THREE.MeshStandardMaterial({ map: planetTexture })
        );
        scene.add(planet);

        // Instantiate Saturn Rings object
        const ringSegments = 128;
        const innerRadius = 5;
        const outerRadius = 8;
        const ringParent = new THREE.Object3D();
        scene.add(ringParent);

        const ringSegmentsArray: THREE.Mesh[] = [];

        for (let i = 0; i < ringSegments; i++) {
            const angle = (i / ringSegments) * Math.PI * 2;

            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0xffbb88,
                side: THREE.DoubleSide,
                opacity: 0.8,
                transparent: true,
                emissive: 0xffbb88,
                emissiveIntensity: 0.1
            });

            const segmentGeometry = new THREE.RingGeometry(
                innerRadius,
                outerRadius,
                32,
                1,
                angle - 0.01,
                (Math.PI * 2 / ringSegments) + 0.01
            );

            const segment = new THREE.Mesh(segmentGeometry, ringMaterial);
            segment.geometry.computeBoundingBox();
            segment.geometry.userData.originalPositions = segment.geometry.attributes.position.array.slice();
            segment.rotation.x = Math.PI / 2;

            segment.userData = {
                baseScale: 1.0,
                baseColor: ringMaterial.color.clone()
            };

            ringParent.add(segment);
            ringSegmentsArray.push(segment);
        }

        // Atmospheric glow
        const atmosphereMaterial = createAtmosphereMaterial();
        const atmosphere = createAtmosphereGlow(3.1, ringSegments, ringSegments, atmosphereMaterial)
        scene.add(atmosphere);

        // Animation Loop that operates celestial object's movement, camera, and audio frequency data.
        const animate = () => {
            requestAnimationFrame(animate);
            ringParent.rotation.y += 0.005;
            controls.update();
            renderer.render(scene, camera);

            // Audio visualizer logic
            if (audioManager.analyser && audioManager.playing) {
                const freqData = audioManager.getFrequencyData();

                const quarters = 4;
                const quarterSize = ringSegments / quarters;
                const freqBandSize = 256 / quarterSize; // if using 256 frequency bins

                for (let q = 0; q < quarters; q++) {
                    for (let i = 0; i < quarterSize; i++) {
                        const globalIndex = q * quarterSize + i;
                        const mirrorIndex = q * quarterSize + (quarterSize - 1 - i);

                        const segmentA = ringSegmentsArray[globalIndex];
                        const segmentB = ringSegmentsArray[mirrorIndex];

                        const geometryA = segmentA.geometry as THREE.RingGeometry;
                        const geometryB = segmentB.geometry as THREE.RingGeometry;

                        const basePositionsA = geometryA.userData.originalPositions as Float32Array;
                        const basePositionsB = geometryB.userData.originalPositions as Float32Array;

                        const posA = geometryA.attributes.position as THREE.BufferAttribute;
                        const posB = geometryB.attributes.position as THREE.BufferAttribute;

                        // Calculate average intensity from frequency band
                        const bandStart = i * freqBandSize;
                        let avg = 0;
                        for (let j = bandStart; j < bandStart + freqBandSize; j++) {
                            avg += freqData[Math.floor(j)] ?? -140;
                        }
                        avg /= freqBandSize;

                        const normalized = Math.max(0, (avg + 105) / 105);
                        const intensity = Math.pow(normalized, 1.5);
                        const stretchFactor = 0.5 + intensity * 0.95;

                        const deformSegment = (pos: THREE.BufferAttribute, base: Float32Array) => {
                            for (let k = 0; k < pos.count; k++) {
                                const ix = k * 3;
                                const x = base[ix];
                                const y = base[ix + 1];
                                const z = base[ix + 2];

                                const radius = Math.sqrt(x * x + y * y);
                                const angle = Math.atan2(y, x);

                                const isOuter = radius > (innerRadius + (outerRadius - innerRadius) / 2);
                                const finalRadius = isOuter ? radius * stretchFactor : radius;

                                pos.array[ix] = Math.cos(angle) * finalRadius;
                                pos.array[ix + 1] = Math.sin(angle) * finalRadius;
                                pos.array[ix + 2] = z;
                            }
                            pos.needsUpdate = true;
                        };

                        deformSegment(posA, basePositionsA);
                        deformSegment(posB, basePositionsB);
                    }
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
            audioManager.registerAudio("song1", "/audios/song3.mp3");
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
