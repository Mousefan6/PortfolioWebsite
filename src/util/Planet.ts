/**************************************************************
* Author(s): Jaden Lee, Bryan Lee
* Last Updated: 5/23/2025
*
* File:: Planet.ts
*
* Description:: This file handles the dynamic creation of a ring planet object.
*
**************************************************************/

import * as THREE from 'three';

// import { createAtmosphereMaterial, createAtmosphereGlow } from '../util/AtmosphericGlow';

interface PlanetOptions {
    planetTexture: string;
    radius: number;
    width: number;
    height: number;

    hasAtmosphericGlow: boolean;
    // isSun?: boolean;
    // emissiveIntensity?: number;

    position: THREE.Vector3;
}

export function createPlanet(options: PlanetOptions): {
    group: THREE.Object3D;
    planet: THREE.Mesh;
} {
    const {
        planetTexture,
        radius,
        width,
        height,
        // hasAtmosphericGlow,
        // isSun = false,
        // emissiveIntensity = 1.0,
        position
    } = options;

    const group = new THREE.Object3D();
    group.position.copy(position);

    // Instantiate Planet object
    const texture = new THREE.TextureLoader().load(planetTexture);

    // Creating a new planet
    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(radius, width, height),
        new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,  // Affects how light scatters
            metalness: 0.1   // Affects reflectivity
        })
    );
    group.add(planet);

    // Optional glow
    // if (hasAtmosphericGlow) {
    //     const atmosphereMaterial = createAtmosphereMaterial();
    //     const atmosphere = createAtmosphereGlow(
    //         radius + 0.3,
    //         radius,
    //         radius,
    //         atmosphereMaterial
    //     );
    //     atmosphere.name = "atmosphereGlow";
    //     group.add(atmosphere);

    //     // Store it for later reference
    //     group.userData.atmosphereGlow = atmosphere;
    // }

    // // Optional glow for sun
    // if (isSun) {
    //     // Create an additional outer glow
    //     const glowGeometry = new THREE.SphereGeometry(radius * 1.1, 32, 32);
    //     const glowMaterial = new THREE.MeshBasicMaterial({
    //         color: 0xffaa00,
    //         transparent: true,
    //         opacity: 0.5,
    //         side: THREE.BackSide // Render from inside
    //     });
    //     const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    //     group.add(glow);

    //     // Add corona effect
    //     const coronaGeometry = new THREE.SphereGeometry(radius * 1.2, 32, 32);
    //     const coronaMaterial = new THREE.MeshBasicMaterial({
    //         color: 0xffdd44,
    //         transparent: true,
    //         opacity: 0.3,
    //         side: THREE.BackSide
    //     });
    //     const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    //     group.add(corona);
    // }

    return {
        planet,
        group
    };
}