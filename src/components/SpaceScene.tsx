// Package imports
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Three.js function imports
import WEBGL from 'three/examples/jsm/capabilities/WebGL';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Custom function imports
import { setUpBackground, createStars } from '../util/Background';
import { audioManager } from '../util/AudioManager';

import { createRingPlanet, animateOneRingAudio, animateTwoRingAudio } from '../util/RingPlanet';

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
        // controls.minDistance = 20;
        // controls.maxDistance = 100;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const saturn = createRingPlanet({
            planetTexture: 'models/Planet.png',
            radius: 20,
            width: 128,
            height: 128,

            numSegments: 512,
            segmentDepth: 12,
            segmentHeight: 0.5,

            innerRingInnerRadius: 30,
            innerRingOuterRadius: 40,

            outerRingInnerRadius: 48,
            outerRingOuterRadius: 64,

            innerRingTilt: new THREE.Vector3(0, 0, 3),
            outerRingTilt: new THREE.Vector3(0, 0, 6),

            ringMaterial: new THREE.MeshStandardMaterial({
                color: 0x0000ff,
                transparent: true,
                opacity: 0.8
            }),

            position: new THREE.Vector3(-60, 0, 0)
        });

        scene.add(saturn.group);

        const saturnSmall = createRingPlanet({
            planetTexture: 'models/saturn.JPEG',
            radius: 20,
            width: 128,
            height: 128,

            numSegments: 512,
            segmentDepth: 12,
            segmentHeight: 0.5,

            innerRingInnerRadius: 30,
            innerRingOuterRadius: 40,

            innerRingTilt: new THREE.Vector3(0, 0, 3),

            ringMaterial: new THREE.MeshStandardMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.8
            }),

            position: new THREE.Vector3(60, -20, 0)
        });

        scene.add(saturnSmall.group);

        const sunGeometry = new THREE.SphereGeometry(40, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(70, 50, 400);

        scene.add(sun);

        // Animation Loop that operates celestial object's movement, 
        // camera, and audio visualization on the ring
        const animate = () => {
            // Camera and renderer updates
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);

            scene.traverse(obj => {
                if (obj.name === 'atmosphereGlow' && obj instanceof THREE.Mesh && obj.material instanceof THREE.ShaderMaterial) {
                    const mat = obj.material;
                    const light = scene.getObjectByName('SunLight') as THREE.Light;

                    if (light && mat.uniforms.lightSourcePos) {
                        mat.uniforms.lightSourcePos.value.copy(light.position);
                    }

                    if (mat.uniforms.camPos) {
                        mat.uniforms.camPos.value.copy(camera.position);
                    }
                }
            });

            // Saturn object rotations
            saturn.ringParent.rotation.y += 0.005;
            if (saturn.outerRingParent) {
                saturn.outerRingParent.rotation.y += 0.0025;
            }

            // Saturn Small object rotations
            saturnSmall.ringParent.rotation.y += 0.005;
            if (saturnSmall.outerRingParent) {
                saturnSmall.outerRingParent.rotation.y += 0.0025;
            }

            // Saturn ring audio visualization
            if (audioManager.vocalAnalyser && audioManager.instrumentalAnalyser && audioManager.playing) {
                animateTwoRingAudio(
                    saturn.ringSegmentsArray,
                    saturn.outerRingSegmentsArray!,
                    audioManager.getVocalData(),
                    audioManager.getInstrumentalData(),
                    {
                        innerWaveAmplitude: 0.5,
                        innerWaveFrequency: 8,
                        outerWaveAmplitude: 0.4,
                        outerWaveFrequency: 6
                    }
                );
            }

            // Saturn Small ring audio visualization
            if (audioManager.vocalAnalyser && audioManager.instrumentalAnalyser && audioManager.playing) {
                animateOneRingAudio(
                    saturnSmall.ringSegmentsArray,
                    audioManager.getAudioData(),
                    {
                        innerWaveAmplitude: 0.5,
                        innerWaveFrequency: 8,
                        gradientColors: [
                            new THREE.Color(0xffff00), // yellow
                            new THREE.Color(0xffa500), // orange
                            new THREE.Color(0xff0000)  // red
                        ]
                    }
                )
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

        const playlist = [
            {
                name: "song1",
                vocal: "/audios/song1/song1_Vocal.m4a",
                instrumental: "/audios/song1/song1_Instrumental.m4a"
            },
            {
                name: "song2",
                vocal: "/audios/song2/song2_Vocal.m4a",
                instrumental: "/audios/song2/song2_Instrumental.m4a"
            },
            {
                name: "song3",
                vocal: "/audios/song3/song3_Vocal.m4a",
                instrumental: "/audios/song3/song3_Instrumental.m4a"
            }
        ];

        const setUpAudio = async () => {
            audioManager.registerPlaylist(playlist);

            await audioManager.playNext();
            audioManager.setVolume(0.1);

            // Play next when current ends
            audioManager.setOnEndedHandler(async () => {
                await audioManager.playNext();
            });
        };

        setUpAudio();

        return () => {
            audioManager.stop();
        };
    }, []);

    return <canvas id="bg" ref={mountRef} />;
}
