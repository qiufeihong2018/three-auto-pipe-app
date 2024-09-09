import * as THREE from 'three';

export function random(x1, x2) {
  return Math.random() * (x2 - x1) + x1;
}

export function randomInteger(x1, x2) {
  return Math.round(random(x1, x2));
}

export function randomIntegerVector3WithinBox(box) {
  return new THREE.Vector3(
    randomInteger(box.min.x, box.max.x),
    randomInteger(box.min.y, box.max.y),
    randomInteger(box.min.z, box.max.z)
  );
}

export function chance(value) {
  return Math.random() < value;
}

export function chooseFrom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

export function shuffleArrayInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
