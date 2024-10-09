import * as THREE from 'three';

export function createLine(scene: THREE.Scene): THREE.Line {
  const lineMaterial = new THREE.LineBasicMaterial({
    color: '#fff',
    transparent: true,
    opacity: 0.7,
    linewidth: 5,
    linecap: 'round',
  });
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);

  return line;
}