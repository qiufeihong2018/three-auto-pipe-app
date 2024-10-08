import * as THREE from 'three'; // 导入 Three.js 库

// 生成 x1 和 x2 之间的随机数
export function random(x1, x2) {
  return Math.random() * (x2 - x1) + x1; // 返回 x1 和 x2 之间的随机数
}

// 生成 x1 和 x2 之间的随机整数
export function randomInteger(x1, x2) {
  return Math.round(random(x1, x2)); // 返回 x1 和 x2 之间的随机整数
}

/**
 * 生成位于 box 空间内的随机整数坐标
 * @param box - 包含最小和最大坐标的盒子
 * @returns 一个位于三维空间中的点
 */
export function randomIntegerVector3WithinBox(box) {
  return new THREE.Vector3(
    randomInteger(box.min.x, box.max.x), // 生成 x 轴上的随机整数
    randomInteger(box.min.y, box.max.y), // 生成 y 轴上的随机整数
    randomInteger(box.min.z, box.max.z), // 生成 z 轴上的随机整数
  );
}

// 根据给定的概率值返回 true 或 false
export function chance(value) {
  return Math.random() < value; // 如果随机数小于给定值，则返回 true，否则返回 false
}

/**
 * 从给定的数组或字符串中，随机选择一个元素
 * @param input - 输入的数组或字符串
 * @returns 从输入中随机选择的元素
 * @throws 如果输入为空，则抛出错误
 */
export function selectRandom<T>(input: T[] | string): T | string {
  if (input.length === 0) {
    throw new Error('Input 不能为空'); // 如果输入为空，则抛出错误
  }
  const randomIndex = Math.floor(Math.random() * input.length); // 生成随机索引
  return input[randomIndex]; // 返回随机选择的元素
}

// 原地打乱数组
export function shuffleArrayInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // 生成随机索引
    const temp = array[i]; // 暂存当前元素
    array[i] = array[j]; // 将随机索引处的元素赋值给当前元素
    array[j] = temp; // 将暂存的元素赋值给随机索引处的元素
  }
}
