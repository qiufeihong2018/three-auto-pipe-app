import * as THREE from "three"; // 导入Three.js库
import { selectRandom } from "./util"; // 导入自定义的随机选择函数

const materialColor = ["#e14848"]; // 定义材质颜色数组
const pipeRadius = 0.6; // 定义管道半径

export class Pipe {
  public positions?: THREE.Vector3[]; // 管道位置数组
  public object3d: THREE.Object3D; // 管道的3D对象
  public material: THREE.Material; // 内层管道材质
  public outMaterial: THREE.Material; // 外层管道材质
  public options: { texturePath: string; jointType: string }; // 配置选项
  public scene: THREE.Scene; // 场景

  private texture: THREE.Texture | null = null; // 纹理

  constructor(scene: THREE.Scene, options: { texturePath: string; jointType: string }) {
    this.options = options; // 初始化配置选项
    this.object3d = new THREE.Object3D(); // 创建3D对象
    scene.add(this.object3d); // 将3D对象添加到场景中

    this.material = this.createMaterial(options.texturePath); // 创建内层管道材质
    this.outMaterial = this.createOutMaterial(); // 创建外层管道材质
    this.scene = scene; // 初始化场景
  }

  // 创建外层管道材质
  private createOutMaterial(): THREE.Material {
    const color = selectRandom("#000000"); // 随机选择颜色
    const emissive = new THREE.Color(color as THREE.ColorRepresentation).multiplyScalar(0.3); // 设置发光颜色

    return new THREE.MeshPhongMaterial({
      color: "#fafafa",
      specular: 0xa9fcff,
      emissive: emissive,
      emissiveIntensity: 0.5,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
      vertexColors: true, // 启用顶点颜色
    });
  }

  // 创建内层管道材质
  private createMaterial(texturePath: string): THREE.Material {
    const color = selectRandom(materialColor); // 随机选择颜色
    const emissive = new THREE.Color(color).multiplyScalar(0.3); // 设置发光颜色

    this.texture = new THREE.TextureLoader().load(texturePath); // 加载纹理
    this.texture.wrapS = THREE.RepeatWrapping; // 设置纹理水平重复
    this.texture.wrapT = THREE.RepeatWrapping; // 设置纹理垂直重复
    this.texture.repeat.set(3, 5); // 设置纹理重复次数

    return new THREE.MeshPhongMaterial({
      map: this.texture,
      specular: 0xa9fcff,
      color: color,
      emissive: emissive,
      emissiveIntensity: 0.5,
      shininess: 100,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
  }

  // 生成渐变颜色数组
  private generateGradientColors(radialSegments: number, heightSegments: number): number[] {
    const vertexCount = (radialSegments + 1) * 2 * heightSegments; // 计算顶点数量
    const colors: number[] = [];
    const color1 = new THREE.Color('#F20C0C'); // 起始颜色
    const color2 = new THREE.Color('#D5D5D5'); // 结束颜色

    for (let i = 0; i < vertexCount; i++) {
      const color = color1.clone().lerp(color2, i / (vertexCount - 1)); // 计算渐变颜色
      colors.push(color.r, color.g, color.b); // 将颜色添加到数组中
    }

    return colors;
  }

  // 创建圆柱体
  private createCylinder(
    fromPoint: THREE.Vector3,
    toPoint: THREE.Vector3,
    radius: number,
    material: THREE.Material,
    colors?: number[]
  ) {
    const deltaVector = new THREE.Vector3().subVectors(toPoint, fromPoint); // 计算两个点之间的向量
    const arrow = new THREE.ArrowHelper(
      deltaVector.clone().normalize(),
      fromPoint
    ); // 创建一个箭头辅助对象

    const radialSegments = 10;
    const heightSegments = 4;

    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      deltaVector.length(),
      radialSegments,
      heightSegments,
      true
    ); // 创建圆柱几何体

    if (colors) {
      const colorAttribute = new THREE.Float32BufferAttribute(colors, 3); // 创建颜色属性
      geometry.setAttribute("color", colorAttribute); // 设置几何体的颜色属性
    }

    const mesh = new THREE.Mesh(geometry, material); // 创建圆柱网格
    mesh.rotation.setFromQuaternion(arrow.quaternion); // 设置旋转
    mesh.position.addVectors(
      fromPoint,
      deltaVector.clone().multiplyScalar(0.5)
    ); // 设置位置
    mesh.updateMatrix(); // 更新矩阵
    this.object3d.add(mesh); // 将圆柱网格添加到3D对象中
  }

  // 生成管道
  public generatePipeLine(fromPoint: THREE.Vector3, toPoint: THREE.Vector3) {
    this.createCylinder(fromPoint, toPoint, pipeRadius, this.material); // 先创建内层管道

    const radialSegments = 10;
    const heightSegments = 4;

    // 生成渐变颜色数组，长度与几何体顶点数量匹配
    const gradientColors = this.generateGradientColors(radialSegments, heightSegments);
    this.createCylinder(
      fromPoint,
      toPoint,
      pipeRadius + 0.2,
      this.outMaterial,
      gradientColors
    ); // 再创建外层管道，并应用渐变颜色
  }

  // 生成管道接头
  public generatePipeJoint(jointType: string, position: THREE.Vector3) {
    const radialSegments = 8;
    const heightSegments = 4;

    // 生成渐变颜色数组，长度与几何体顶点数量匹配
    const gradientColors = this.generateGradientColors(radialSegments, heightSegments);
    if (jointType === "elbow") {
      this.makeElbowJoint(position, gradientColors); // 如果接头类型是弯头，则生成弯头接头
    }
  }

  // 生成弯头接头
  private makeElbowJoint(position: THREE.Vector3, colors?: number[]) {
    const elball = new THREE.Mesh(
      new THREE.SphereGeometry(pipeRadius, 8, 8),
      this.material
    ); // 创建内层弯头
    elball.position.copy(position); // 设置位置
    this.object3d.add(elball); // 将内层弯头添加到3D对象中

    const geometry = new THREE.SphereGeometry(pipeRadius + 0.2, 8, 8); // 创建外层弯头几何体
    if (colors) {
      const colorAttribute = new THREE.Float32BufferAttribute(colors, 3); // 创建颜色属性
      geometry.setAttribute("color", colorAttribute); // 设置几何体的颜色属性
    }
    const elballOut = new THREE.Mesh(geometry, this.outMaterial); // 创建外层弯头
    elballOut.position.copy(position); // 设置位置
    this.object3d.add(elballOut); // 将外层弯头添加到3D对象中
  }

  // 生成管道
  public generate() {
    let currentVector = new THREE.Vector3(); // 当前向量
    if (!this.positions) return;
    for (let i = 0; i < this.positions.length - 1; i++) {
      const currentNode = this.positions[i]; // 当前节点
      const nextNode = this.positions[i + 1]; // 下一个节点
      if (currentNode && nextNode) {
        const nextVector = new THREE.Vector3().subVectors(
          currentNode,
          nextNode
        ); // 计算两个节点之间的向量
        if (!nextVector.equals(currentVector)) {
          this.generatePipeJoint(this.options.jointType, currentNode); // 如果向量不同，则生成接头
        }
        this.generatePipeLine(currentNode, nextNode); // 生成管道
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