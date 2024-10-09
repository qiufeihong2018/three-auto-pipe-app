import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { labelRenderer } from './renderer';

export let camera: THREE.PerspectiveCamera;
export let controls: OrbitControls;

export function initCameraAndControls(): void {
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 100000);
  controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 500;
}

export function look(): void {
  camera.position.set(25, 25, 25);
  const center = new THREE.Vector3(0, 0, 0);
  camera.lookAt(center);
  controls.update();
}