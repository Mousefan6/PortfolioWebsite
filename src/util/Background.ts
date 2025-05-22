/**************************************************************
* Author(s): Bryan Lee
* Last Updated: 5/21/2025
*
* File:: Background.js
*
* Description:: This file serves the functions necessary for creating
*               the background of the landing page scene.
*
**************************************************************/

import * as THREE from "three";

export function setUpBackground(scene: THREE.Scene): void {
    // Configure the scene's lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    scene.add(hemisphereLight);

    // Load the Background texture
    const spaceTexture = new THREE.TextureLoader().load('models/stars.JPEG');
    scene.background = spaceTexture;
}

export function createStars(scene: THREE.Scene): void {
    const geometry = new THREE.SphereGeometry(0.15, 24, 24);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const star = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3)
        .fill(0)
        .map(() => THREE.MathUtils.randFloatSpread(100));

    star.position.set(x, y, z);
    scene.add(star);
}