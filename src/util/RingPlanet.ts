/**************************************************************
* Author(s): Jaden Lee, Bryan Lee
* Last Updated: 5/23/2025
*
* File:: RingPlanet.ts
*
* Description:: This file handles the dynamic creation of a ring planet object
*               and serves the ring audio visualizer animation function.
*
**************************************************************/

import * as THREE from 'three';

import { createAtmosphereMaterial, createAtmosphereGlow } from '../util/AtmosphericGlow';

interface RingPlanetOptions {
    planetTexture: string;
    radius: number;
    width: number;
    height: number;

    numSegments: number;
    segmentDepth: number;
    segmentHeight: number;

    innerRingInnerRadius: number;
    innerRingOuterRadius: number;

    outerRingInnerRadius?: number;
    outerRingOuterRadius?: number;

    // Tilt vectors will convert each element to radians
    innerRingTilt: THREE.Vector3;
    outerRingTilt?: THREE.Vector3 | null;

    ringMaterial: THREE.MeshStandardMaterial;

    hasAtmosphericGlow: boolean;

    position: THREE.Vector3;
}

export interface RingAnimationOptions {
    innerWaveAmplitude?: number;
    innerWaveFrequency?: number;
    outerWaveAmplitude?: number | null;
    outerWaveFrequency?: number | null;

    /**
     * Gradient color stops for intensity mapping: [low, mid, high]
     * Example: [yellow, orange, red]
     */
    gradientColors?: [THREE.Color, THREE.Color, THREE.Color];
}

export function createRingPlanet(options: RingPlanetOptions): {
    group: THREE.Object3D;
    planet: THREE.Mesh;
    ringParent: THREE.Object3D;
    ringSegmentsArray: THREE.Mesh[];
    outerRingParent?: THREE.Object3D;
    outerRingSegmentsArray?: THREE.Mesh[];
} {
    const {
        planetTexture,
        radius,
        width,
        height,
        numSegments,
        segmentDepth,
        segmentHeight,
        innerRingInnerRadius,
        innerRingOuterRadius,
        outerRingInnerRadius = null,
        outerRingOuterRadius = null,
        innerRingTilt,
        outerRingTilt = null,
        ringMaterial,
        hasAtmosphericGlow,
        position
    } = options;

    const group = new THREE.Object3D();
    group.position.copy(position);

    // Instantiate Planet object
    const texture = new THREE.TextureLoader().load(planetTexture);
    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(radius, width, height),
        new THREE.MeshStandardMaterial({ map: texture })
    );
    group.add(planet);

    // Instantiate Inner Ring objectts
    const ringParent = new THREE.Object3D();
    const ringSegmentsArray: THREE.Mesh[] = []; // For audio visualization
    const segmentAngle = (Math.PI * 2) / numSegments;
    const ringRadius = (innerRingInnerRadius + innerRingOuterRadius) / 2;
    const segmentWidth = (2 * Math.PI * ringRadius) / numSegments;

    for (let i = 0; i < numSegments; i++) {
        const angle = i * segmentAngle;

        const geometry = new THREE.BoxGeometry(
            segmentDepth,   // width (radial direction; outwards from center)
            segmentHeight,  // height (upward Y)
            segmentWidth    // depth (along the arc)
        );

        const material = ringMaterial?.clone() || new THREE.MeshStandardMaterial({ color: 0x0000ff, transparent: true, opacity: 0.8 });
        const segment = new THREE.Mesh(geometry, material);

        // Position around ring
        segment.position.set(
            Math.cos(angle) * ringRadius,
            0,
            Math.sin(angle) * ringRadius
        );

        // Rotate so it faces outward from the center
        segment.lookAt(0, 0, 0);
        segment.rotateY(Math.PI / 2);

        ringParent.add(segment);
        ringSegmentsArray.push(segment);
    }

    // Apply the tilt using radians
    ringParent.rotation.set(
        THREE.MathUtils.degToRad(innerRingTilt.x),
        THREE.MathUtils.degToRad(innerRingTilt.y),
        THREE.MathUtils.degToRad(innerRingTilt.z)
    );

    group.add(ringParent);

    // Outer Ring (optional)
    let outerRingParent = null;
    const outerRingSegmentsArray: THREE.Mesh[] = [];

    if (outerRingInnerRadius && outerRingOuterRadius && outerRingTilt) {
        outerRingParent = new THREE.Object3D();
        const outerRadius = (outerRingInnerRadius + outerRingOuterRadius) / 2;
        const outerSegmentWidth = (2 * Math.PI * outerRadius) / numSegments;

        for (let i = 0; i < numSegments; i++) {
            const angle = i * segmentAngle;

            const geometry = new THREE.BoxGeometry(
                segmentDepth,       // width (radial direction; outwards from center)
                segmentHeight,      // height (upward Y)
                outerSegmentWidth   // depth (along the arc)
            );

            const material = ringMaterial?.clone() || new THREE.MeshStandardMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 });
            const segment = new THREE.Mesh(geometry, material);

            // Position around ring
            segment.position.set(
                Math.cos(angle) * outerRadius,
                0,
                Math.sin(angle) * outerRadius
            );

            // Rotate so it faces outward from the center
            segment.lookAt(0, 0, 0);
            segment.rotateY(Math.PI / 2);

            outerRingParent.add(segment);
            outerRingSegmentsArray.push(segment);
        }

        // Apply the tilt using radians
        outerRingParent.rotation.set(
            THREE.MathUtils.degToRad(outerRingTilt.x),
            THREE.MathUtils.degToRad(outerRingTilt.y),
            THREE.MathUtils.degToRad(outerRingTilt.z)
        );

        group.add(outerRingParent);
    }

    // Optional glow
    if (hasAtmosphericGlow) {
        const atmosphereMaterial = createAtmosphereMaterial();
        const atmosphere = createAtmosphereGlow(
            radius + 0.3,
            numSegments,
            numSegments,
            atmosphereMaterial
        );
        group.add(atmosphere);
    }

    return {
        group,
        planet,
        ringParent,
        ringSegmentsArray,
        ...(outerRingParent && {
            outerRingParent,
            outerRingSegmentsArray
        })
    };
}

function getGradientColor(
    intensity: number,
    gradient: [THREE.Color, THREE.Color, THREE.Color]
): THREE.Color {
    const [low, mid, high] = gradient;

    if (intensity <= 1 / 3) {
        const t = intensity / (1 / 3);
        return low.clone().lerp(mid, t);
    } else if (intensity <= 2 / 3) {
        const t = (intensity - 1 / 3) / (1 / 3);
        return mid.clone().lerp(high, t);
    } else {
        const t = (intensity - 2 / 3) / (1 / 3);
        return high.clone().lerp(low, t);
    }
}

export function animateOneRingAudio(
    ringSegments: THREE.Mesh[],
    audioData: Float32Array,
    options: RingAnimationOptions = {}
) {
    // Default options
    const {
        innerWaveAmplitude = 0.5,
        innerWaveFrequency = 8,
        gradientColors = [
            new THREE.Color(0x0000ff), // default blue
            new THREE.Color(0x8000ff), // default purple
            new THREE.Color(0x00ffff)  // default cyan
        ]
    } = options;

    const segmentCount = ringSegments.length;

    for (let i = 0; i < segmentCount; i++) {
        const audioRaw = audioData[i % audioData.length] ?? -70;

        // Normalize inner and outer ring intensities
        let audioIntensity = Math.max(0, (audioRaw + 70) / 70);

        // Intensity equalizer to amplify the lower frequencies
        const applyEqualizer = (intensity: number, i: number) => {
            if (i <= segmentCount / 4) {
                return Math.min(intensity * 1.03125, 1.0);
            } else if (i <= segmentCount / 2) {
                return Math.min(intensity * 1.0625, 1.0);
            } else if (i <= segmentCount * 3 / 4) {
                return Math.min(intensity * 1.125, 1.0);
            } else {
                return Math.min(intensity * 1.25, 1.0);
            }
        };

        audioIntensity = applyEqualizer(audioIntensity, i);

        // Apply sine wave & jump to inner ring (vocal)
        const inner = ringSegments[i];
        const wave = Math.sin((i / segmentCount) * Math.PI * 2 * innerWaveFrequency + performance.now() * 0.003);
        const waveFactor = 1.0 + innerWaveAmplitude * wave;

        const innerScaleY = (1.0 + audioIntensity * 5.5) * waveFactor;
        inner.scale.set(
            1.0 + audioIntensity * 1.1,
            innerScaleY,
            1.0 + audioIntensity * 4
        );
        inner.position.y = (innerScaleY - 1) * 0.5;

        // Apply color gradient to inner ring
        const innerColor = getGradientColor(audioIntensity, gradientColors);
        const innerMat = inner.material as THREE.MeshStandardMaterial;
        innerMat.color = innerColor;
        innerMat.emissive = innerColor;
        innerMat.emissiveIntensity = 0.2 + audioIntensity * 1.5;
    }
}

export function animateTwoRingAudio(
    ringSegments: THREE.Mesh[],
    outerRingSegments: THREE.Mesh[],
    vocalData: Float32Array,
    instrumentalData: Float32Array,
    options: RingAnimationOptions = {}
): void {
    // Default options
    const {
        innerWaveAmplitude = 0.5,
        innerWaveFrequency = 8,
        outerWaveAmplitude = 0.3,
        outerWaveFrequency = 6,
        gradientColors = [
            new THREE.Color(0x0000ff), // default blue
            new THREE.Color(0x8000ff), // default purple
            new THREE.Color(0x00ffff)  // default cyan
        ]
    } = options;

    const segmentCount = ringSegments.length;

    for (let i = 0; i < segmentCount; i++) {
        const vocalRaw = vocalData[i % vocalData.length] ?? -70;
        const instrRaw = instrumentalData[i % instrumentalData.length] ?? -70;

        // Normalize inner and outer ring intensities
        let vocalIntensity = Math.max(0, (vocalRaw + 70) / 70);
        let instrIntensity = Math.max(0, (instrRaw + 70) / 70);

        // Intensity equalizer to amplify the lower frequencies
        const applyEqualizer = (intensity: number, i: number) => {
            if (i <= segmentCount / 4) {
                return Math.min(intensity * 1.03125, 1.0);
            } else if (i <= segmentCount / 2) {
                return Math.min(intensity * 1.0625, 1.0);
            } else if (i <= segmentCount * 3 / 4) {
                return Math.min(intensity * 1.125, 1.0);
            } else {
                return Math.min(intensity * 1.25, 1.0);
            }
        };

        vocalIntensity = applyEqualizer(vocalIntensity, i);
        instrIntensity = applyEqualizer(instrIntensity, i);

        // Apply sine wave & jump to inner ring (vocal)
        const inner = ringSegments[i];
        const wave = Math.sin((i / segmentCount) * Math.PI * 2 * innerWaveFrequency + performance.now() * 0.003);
        const waveFactor = 1.0 + innerWaveAmplitude * wave;

        const innerScaleY = (1.0 + vocalIntensity * 5.5) * waveFactor;
        inner.scale.set(
            1.0 + vocalIntensity * 1.1,
            innerScaleY,
            1.0 + vocalIntensity * 4
        );
        inner.position.y = (innerScaleY - 1) * 0.5;

        // Apply sine wave & jump to outer ring (instrumental)
        if (outerRingSegments && outerWaveAmplitude && outerWaveFrequency) {
            const outer = outerRingSegments[i];
            const outerWave = Math.sin((i / segmentCount) * Math.PI * 2 * outerWaveFrequency + performance.now() * 0.002);
            const outerWaveFactor = 1.0 + outerWaveAmplitude * outerWave;

            const outerScaleY = (1.0 + instrIntensity * 3.5) * outerWaveFactor;
            outer.scale.set(
                1.0 + instrIntensity * 0.8,
                outerScaleY,
                1.0 + instrIntensity * 2
            );
            outer.position.y = (outerScaleY - 1) * 0.5;

            // Apply color gradient to inner ring
            const innerColor = getGradientColor(vocalIntensity, gradientColors);
            const innerMat = inner.material as THREE.MeshStandardMaterial;
            innerMat.color = innerColor;
            innerMat.emissive = innerColor;
            innerMat.emissiveIntensity = 0.2 + vocalIntensity * 1.5;

            // Apply color gradient to outer ring
            const outerColor = getGradientColor(instrIntensity, gradientColors);
            const outerMat = outer.material as THREE.MeshStandardMaterial;
            outerMat.color = outerColor;
            outerMat.emissive = outerColor;
            outerMat.emissiveIntensity = 0.15 + instrIntensity * 1.2;
        }
    }
}
