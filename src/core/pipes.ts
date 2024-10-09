import * as THREE from 'three';
import { Pipe } from './pipe';
import defautPipesData from '../assets/data.json';
import { PipeOptions } from '../types';

export const pipes: Pipe[] = [];

export function initPipes(scene: THREE.Scene, options: any): void {
  const pipeOptions: PipeOptions = {
    jointType: options.joints,
    teapotChance: 1 / 200,
    ballJointChance: 1,
    texturePath: options.texturePath,
  };

  defautPipesData.forEach((pipeData) => {
    const pipe = new Pipe(scene, pipeOptions);
    pipe.positions = pipeData.map(
      (node) => new THREE.Vector3(node.x, node.y, node.z),
    );
    pipe.generate();
    pipes.push(pipe);
  });
}

export function clearPipes(): void {
  // 定义清除管道函数
  pipes.length = 0; // 清空管道数组
}
