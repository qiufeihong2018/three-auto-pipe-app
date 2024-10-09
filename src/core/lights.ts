import * as THREE from 'three';

export function addLights(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0x111111);
  scene.add(ambientLight);

  const directionalLightL = new THREE.DirectionalLight(0xffffff, 2);
  directionalLightL.position.set(1.2, 1.5, 5);
  scene.add(directionalLightL);
}