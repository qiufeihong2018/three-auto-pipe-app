import * as THREE from 'three'; // 导入 Three.js 库
import { TeapotGeometry } from "three/addons/geometries/TeapotGeometry.js"; // 导入茶壶几何体
import { chance, selectRandom, random, randomIntegerVector3WithinBox } from './util'; // 导入工具函数
import { textures } from './textures'; // 导入纹理
import { getAt, setAt } from './node'; // 导入节点操作函数

const materailColor = ["#d12a2a", "#fa541c", "#fa8c16", "#faad14", "#fadb14", "#a0d911", "#52c41a", "#13c2c2", "#2a54d1", "#2f54eb", "#722ed1", "#eb2f96"]; // 定义材质颜色数组

// 管道所在的三维空间区域
const gridBounds = new THREE.Box3(
  new THREE.Vector3(-10, -10, -10), // 定义区域的最小点
  new THREE.Vector3(10, 10, 10) // 定义区域的最大点
);

const pipeRadius = 0.2; // 管道半径
const ballJointRadius = pipeRadius * 1.5; // 球形关节半径
const teapotSize = ballJointRadius; // 茶壶大小

export class Pipe {
  public currentPosition; // 当前管道位置
  public positions; /** 管道在空间上的关键点，这些点连起来就是管道 */
  public object3d: THREE.Object3D; /** 3D场景中的管道实例，可以有 children */
  public material; // 管道材质
  public options; // 管道选项

  constructor(scene, options) {
    this.options = options; // 初始化选项
  
    this.currentPosition = randomIntegerVector3WithinBox(gridBounds); // 随机生成初始位置
    this.positions = [this.currentPosition]; // 初始化位置数组
    this.object3d = new THREE.Object3D(); // 创建 3D 对象
    scene.add(this.object3d); // 将 3D 对象添加到场景中

    if (options.texturePath) { // 如果有纹理路径
      this.material = new THREE.MeshLambertMaterial({
        map: textures[options.texturePath], // 使用纹理
      });
    } else {
      // 具有随机颜色的材质对象
      const color = selectRandom(materailColor); // 随机选择颜色
      const emissive = new THREE.Color(color).multiplyScalar(0.3); // 设置发光颜色
      this.material = new THREE.MeshPhongMaterial({
        specular: 0xa9fcff, // 镜面反射颜色
        color: color, // 颜色
        emissive: emissive, // 发光颜色
        shininess: 100, // 光泽度
      });
    }

    setAt(this.currentPosition, this); // 在当前位置设置管道
    // 开始的节点
    this.makeBallJoint(this.currentPosition); // 创建球形关节
  }

  // 使用圆柱（Cylinder）构建管道
  public generatePipeLine(fromPoint, toPoint, material) {
    const deltaVector = new THREE.Vector3().subVectors(toPoint, fromPoint); // 计算两个点之间的向量
    const arrow = new THREE.ArrowHelper(
      deltaVector.clone().normalize(), // 归一化向量
      fromPoint // 起点
    );
    // 圆柱缓冲几何体
    // https://threejs.org/docs/index.html?q=CylinderGeometry#api/zh/geometries/CylinderGeometry
    const geometry = new THREE.CylinderGeometry(
      pipeRadius, // 顶部半径
      pipeRadius, // 底部半径
      deltaVector.length(), // 高度
      10, // 圆周分段数
      4, // 高度分段数
      true // 是否开启顶部和底部
    );
    const mesh = new THREE.Mesh(geometry, material); // 创建圆柱网格

    mesh.rotation.setFromQuaternion(arrow.quaternion); // 设置旋转
    mesh.position.addVectors(fromPoint, deltaVector.multiplyScalar(0.5)); // 设置位置
    mesh.updateMatrix(); // 更新矩阵
    // 将圆柱添加到管道实例中
    this.object3d.add(mesh); // 添加到 3D 对象中
  };

  public generatePipeJoint(jointType, position) {
    switch (jointType) {
      case "ball":
        this.makeBallJoint(position); // 创建球形关节
        break;
      case "teapot":
        this.makeTeapotJoint(position); // 创建茶壶关节
        break;
      case "elbow":
        this.makeElbowJoint(position); // 创建肘形关节
        break;
      default:
        break;
    }
  }

  // 节点 Ball
  public makeBallJoint(position) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballJointRadius, 8, 8), // 创建球体几何体
      this.material // 使用管道材质
    );
    ball.position.copy(position); // 设置位置
    this.object3d.add(ball); // 添加到 3D 对象中
  };

  // 节点 Teapot
  public makeTeapotJoint(position) {
    const teapot = new THREE.Mesh(
      new TeapotGeometry(teapotSize, 10, true, true, true, true), // 创建茶壶几何体
      this.material // 使用管道材质
    );
    teapot.position.copy(position); // 设置位置
    teapot.rotation.x = (Math.floor(random(0, 50)) * Math.PI) / 2; // 随机旋转 x 轴
    teapot.rotation.y = (Math.floor(random(0, 50)) * Math.PI) / 2; // 随机旋转 y 轴
    teapot.rotation.z = (Math.floor(random(0, 50)) * Math.PI) / 2; // 随机旋转 z 轴
    this.object3d.add(teapot); // 添加到 3D 对象中
  };

  // 节点 Elbow
  public makeElbowJoint(position) {
    // "elball" (not a proper elbow)
    const elball = new THREE.Mesh(
      new THREE.SphereGeometry(pipeRadius, 8, 8), // 创建球体几何体
      this.material // 使用管道材质
    );
    elball.position.copy(position); // 设置位置
    this.object3d.add(elball); // 添加到 3D 对象中
  };

  /**
   * 基于参数快速生成管道
   */
  public generate() {
    let currentVector = new THREE.Vector3(); // 当前向量
    for (let i = 0; i < this.positions.length; i++) {
      let nextVector;

      const currentNode = this.positions[i]; // 当前节点
      const nextNode = this.positions[i + 1]; // 下一个节点
      if (currentNode && nextNode) {
        // 关键点作为连接关节
        nextVector = new THREE.Vector3().subVectors(
          currentNode,
          nextNode
        );
        if (nextVector && !nextVector.equals(currentVector)) {
          this.generatePipeJoint(this.options.jointType, currentNode); // 生成管道关节
        }
        this.generatePipeLine(currentNode, nextNode, this.material); // 生成管道
        currentVector = nextVector; // 更新当前向量
      } 
    }
  }

  /**
   * 基于算法逐步生成
   */
  public update() {
    let directionVector; // 方向向量
    let lastDirectionVector; // 上一个方向向量
    if (this.positions.length > 1) {
      const lastPosition = this.positions[this.positions.length - 2]; // 上一个位置
      lastDirectionVector = new THREE.Vector3().subVectors(
        this.currentPosition,
        lastPosition
      );
    }
    // 50% 的概率沿着上一个方向继续前进
    if (chance(1 / 2) && lastDirectionVector) {
      directionVector = lastDirectionVector; // 沿着上一个方向
    } else {
      directionVector = new THREE.Vector3(); // 新的方向向量
      // 50% 的概率选择一个新的方向(XYZ的正向or反向)
      directionVector[selectRandom<string>("xyz")] += selectRandom([+1, -1]);
    }
    const newPosition = new THREE.Vector3().addVectors(
      this.currentPosition,
      directionVector
    );

    // 节点的重复检测
    if (!gridBounds.containsPoint(newPosition) || getAt(newPosition)) {
      return; // 如果新位置超出边界或已存在节点，则返回
    }

    setAt(newPosition, this); // 在新位置设置管道

    // 关键点作为连接关节
    if (lastDirectionVector && !lastDirectionVector.equals(directionVector)) {
      this.generatePipeJoint(this.options.jointType, this.currentPosition); // 生成管道关节
    }

    // 生成管道
    this.generatePipeLine(this.currentPosition, newPosition, this.material);

    // 更新当前状态
    this.currentPosition = newPosition; // 更新当前位置
    this.positions.push(newPosition); // 将新位置添加到位置数组中
  };
}