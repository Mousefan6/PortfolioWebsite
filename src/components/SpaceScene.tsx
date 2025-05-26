// Package imports
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from "gsap";

// Three.js function imports
import WEBGL from 'three/examples/jsm/capabilities/WebGL';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Custom function imports
import { setUpBackground, createStars } from '../util/Background';
import { useAudioPlayer } from '../hooks/AudioProvider';

import { createRingPlanet, animateOneRingAudio, animateTwoRingAudio } from '../util/RingPlanet';

export default function SaturnScene() {
    const mountRef = useRef<HTMLCanvasElement>(null);

    const { audioManager } = useAudioPlayer();

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
            name: "Saturn",
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

            hasAtmosphericGlow: true,
            glowColor: new THREE.Color(0x6644ff),
            glowIntensity: 1.2,

            position: new THREE.Vector3(-60, 0, 0)
        });

        scene.add(saturn.group);

        const moon = createRingPlanet({
            name: "Moon",
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

            hasAtmosphericGlow: true,
            glowColor: new THREE.Color(0xff6600),
            glowIntensity: 1.2,

            position: new THREE.Vector3(60, -20, 0)
        });

        scene.add(moon.group);

        const moon2 = createRingPlanet({
            name: "Moon2",
            planetTexture: 'models/AsteroidTexture.JPEG',
            radius: 10,
            width: 64,
            height: 64,

            numSegments: 512,
            segmentDepth: 12,
            segmentHeight: 0.5,

            innerRingInnerRadius: 30,
            innerRingOuterRadius: 40,

            innerRingTilt: new THREE.Vector3(5, 0, 0),

            ringMaterial: new THREE.MeshStandardMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.8
            }),

            hasAtmosphericGlow: true,
            glowColor: new THREE.Color(0xff6600),
            glowIntensity: 1.2,

            position: new THREE.Vector3(-60, -20, 180)
        });

        scene.add(moon2.group);

        const sunGeometry = new THREE.SphereGeometry(40, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(70, 50, 400);
        sun.name = "Sun";

        scene.add(sun);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const clickableObjects = [saturn.planet, moon.planet, moon2.planet, sun];

        const onClick = (event: MouseEvent) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(clickableObjects, true);

            if (intersects.length > 0) {
                const targetObject = intersects[0].object;

                const targetWorldPos = new THREE.Vector3();
                targetObject.getWorldPosition(targetWorldPos);

                const targetMesh = targetObject as THREE.Mesh;
                const geometry = targetMesh.geometry as THREE.SphereGeometry;

                const radius = geometry.parameters.radius;

                const targetPos = new THREE.Vector3(
                    targetWorldPos.x + radius / 4,
                    targetWorldPos.y + radius + 1,
                    targetWorldPos.z
                );

                // controls.enabled = false;

                gsap.to(camera.position, {
                    x: targetPos.x,
                    y: targetPos.y,
                    z: targetPos.z,
                    duration: 2,
                    ease: "power2.inOut",

                    onComplete: () => {
                        switch (targetObject.name) {
                            case 'Sun':
                                controls.target.copy(saturn.planet.position);
                                camera.lookAt(saturn.planet.position);
                                break;
                            case 'Moon':
                                controls.target.copy(saturn.planet.position);
                                camera.lookAt(saturn.planet.position);
                                break;
                            case 'Moon2':
                                controls.target.copy(saturn.planet.position);
                                camera.lookAt(saturn.planet.position);
                                break;
                            default:
                                break;
                        }
                    }
                });

            }

        };


        window.addEventListener("click", onClick);

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

            // Moon object rotations
            moon.ringParent.rotation.y += 0.005;

            // Moon2 object rotations
            moon2.ringParent.rotation.y += 0.005;

            if (audioManager.vocalAnalyser && audioManager.instrumentalAnalyser && audioManager.playing) {
                // Saturn ring audio visualization
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
                
                // Moon ring audio visualization
                animateOneRingAudio(
                    moon.ringSegmentsArray,
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

                // Moon ring audio visualization
                animateOneRingAudio(
                    moon2.ringSegmentsArray,
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
            window.removeEventListener("click", onClick);
            renderer.dispose();
            scene.clear();
        };
    }, []);

    return <canvas id="bg" ref={mountRef} />;
}
