/**************************************************************
* Author(s): Bryan Lee & Jaden Lee
* Last Updated: 10/21/2025
*
* File:: handlePlanetClick.ts
*
* Description:: This file serves the functions necessary for handling
*               the planet click event. It creates the cinematic zooming
*               and rotation of the camera to the surface of the clicked point
*               on the planet.
*
**************************************************************/

import * as THREE from 'three';
import { gsap } from 'gsap';
import { sceneState } from '../util/sceneState';

// ============================================================================================= //
// Handle Planet click
// ============================================================================================= //

export function handlePlanetClick(
    event: MouseEvent,
    camera: THREE.PerspectiveCamera,
    raycaster: THREE.Raycaster,
    mouse: THREE.Vector2,
    clickableObjects: THREE.Object3D[],
    controls: any,
    setActivePlanet: (o: THREE.Object3D | null) => void
): boolean {
    // Get mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // ============================================================================================= //
    // Raycast on clickable objects
    // ============================================================================================= //
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);
    if (!intersects.length) return false;

    const clickedObject = intersects[0].object;

    // Prevents reclicking on current active planet
    if (sceneState.activePlanet === clickedObject && sceneState.isZoomedIn) {
        return true;
    }

    const targetWorldPos = new THREE.Vector3();
    clickedObject.getWorldPosition(targetWorldPos);

    // Get radius of target object
    let radius = (clickedObject as any).geometry?.parameters?.radius ?? 10;
    const offsetDir = new THREE.Vector3(1, 1, 1).normalize();
    const distance = radius * 3; // zoom distance from center
    const cameraTargetPos = targetWorldPos.clone().addScaledVector(offsetDir, distance);

    if (controls) controls.enabled = false;

    // Tween camera to planet center
    gsap.to(camera.position, {
        x: cameraTargetPos.x,
        y: cameraTargetPos.y,
        z: cameraTargetPos.z,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => controls.update(),
        onComplete: () => { controls.enabled = true; }
    });

    if (controls && controls.target) {
        gsap.to(controls.target, {
            x: targetWorldPos.x,
            y: targetWorldPos.y,
            z: targetWorldPos.z,
            duration: 2,
            ease: 'power2.inOut',
            onUpdate: () => controls.update()
        });
    }

    sceneState.activePlanet = clickedObject;
    sceneState.isZoomedIn = true;
    setActivePlanet(clickedObject);
    
    return true;
}