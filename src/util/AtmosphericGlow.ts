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
        varying float intensity;
        uniform vec3 lightSourcePos;
        uniform vec3 camPos;
        void main() {
            vec3 vNormal = normalize( normalMatrix * normal );
            vec4 viewLightPos = modelViewMatrix * vec4(lightSourcePos, 1.0);
            vec4 viewCamPos = viewMatrix * vec4(camPos, 1.0);
            vec4 vViewPosition4 = modelViewMatrix * vec4(position, 1.0);
            vec3 camPosToVertexDir = normalize(viewCamPos.xyz - vViewPosition4.xyz);
            vec3 lightDir = normalize(viewLightPos.xyz - vViewPosition4.xyz);
            float lightsourceIntensity = clamp(dot(lightDir, vNormal) + 1.0, 0.0, 1.0);
            intensity = pow( 0.7 - dot(vNormal, camPosToVertexDir), 12.0 ) * lightsourceIntensity;
            gl_Position = projectionMatrix * vViewPosition4;
            vec3 vPosition = gl_Position.xyz;
        }
    `;

    const fragmentShader = `
        varying float intensity;
        void main() {
            vec3 glow = vec3(0.3, 0.6, 1.0) * intensity * 0.3;
            gl_FragColor = vec4( glow, 1.0 );
        }
    `;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            lightSourcePos: { value: new THREE.Vector3() },
            camPos: { value: new THREE.Vector3() }
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

export function createAtmosphereGlow(radius: number, width: number, height: number, material: THREE.ShaderMaterial) {
    const geometry = new THREE.SphereGeometry(radius, width, height);
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}