/**************************************************************
* Author(s): Jaden Lee
* Last Updated: 10/22/2025
*
* File:: handleOrbClick.ts
*
* Description:: This file serves the functions necessary for handling
*               the orb click event. It creates the cinematic zooming
*               and rotation of the camera to the surface of the orb
*               on the surfance on the planet and opens the orb UI.
*
**************************************************************/

import * as THREE from 'three';
import { gsap } from 'gsap/gsap-core';
import { sceneState } from '../util/sceneState';

// ============================================================================================= //
// Handle Planet click
// ============================================================================================= //

export function handleOrbClick(
    event: MouseEvent,
    camera: THREE.PerspectiveCamera,
    raycaster: THREE.Raycaster,
    mouse: THREE.Vector2,
    orbs: THREE.Object3D[],
    controls: any,
    setActiveOrb: (o: THREE.Object3D | null) => void
): boolean {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(orbs, true);
    if (!intersects.length) return false;

    const clickedOrb = intersects[0].object;

    if (!clickedOrb.userData.isClickable) return false;
    if (sceneState.activeOrb === clickedOrb && sceneState.isZoomedIn) {
        return true;
    }

    const orbWorldPos = new THREE.Vector3();
    clickedOrb.getWorldPosition(orbWorldPos);

    // Calculate zoom-in distance
    let radius = 3;
    const geo = (clickedOrb as any).geometry;
    if (geo instanceof THREE.SphereGeometry && geo.parameters?.radius) {
        radius = geo.parameters.radius;
    } else if (geo?.boundingSphere) {
        geo.computeBoundingSphere?.();
        radius = geo.boundingSphere?.radius ?? radius;
    }

    const offsetDir = new THREE.Vector3(1, 1, 1).normalize();
    const distance = radius * 3;
    const cameraTargetPos = orbWorldPos.clone().addScaledVector(offsetDir, distance);

    if (controls) controls.enabled = false;

    gsap.to(camera.position, {
        x: cameraTargetPos.x,
        y: cameraTargetPos.y,
        z: cameraTargetPos.z,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => controls.update(),
        onComplete: () => {
            if (controls) controls.enabled = true;
        }
    });

    if (controls && controls.target) {
        gsap.to(controls.target, {
            x: orbWorldPos.x,
            y: orbWorldPos.y,
            z: orbWorldPos.z,
            duration: 2,
            ease: 'power2.inOut',
            onUpdate: () => controls.update()
        });
    }

    setActiveOrb(clickedOrb);

    return true;
}