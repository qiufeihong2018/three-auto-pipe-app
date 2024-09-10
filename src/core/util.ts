import * as THREE from 'three';

export function random(x1, x2) {
  return Math.random() * (x2 - x1) + x1;
}

export function randomInteger(x1, x2) {
  return Math.round(random(x1, x2));
}

/**
 * 生成位于 box 空间内的随机整数坐标
 * @param box 
 * @returns 一个位于三维空间中的点 
 */
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

/**
 * 从给定的数组或字符串中，随机选择一个元素
 * @param input - 输入的数组或字符串
 * @returns 从输入中随机选择的元素
 * @throws 如果输入为空，则抛出错误
 */
export function selectRandom<T>(input: T[] | string): T | string  {
  if (input.length === 0) {
    throw new Error("Input 不能为空");
  }
  const randomIndex = Math.floor(Math.random() * input.length);
  return input[randomIndex];
}

export function shuffleArrayInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
