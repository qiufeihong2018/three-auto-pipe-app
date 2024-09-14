import * as THREE from "three";
import { selectRandom, randomIntegerVector3WithinBox } from "./util";
import { setAt } from "./node";

const materialColor = ["#e14848"]; // 定义材质颜色数组
const gridBounds = new THREE.Box3(
  new THREE.Vector3(-10, -10, -10), // 定义区域的最小点
  new THREE.Vector3(10, 10, 10) // 定义区域的最大点
);

const pipeRadius = 0.6; // 管道半径

const heatColors = [
  new THREE.Color(0x0000ff), // 冷色（蓝色）
  new THREE.Color(0x00ff00), // 中间色（绿色）
  new THREE.Color(0xff0000), // 热色（红色）
];

export class Pipe {
  public currentPosition: THREE.Vector3; // 当前管道位置
  public positions: THREE.Vector3[]; // 管道在空间上的关键点，这些点连起来就是管道
  public object3d: THREE.Object3D; // 3D场景中的管道实例，可以有 children
  public material: THREE.Material; // 管道材质
  public options: any; // 管道选项
  private texture: THREE.Texture | null = null; // 管道纹理

  constructor(scene: THREE.Scene, options: any) {
    this.options = options; // 初始化选项
    this.currentPosition = randomIntegerVector3WithinBox(gridBounds); // 随机生成初始位置
    this.positions = [this.currentPosition]; // 初始化位置数组
    this.object3d = new THREE.Object3D(); // 创建 3D 对象
    scene.add(this.object3d); // 将 3D 对象添加到场景中

    this.material = this.createMaterial(options.texturePath); // 创建材质

    setAt(this.currentPosition, this); // 在当前位置设置管道
  }

  // 创建材质
  private createMaterial(texturePath: string): THREE.Material {
    const color = selectRandom(materialColor); // 随机选择颜色
    const emissive = new THREE.Color(color).multiplyScalar(0.3); // 设置发光颜色

    this.texture = new THREE.TextureLoader().load(texturePath); // 加载纹理
    this.texture.wrapS = THREE.RepeatWrapping; // 设置纹理的水平重复
    this.texture.wrapT = THREE.RepeatWrapping; // 设置纹理的垂直重复
    this.texture.repeat.set(3, 5); // 设置纹理重复次数

    return new THREE.MeshPhongMaterial({
      map: this.texture, // 应用纹理
      specular: 0xa9fcff, // 镜面反射颜色
      color: color, // 基本颜色
      emissive: emissive, // 发光颜色
      emissiveIntensity: 0.5, // 发光强度
      shininess: 100, // 光泽度
      transparent: true, // 透明
      opacity: 0.8, // 不透明度
      vertexColors: true, // 启用顶点颜色
    });
  }

  // 使用圆柱（Cylinder）构建管道
  public generatePipeLine(
    fromPoint: THREE.Vector3,
    toPoint: THREE.Vector3,
    material: THREE.Material
  ) {
    const deltaVector = new THREE.Vector3().subVectors(toPoint, fromPoint); // 计算两个点之间的向量
    const length = deltaVector.length(); // 管道的长度

    const geometry = new THREE.CylinderGeometry(
      pipeRadius, // 顶部半径
      pipeRadius, // 底部半径
      length, // 圆柱高度
      10, // 圆周分段数
      1, // 高度分段数
      true // 开放顶部和底部
    );

    // 计算渐变颜色
    const positionAttribute = geometry.attributes.position;
    const colors = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      const t = (positionAttribute.getY(i) + length / 2) / length; // 插值因子，基于高度计算

      // 根据插值因子在 heatColors 数组中插值
      const color = new THREE.Color().lerpColors(heatColors[0], heatColors[2], t);
      colors.push(color.r, color.g, color.b); // 将颜色值添加到数组中
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); // 更新颜色属性

    const mesh = new THREE.Mesh(geometry, material); // 创建网格
    const arrow = new THREE.ArrowHelper(
      deltaVector.clone().normalize(),
      fromPoint
    ); // 创建箭头辅助对象

    mesh.rotation.setFromQuaternion(arrow.quaternion); // 设置旋转
    mesh.position.addVectors(fromPoint, deltaVector.multiplyScalar(0.5)); // 设置位置
    mesh.updateMatrix(); // 更新矩阵
    this.object3d.add(mesh); // 添加到 3D 对象中
  }

  // 生成管道关节
  public generatePipeJoint(jointType: string, position: THREE.Vector3) {
    switch (jointType) {
      case "elbow":
        this.makeElbowJoint(position); // 创建肘形关节
        break;
    }
  }

  // 创建肘形关节
  private makeElbowJoint(position: THREE.Vector3) {
    const elball = new THREE.Mesh(
      new THREE.SphereGeometry(pipeRadius, 8, 8), // 创建球体几何体
      this.material // 使用管道材质
    );
    elball.position.copy(position); // 设置位置
    this.object3d.add(elball); // 添加到 3D 对象中
  }

  // 基于参数快速生成管道
  public generate() {
    let currentVector = new THREE.Vector3(); // 当前向量
    for (let i = 0; i < this.positions.length - 1; i++) {
      const currentNode = this.positions[i]; // 当前节点
      const nextNode = this.positions[i + 1]; // 下一个节点
      if (currentNode && nextNode) {
        const nextVector = new THREE.Vector3().subVectors(
          currentNode,
          nextNode
        ); // 计算两个点之间的向量
        if (!nextVector.equals(currentVector)) {
          this.generatePipeJoint(this.options.jointType, currentNode); // 生成管道关节
        }
        this.generatePipeLine(currentNode, nextNode, this.material); // 生成管道
        currentVector = nextVector; // 更新当前向量
      }
    }
  }

  // 更新纹理偏移量
  public updateTextureOffset(delta: number) {
    if (this.texture) {
      this.texture.offset.y += delta; // 更新纹理的水平偏移量
    }
  }
}