import * as THREE from "three"; // 导入Three.js库的所有内容，并命名为THREE
import { selectRandom, randomIntegerVector3WithinBox } from "./util"; // 从util模块中导入selectRandom和randomIntegerVector3WithinBox函数
import { setAt } from "./node"; // 从node模块中导入setAt函数
import Stats from "three/addons/libs/stats.module.js"; // 从Three.js库中导入Stats模块
import { GPUStatsPanel } from "three/addons/utils/GPUStatsPanel.js"; // 从Three.js库中导入GPUStatsPanel模块
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // 从Three.js库中导入OrbitControls模块
import { Line2 } from "three/addons/lines/Line2.js"; // 从Three.js库中导入Line2模块
import { LineMaterial } from "three/addons/lines/LineMaterial.js"; // 从Three.js库中导入LineMaterial模块
import { LineGeometry } from "three/addons/lines/LineGeometry.js"; // 从Three.js库中导入LineGeometry模块
import * as GeometryUtils from "three/addons/utils/GeometryUtils.js"; // 导入Three.js库的GeometryUtils模块的所有内容
import defautPipesData from "../assets/data.json"; // 导入默认管道数据

// 常量
const materialColor = ["#e14848"]; // 定义一个包含颜色字符串的数组
const gridBounds = new THREE.Box3( // 定义一个三维边界框
  new THREE.Vector3(-10, -10, -10), // 边界框的最小点
  new THREE.Vector3(10, 10, 10) // 边界框的最大点
);
const pipeRadius = 0.6; // 定义管道的半径

export class Pipe {
  // 定义一个名为Pipe的类
  // 公共属性
  public currentPosition: THREE.Vector3; // 当前管道的位置
  public positions: THREE.Vector3[]; // 管道的所有位置
  public object3d: THREE.Object3D; // 管道的3D对象
  public material: THREE.Material; // 管道的材质
  public options: any; // 管道的选项

  // 私有属性
  private texture: THREE.Texture | null = null; // 管道的纹理
  private scene: THREE.Scene; // 场景对象
  private renderer: THREE.WebGLRenderer; // 渲染器对象
  private camera: THREE.PerspectiveCamera; // 主摄像机
  private camera2: THREE.PerspectiveCamera; // 辅助摄像机
  private controls: OrbitControls; // 轨道控制器
  private stats: Stats; // 性能统计对象
  private gpuPanel: GPUStatsPanel; // GPU性能统计面板
  private insetWidth: number; // 插图宽度
  private insetHeight: number; // 插图高度
  private line: Line2; // 线对象
  private matLine: LineMaterial; // 线材质

  constructor(scene: THREE.Scene, options: any) {
    // 构造函数
    this.options = options; // 初始化选项
    this.currentPosition = randomIntegerVector3WithinBox(gridBounds); // 随机生成当前管道的位置
    this.positions = [this.currentPosition]; // 初始化管道位置数组
    this.object3d = new THREE.Object3D(); // 创建一个3D对象
    scene.add(this.object3d); // 将3D对象添加到场景中

    this.material = this.createMaterial(options.texturePath); // 创建材质
    setAt(this.currentPosition, this); // 设置当前管道的位置

    this.scene = scene; // 初始化场景
    this.init(); // 初始化其他属性和方法
  }

  private createMaterial(texturePath: string): THREE.Material {
    // 创建材质的方法
    const color = selectRandom(materialColor); // 随机选择一种颜色
    const emissive = new THREE.Color(color).multiplyScalar(0.3); // 创建发光颜色

    this.texture = new THREE.TextureLoader().load(texturePath); // 加载纹理
    this.texture.wrapS = THREE.RepeatWrapping; // 设置纹理水平重复
    this.texture.wrapT = THREE.RepeatWrapping; // 设置纹理垂直重复
    this.texture.repeat.set(3, 5); // 设置纹理重复次数

    return new THREE.MeshPhongMaterial({
      // 返回一个Phong材质
      map: this.texture, // 设置纹理
      specular: 0xa9fcff, // 设置高光颜色
      color: color, // 设置颜色
      emissive: emissive, // 设置发光颜色
      emissiveIntensity: 0.5, // 设置发光强度
      shininess: 100, // 设置光泽度
      transparent: true, // 设置透明
      opacity: 0.5, // 设置不透明度
    });
  }

  public generatePipeLine(
    fromPoint: THREE.Vector3,
    toPoint: THREE.Vector3,
    material: THREE.Material
  ) {
    // 生成管道的方法
    const deltaVector = new THREE.Vector3().subVectors(toPoint, fromPoint); // 计算两个点之间的向量
    const arrow = new THREE.ArrowHelper(
      deltaVector.clone().normalize(),
      fromPoint
    ); // 创建一个箭头辅助对象
    const geometry = new THREE.CylinderGeometry(
      pipeRadius,
      pipeRadius,
      deltaVector.length(),
      10,
      4,
      true
    ); // 创建一个圆柱几何体

    const mesh = new THREE.Mesh(geometry, material); // 创建一个网格对象
    mesh.rotation.setFromQuaternion(arrow.quaternion); // 设置网格的旋转
    mesh.position.addVectors(fromPoint, deltaVector.multiplyScalar(0.5)); // 设置网格的位置
    mesh.updateMatrix(); // 更新网格的矩阵
    this.object3d.add(mesh); // 将网格添加到3D对象中
  }

  public generatePipeJoint(jointType: string, position: THREE.Vector3) {
    // 生成管道接头的方法
    if (jointType === "elbow") {
      // 如果接头类型是"elbow"
      this.makeElbowJoint(position); // 创建一个弯头接头
    }
  }

  private makeElbowJoint(position: THREE.Vector3) {
    // 创建弯头接头的方法
    const elball = new THREE.Mesh(
      new THREE.SphereGeometry(pipeRadius, 8, 8),
      this.material
    ); // 创建一个球体几何体
    elball.position.copy(position); // 设置球体的位置
    this.object3d.add(elball); // 将球体添加到3D对象中
  }

  public generate() {
    // 生成管道的方法
    let currentVector = new THREE.Vector3(); // 初始化当前向量
    for (let i = 0; i < this.positions.length - 1; i++) {
      // 遍历所有位置
      const currentNode = this.positions[i]; // 当前节点
      const nextNode = this.positions[i + 1]; // 下一个节点
      if (currentNode && nextNode) {
        // 如果当前节点和下一个节点都存在
        const nextVector = new THREE.Vector3().subVectors(
          currentNode,
          nextNode
        ); // 计算两个节点之间的向量
        if (!nextVector.equals(currentVector)) {
          // 如果向量不同
          this.generatePipeJoint(this.options.jointType, currentNode); // 生成管道接头
        }
        this.generatePipeLine(currentNode, nextNode, this.material); // 生成管道
        currentVector = nextVector; // 更新当前向量
      }
    }
  }

  public updateTextureOffset(delta: number) {
    // 更新纹理偏移的方法
    if (this.texture) {
      // 如果纹理存在
      this.texture.offset.y += delta; // 更新纹理的垂直偏移
    }
  }

  private init() {
    // 初始化方法
    this.setupRenderer(); // 设置渲染器
    this.setupCameras(); // 设置摄像机
    this.setupControls(); // 设置控制器
    this.addLighting(); // 添加光源
    this.setupHilbertCurve(); // 设置Hilbert曲线
    this.setupEventListeners(); // 设置事件监听器
    this.setupStats(); // 设置性能统计
  }

  private setupRenderer() {
    // 设置渲染器的方法
    this.renderer = new THREE.WebGLRenderer({ antialias: true }); // 创建一个WebGL渲染器
    this.renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比
    this.renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器的大小
    this.renderer.setClearColor(0x000000, 0.0); // 设置渲染器的背景颜色
    this.renderer.setAnimationLoop(this.animate.bind(this)); // 设置动画循环
  }

  private setupCameras() {
    // 设置摄像机的方法
    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      1000
    ); // 创建一个透视摄像机
    this.camera.position.set(-40, 0, 60); // 设置摄像机的位置

    this.camera2 = new THREE.PerspectiveCamera(40, 1, 1, 1000); // 创建一个辅助透视摄像机
    this.camera2.position.copy(this.camera.position); // 复制主摄像机的位置
  }

  private setupControls() {
    // 设置控制器的方法
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); // 创建一个轨道控制器
    this.controls.enableDamping = true; // 启用阻尼效果
    this.controls.minDistance = 10; // 设置最小距离
    this.controls.maxDistance = 500; // 设置最大距离
  }

  private addLighting() {
    // 添加光源的方法
    const ambientLight = new THREE.AmbientLight(0x404040, 1); // 创建一个环境光
    this.scene.add(ambientLight); // 将环境光添加到场景中

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 创建一个方向光
    directionalLight.position.set(50, 50, 50).normalize(); // 设置方向光的位置并归一化
    this.scene.add(directionalLight); // 将方向光添加到场景中
  }

  private setupHilbertCurve() {
    // 设置Hilbert曲线的方法
    const { positions, colors } = this.generateHilbertCurve(); // 生成Hilbert曲线的顶点和颜色

    const geometry = new LineGeometry(); // 创建一个线几何体
    geometry.setPositions(positions); // 设置几何体的顶点
    geometry.setColors(colors); // 设置几何体的颜色

    this.matLine = new LineMaterial({
      // 创建一个线材质
      color: 0xffffff, // 设置颜色
      linewidth: 30, // 设置线宽
      vertexColors: true, // 启用顶点颜色
      dashed: false, // 禁用虚线
      alphaToCoverage: true, // 启用alpha覆盖
    });

    this.line = new Line2(geometry, this.matLine); // 创建一个线对象
    this.line.computeLineDistances(); // 计算线的距离
    this.line.scale.set(1, 1, 1); // 设置线的缩放
    this.scene.add(this.line); // 将线添加到场景中
  }

  private setupEventListeners() {
    // 设置事件监听器的方法
    window.addEventListener("resize", this.onWindowResize.bind(this)); // 监听窗口大小变化事件
    this.onWindowResize(); // 调整窗口大小
  }

  private setupStats() {
    // 设置性能统计的方法
    this.stats = new Stats(); // 创建一个性能统计对象
    this.gpuPanel = new GPUStatsPanel(this.renderer.getContext()); // 创建一个GPU性能统计面板
    this.stats.addPanel(this.gpuPanel); // 将GPU性能统计面板添加到性能统计对象中
    this.stats.showPanel(0); // 显示性能统计面板
  }

  private generateHilbertCurve() {
    // 生成Hilbert曲线的方法
    const positions = []; // 初始化顶点数组
    const colors = []; // 初始化颜色数组

    const points = GeometryUtils.hilbert3D(new THREE.Vector3(0, 0, 0)); // 生成Hilbert曲线的顶点
    const spline = new THREE.CatmullRomCurve3(points); // 创建一个Catmull-Rom样条曲线
    const divisions = Math.round(12 * points.length); // 计算分割数
    const point = new THREE.Vector3(); // 初始化顶点
    const color = new THREE.Color(); // 初始化颜色

    for (let i = 0; i < divisions; i++) {
      // 遍历所有分割点
      const t = i / divisions; // 计算参数t
      spline.getPoint(t, point); // 获取曲线上的点
      positions.push(point.x, point.y, point.z); // 将点添加到顶点数组中
      color.setHSL(t, 10.0, 0.5, THREE.SRGBColorSpace); // 设置颜色
      colors.push(color.r, color.g, color.b); // 将颜色添加到颜色数组中
    }

    return { positions, colors }; // 返回顶点和颜色
  }

  private onWindowResize() {
    // 窗口大小变化时调用的方法
    this.camera.aspect = window.innerWidth / window.innerHeight; // 更新主摄像机的纵横比
    this.camera.updateProjectionMatrix(); // 更新主摄像机的投影矩阵
    this.renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器的大小

    this.insetWidth = window.innerHeight / 4; // 计算插图宽度
    this.insetHeight = window.innerHeight / 4; // 计算插图高度

    this.camera2.aspect = this.insetWidth / this.insetHeight; // 更新辅助摄像机的纵横比
    this.camera2.updateProjectionMatrix(); // 更新辅助摄像机的投影矩阵
  }

  private animate() {
    // 动画循环方法
    this.renderer.setClearColor(0x000000, 0); // 设置渲染器的背景颜色
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight); // 设置渲染器的视口
    this.controls.update(); // 更新控制器

    this.gpuPanel.startQuery(); // 开始GPU性能查询
    this.renderer.render(this.scene, this.camera); // 渲染场景
    this.gpuPanel.endQuery(); // 结束GPU性能查询

    this.renderer.setClearColor(0x222222, 1); // 设置渲染器的背景颜色
    this.renderer.clearDepth(); // 清除深度缓冲区
    this.renderer.setScissorTest(true); // 启用剪刀测试
    this.renderer.setScissor(20, 20, this.insetWidth, this.insetHeight); // 设置剪刀区域
    this.renderer.setViewport(20, 20, this.insetWidth, this.insetHeight); // 设置视口

    this.camera2.position.copy(this.camera.position); // 复制主摄像机的位置
    this.camera2.quaternion.copy(this.camera.quaternion); // 复制主摄像机的旋转

    this.renderer.render(this.scene, this.camera2); // 渲染场景
    this.renderer.setScissorTest(false); // 禁用剪刀测试

    this.stats.update(); // 更新性能统计
  }
}
