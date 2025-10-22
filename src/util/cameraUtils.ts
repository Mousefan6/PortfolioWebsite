/**************************************************************
* Author(s): Jaden Lee
* Last Updated: 10/22/2025
*
* File:: handleOrbClick.ts
*
* Description:: Utility functions for camera control, such as
*               resetting camera position to its original spot
*               when the user resets the current view.
*
**************************************************************/

import * as THREE from 'three';
import { gsap } from 'gsap/gsap-core';
import { sceneState } from '../util/sceneState';

export interface ResetState {
    position: THREE.Vector3;
    target: THREE.Vector3;
}

export function resetCamera(
    camera: THREE.PerspectiveCamera,
    controls: any,
    setActivePlanet: (o: THREE.Object3D | null) => void,
    setActiveOrb: (o: THREE.Object3D | null) => void
) {
    if (!controls || !camera) false;

    const { resetPosition, resetTarget } = sceneState;

    gsap.to(camera.position, {
        x: resetPosition.x,
        y: resetPosition.y,
        z: resetPosition.z,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => controls.update(),
        onComplete: () => {
            if (controls) controls.enabled = true;
        }
    });

    gsap.to(controls.target, {
        x: resetTarget.x,
        y: resetTarget.y,
        z: resetTarget.z,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => controls.update()
    });

    sceneState.activePlanet = null; // Reset active planet
    sceneState.activeOrb = null; // Reset active orb
    sceneState.isZoomedIn = true; // Reset zoomed in state

    setActivePlanet(null);
    setActiveOrb(null);
}

// For cinematic effects
// export function cameraShake(camera: THREE.Camera, intensity = 0.5) {
//   gsap.to(camera.position, { x: "+=0.5", duration: 0.05, yoyo: true, repeat: 5 });
// }