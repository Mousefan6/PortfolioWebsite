/**************************************************************
* Author(s): Bryan Lee & Jaden Lee
* Last Updated: 9/21/2025
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

// ============================================================================================= //
// Helper function to check if an object is a descendant of another
// ============================================================================================= //
    
function isDescendantOf(object: THREE.Object3D, potentialAncestor: THREE.Object3D): boolean {
    let current = object;
    while (current.parent) {
        if (current.parent === potentialAncestor) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

export function handlePlanetClick(
    event: MouseEvent,
    camera: THREE.PerspectiveCamera,
    raycaster: THREE.Raycaster,
    mouse: THREE.Vector2,
    clickableObjects: THREE.Object3D[],
    controls: any,
    activePlanet: THREE.Object3D | null,
    setActivePlanet: (p: THREE.Object3D) => void
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
    
    // ============================================================================================= //
    // Prevent camera from resetting to current planet on click
    // ============================================================================================= //
    
    const isClickingActivePlanet = activePlanet && isDescendantOf(clickedObject, activePlanet);

    if (isClickingActivePlanet) {
        // Check for double-click
        if (event.detail === 2) { // Browser automatically sets detail to 2 for double-clicks
            resetCamera();
            setActivePlanet(null);
            return true;
        }
        // Ignore single clicks on active planet
        return false;
    }

    // ============================================================================================= //
    // Check if it's an orb or has clickable userData
    // ============================================================================================= //
    
    if (clickedObject.userData.isClickable && clickedObject.userData.onClick) {
        clickedObject.userData.onClick();
        return true; // Return true to indicate orb was clicked
    }

    // ============================================================================================= //
    // On planet click
    // ============================================================================================= //
    // const targetObject = intersects[0].object as THREE.Mesh;
    const targetWorldPos = new THREE.Vector3();
    clickedObject.getWorldPosition(targetWorldPos);

    // Get radius of target object
    let radius = 10;
    // const geometry = clickedObject.geometry as THREE.SphereGeometry; // For sphere
    const geo = (clickedObject as any).geometry; // Dynamically get radius of clicked object
    if (geo) {
        if (geo instanceof THREE.SphereGeometry && geo.parameters?.radius) {
            radius = geo.parameters.radius;
        }
        else if (geo.boundingSphere) {
            geo.computeBoundingSphere?.();
            radius = geo.boundingSphere?.radius ?? radius;
        }
    }

    const offsetDir = new THREE.Vector3(1, 1, 1).normalize();
    // const offset = new THREE.Vector3().subVectors(camera.position, targetWorldPos).normalize();
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
        onComplete: () => {
            if (controls) controls.enabled = true;
        }
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

    setActivePlanet(clickedObject);
    return true;
}