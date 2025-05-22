/**************************************************************
* Author(s): Jaden Lee
* Last Updated: 5/21/2025
*
* File:: AtmosphericGlow.ts
*
* Description:: This file serves the functions necessary for creating
*               the atmospheric glow of the planet for visual effects.
* 
* To clean up: Use GLSL files for vertexShader and fragmentShader
*
**************************************************************/

import * as THREE from "three";

export function createAtmosphereMaterial() {
    const vertexShader = `
        varying vec3 vertexWorldPosition;
        varying vec3 vertexNormal;
        
        void main() {
            vertexWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            vertexNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform vec3 glowColor;
        uniform float coefficient;
        uniform float power;
        uniform float intensity;
        varying vec3 vertexWorldPosition;
        varying vec3 vertexNormal;
        
        void main() {
            vec3 worldCameraPosition = cameraPosition;
            vec3 viewDirection = normalize(vertexWorldPosition - worldCameraPosition);
            
            // Use the actual surface normal for better glow effect
            float fresnel = coefficient + dot(vertexNormal, viewDirection);
            fresnel = pow(abs(fresnel), power);
            
            // Make the glow more pronounced and controllable
            float glowIntensity = fresnel * intensity;
            
            gl_FragColor = vec4(glowColor, glowIntensity);
        }
    `;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0xffbb88) },
            coefficient: { value: 0.1 },
            power: { value: 3.0 },
            intensity: { value: 0.8 }
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });

    return material;
}

export function createAtmosphereGlow(radius: number, segments: number, rings: number, material: THREE.ShaderMaterial) {
    const geometry = new THREE.SphereGeometry(radius, segments, rings);
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}