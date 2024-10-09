export interface ModelConfig {
  path: string;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface InitOptions {
  // Define the expected properties of the options object here
  texturePath: string;
  joints: string;
}

// 定义管道选项接口
export interface PipeOptions {
  texturePath: string; // 纹理路径
  jointType: string; // 接头类型
  teapotChance: number;
  ballJointChance: number;
}

// 定义材质选项接口
export interface MaterialOptions {
  color: string; // 颜色
  emissive: THREE.Color; // 自发光颜色
  texture?: THREE.Texture; // 纹理（可选）
}
