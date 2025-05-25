/**************************************************************
* Author(s): Jaden Lee, Bryan Lee
* Last Updated: 5/21/2025
*
* File:: Background.ts
*
* Description:: This file serves the functions necessary for creating
*               the background of the landing page scene.
*
**************************************************************/

import * as THREE from "three";

export function setUpBackground(scene: THREE.Scene): void {
    // Black background
    scene.background = new THREE.Color(0x000000);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Point light to similar a sun
    const pointLight = new THREE.PointLight(0xffffff, 3, 2000);
    pointLight.position.set(70, 50, 400);
    pointLight.name = "SunLight"; // Required for shader update

    // Shadows for shaders
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    
    scene.add(pointLight);

    // Additional directional light for better overall illumination
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(70, 50, 400);
    directionalLight.target.position.set(0, 0, 0);

    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // Secondary point light for rim lighting effect on atmosphere
    const rimLight = new THREE.PointLight(0x4444ff, 2, 500);
    rimLight.position.set(-100, -50, 50);
    scene.add(rimLight);
}

export function createStars(scene: THREE.Scene, minDistance = 24, spread = 400) {
    let x, y, z;
    let distance = 0;

    // Ensure stars do not spawn too close to Saturn
    do {
        [x, y, z] = Array(3).fill(0).map(() => THREE.MathUtils.randFloatSpread(spread));
        distance = Math.sqrt(x * x + y * y + z * z);
    } while (distance < minDistance);

    const starSize = Math.random() * 0.2;
    const geometry = new THREE.SphereGeometry(starSize, 24, 24);
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.8
    });
    const star = new THREE.Mesh(geometry, material);

    star.position.set(x, y, z);
    scene.add(star);
}