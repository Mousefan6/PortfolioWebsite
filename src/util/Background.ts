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
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
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
        emissive: 0xffffff
    });
    const star = new THREE.Mesh(geometry, material);

    star.position.set(x, y, z);
    scene.add(star);
}