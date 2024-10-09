import * as THREE from 'three'; // 导入Three.js库
import { selectRandom } from './util'; // 导入自定义的随机选择函数
import { MaterialOptions, PipeOptions } from '../types';

const MATERIAL_COLOR = ['#e14848']; // 定义材质颜色数组
const PIPE_RADIUS = 0.6; // 定义管道半径
const OUTER_PIPE_RADIUS = PIPE_RADIUS + 0.2; // 定义外层管道半径
const RADIAL_SEGMENTS = 10; // 定义径向分段数
const HEIGHT_SEGMENTS = 4; // 定义高度分段数
const ELBOW_SEGMENTS = 8; // 定义弯头分段数

// 材质工厂类，处理材质创建
class MaterialFactory {
  // 创建材质
  static createMaterial(options: MaterialOptions): THREE.Material {
    return new THREE.MeshPhongMaterial({
      map: options.texture || null, // 纹理贴图
      specular: 0xa9fcff, // 高光颜色
      color: options.color, // 材质颜色
      emissive: options.emissive, // 自发光颜色
      emissiveIntensity: 0.5, // 自发光强度
      shininess: 100, // 光泽度
      transparent: true, // 是否透明
      opacity: 0.8, // 不透明度
      side: THREE.DoubleSide, // 双面渲染
    });
  }

  // 创建外层材质
  static createOutMaterial(): THREE.Material {
    const color = selectRandom('#000000'); // 随机选择颜色
    const emissive = new THREE.Color(color).multiplyScalar(0.3); // 计算自发光颜色
    return new THREE.MeshPhongMaterial({
      color: '#fafafa', // 材质颜色
      specular: 0xa9fcff, // 高光颜色
      emissive: emissive, // 自发光颜色
      emissiveIntensity: 0.5, // 自发光强度
      shininess: 100, // 光泽度
      transparent: true, // 是否透明
      opacity: 0.9, // 不透明度
      vertexColors: true, // 顶点颜色
    });
  }
}

// 渐变颜色生成器类
class GradientColorGenerator {
  // 生成渐变颜色
  static generate(radialSegments: number, heightSegments: number): number[] {
    const vertexCount = (radialSegments + 1) * 2 * heightSegments; // 计算顶点数量
    const colors: number[] = []; // 颜色数组
    const color1 = new THREE.Color('#F20C0C'); // 起始颜色
    const color2 = new THREE.Color('#D5D5D5'); // 结束颜色

    for (let i = 0; i < vertexCount; i++) {
      const color = color1.clone().lerp(color2, i / (vertexCount - 1)); // 计算渐变颜色
      colors.push(color.r, color.g, color.b); // 添加颜色到数组
    }

    return colors; // 返回颜色数组
  }
}

// 圆柱体工厂类
class CylinderFactory {
  // 创建圆柱体
  static createCylinder(
    fromPoint: THREE.Vector3, // 起点
    toPoint: THREE.Vector3, // 终点
    radius: number, // 半径
    material: THREE.Material, // 材质
    colors?: number[], // 颜色数组（可选）
  ): THREE.Mesh {
    const deltaVector = new THREE.Vector3().subVectors(toPoint, fromPoint); // 计算向量差
    const arrow = new THREE.ArrowHelper(
      deltaVector.clone().normalize(),
      fromPoint,
    ); // 创建箭头辅助对象

    const geometry = new THREE.CylinderGeometry(
      radius, // 顶部半径
      radius, // 底部半径
      deltaVector.length(), // 高度
      RADIAL_SEGMENTS, // 径向分段数
      HEIGHT_SEGMENTS, // 高度分段数
      true, // 是否开启顶部和底部
    );

    if (colors) {
      const colorAttribute = new THREE.Float32BufferAttribute(colors, 3); // 创建颜色属性
      geometry.setAttribute('color', colorAttribute); // 设置颜色属性
    }

    const mesh = new THREE.Mesh(geometry, material); // 创建网格对象
    mesh.rotation.setFromQuaternion(arrow.quaternion); // 设置旋转
    mesh.position.addVectors(
      fromPoint,
      deltaVector.clone().multiplyScalar(0.5),
    ); // 设置位置
    mesh.updateMatrix(); // 更新矩阵

    return mesh; // 返回网格对象
  }
}

// 管道类
export class Pipe {
  public positions?: THREE.Vector3[]; // 管道位置数组
  public object3d: THREE.Object3D; // 管道的3D对象
  public material: THREE.Material; // 内层管道材质
  public outMaterial: THREE.Material; // 外层管道材质
  public options: PipeOptions; // 配置选项
  public scene: THREE.Scene; // 场景

  private texture: THREE.Texture | null = null; // 纹理

  constructor(scene: THREE.Scene, options: PipeOptions) {
    this.options = options; // 初始化配置选项
    this.object3d = new THREE.Object3D(); // 创建3D对象
    scene.add(this.object3d); // 将3D对象添加到场景中

    this.material = this.createMaterial(options.texturePath); // 创建内层管道材质
    this.outMaterial = MaterialFactory.createOutMaterial(); // 创建外层管道材质
    this.scene = scene; // 初始化场景
  }

  // 创建材质
  private createMaterial(texturePath: string): THREE.Material {
    const color = selectRandom(MATERIAL_COLOR); // 随机选择颜色
    const emissive = new THREE.Color(color).multiplyScalar(0.3); // 计算自发光颜色

    this.texture = new THREE.TextureLoader().load(texturePath); // 加载纹理
    this.texture.wrapS = THREE.RepeatWrapping; // 设置纹理水平重复
    this.texture.wrapT = THREE.RepeatWrapping; // 设置纹理垂直重复
    this.texture.repeat.set(3, 5); // 设置纹理重复次数

    return MaterialFactory.createMaterial({
      color,
      emissive,
      texture: this.texture,
    }); // 创建材质
  }

  // 生成管道线段
  public generatePipeLine(fromPoint: THREE.Vector3, toPoint: THREE.Vector3) {
    this.object3d.add(
      CylinderFactory.createCylinder(
        fromPoint,
        toPoint,
        PIPE_RADIUS,
        this.material,
      ),
    ); // 添加内层管道

    const gradientColors = GradientColorGenerator.generate(
      RADIAL_SEGMENTS,
      HEIGHT_SEGMENTS,
    ); // 生成渐变颜色
    this.object3d.add(
      CylinderFactory.createCylinder(
        fromPoint,
        toPoint,
        OUTER_PIPE_RADIUS,
        this.outMaterial,
        gradientColors,
      ),
    ); // 添加外层管道
  }

  // 生成管道接头
  public generatePipeJoint(jointType: string, position: THREE.Vector3) {
    const gradientColors = GradientColorGenerator.generate(
      ELBOW_SEGMENTS,
      HEIGHT_SEGMENTS,
    ); // 生成渐变颜色
    if (jointType === 'elbow') {
      this.makeElbowJoint(position, gradientColors); // 创建弯头接头
    }
  }

  // 创建弯头接头
  private makeElbowJoint(position: THREE.Vector3, colors?: number[]) {
    const innerElbow = new THREE.Mesh(
      new THREE.SphereGeometry(PIPE_RADIUS, ELBOW_SEGMENTS, ELBOW_SEGMENTS),
      this.material,
    ); // 创建内层弯头
    innerElbow.position.copy(position); // 设置位置
    this.object3d.add(innerElbow); // 添加到3D对象中

    const outerElbowGeometry = new THREE.SphereGeometry(
      OUTER_PIPE_RADIUS,
      ELBOW_SEGMENTS,
      ELBOW_SEGMENTS,
    ); // 创建外层弯头几何体
    if (colors) {
      const colorAttribute = new THREE.Float32BufferAttribute(colors, 3); // 创建颜色属性
      outerElbowGeometry.setAttribute('color', colorAttribute); // 设置颜色属性
    }
    const outerElbow = new THREE.Mesh(outerElbowGeometry, this.outMaterial); // 创建外层弯头
    outerElbow.position.copy(position); // 设置位置
    this.object3d.add(outerElbow); // 添加到3D对象中
  }

  // 生成管道
  public generate() {
    if (!this.positions) return; // 如果没有位置数组则返回

    let currentVector = new THREE.Vector3(); // 当前向量
    for (let i = 0; i < this.positions.length - 1; i++) {
      const currentNode = this.positions[i]; // 当前节点
      const nextNode = this.positions[i + 1]; // 下一个节点
      if (currentNode && nextNode) {
        const nextVector = new THREE.Vector3().subVectors(
          currentNode,
          nextNode,
        ); // 计算下一个向量
        if (!nextVector.equals(currentVector)) {
          this.generatePipeJoint(this.options.jointType, currentNode); // 生成管道接头
        }
        this.generatePipeLine(currentNode, nextNode); // 生成管道线段
        currentVector = nextVector; // 更新当前向量
      }
    }
  }

  // 更新纹理偏移
  public updateTextureOffset(delta: number) {
    if (this.texture) {
      this.texture.offset.y += delta; // 更新纹理偏移
    }
  }
}
