/**************************************************************
* Author(s): Bryan Lee
* Last Updated: 5/25/2025
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

export function handlePlanetClick(
    event: MouseEvent,
    camera: THREE.PerspectiveCamera,
    raycaster: THREE.Raycaster,
    mouse: THREE.Vector2,
    clickableObjects: THREE.Object3D[]
) {
    // Get mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Cast a ray from the mouse position
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length === 0) return;

    // Get the first intersection
    const intersection = intersects[0];
    const clickedPoint = intersection.point.clone();

    // Get the target object
    const targetObject = intersection.object as THREE.Mesh;
    const targetWorldPos = new THREE.Vector3();
    targetObject.getWorldPosition(targetWorldPos);

    // Get the radius of the target object
    const geometry = targetObject.geometry as THREE.SphereGeometry;
    const radius = geometry.parameters.radius;

    // Calculate the normal vector (perpendicular to the clicked point)
    const normal = new THREE.Vector3()
        .subVectors(clickedPoint, targetWorldPos)
        .normalize();

    // Calculate the target position
    const surfaceOffset = 2;
    const cameraTargetPos = new THREE.Vector3()
        .copy(clickedPoint)
        .addScaledVector(normal, radius ? surfaceOffset : 2);

    // Calculate the lookAt position for the surface of the clicked point
    // relative to the current camera position (not rotational agility)
    const currentLookAt = new THREE.Vector3();
    currentLookAt.copy(camera.getWorldDirection(new THREE.Vector3())).add(camera.position);

    const lookAtTween = {
        lx: currentLookAt.x,
        ly: currentLookAt.y,
        lz: currentLookAt.z,
        ux: camera.up.x,
        uy: camera.up.y,
        uz: camera.up.z,
    };

    // Animate the camera to the position (x, y, z)
    gsap.to(camera.position, {
        x: cameraTargetPos.x,
        y: cameraTargetPos.y,
        z: cameraTargetPos.z,
        duration: 2,
        ease: 'power2.inOut',
    });

    // Apply camera rotation to the lookAt
    gsap.to(lookAtTween, {
        lx: clickedPoint.x,
        ly: clickedPoint.y,
        lz: clickedPoint.z,
        ux: normal.x,
        uy: normal.y,
        uz: normal.z,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: () => {
            camera.lookAt(new THREE.Vector3(lookAtTween.lx, lookAtTween.ly, lookAtTween.lz));
            camera.up.set(lookAtTween.ux, lookAtTween.uy, lookAtTween.uz);
        }
    });
}