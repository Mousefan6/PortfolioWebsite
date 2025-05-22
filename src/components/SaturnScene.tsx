// Package imports
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Three.js function imports
import WEBGL from 'three/examples/jsm/capabilities/WebGL';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Custom function imports
import { setUpBackground, createStars } from '../util/Background';


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
        scene.background = new THREE.Color(0x000000);
        
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
        
        const controls = new OrbitControls(camera, renderer.domElement);

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
            segment.rotation.x = Math.PI / 2;

            segment.userData = {
                baseScale: 1.0,
                baseColor: ringMaterial.color.clone()
            };

            ringParent.add(segment);
        }

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            planet.rotation.y += 0.002;
            ringParent.rotation.y += 0.005;
            controls.update();
            renderer.render(scene, camera);
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

    return <canvas id="bg" ref={mountRef} />;
}
