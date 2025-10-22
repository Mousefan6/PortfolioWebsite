/**************************************************************
* Author(s): Jaden Lee
* Last Updated: 10/22/2025
*
* File:: sceneState.ts
*
* Description:: This file serves the functions necessary for handling
*               the current user state.
*
**************************************************************/

import * as THREE from 'three';

export interface SceneState {
  activePlanet: THREE.Object3D | null;
  activeOrb: THREE.Object3D | null;
  isZoomedIn: boolean;
  resetPosition: THREE.Vector3;
  resetTarget: THREE.Vector3;
}

export const sceneState: SceneState = {
  activePlanet: null,
  activeOrb: null,
  isZoomedIn: false,
  resetPosition: new THREE.Vector3(0, 10, 40),
  resetTarget: new THREE.Vector3(0, 5, 0),
};
