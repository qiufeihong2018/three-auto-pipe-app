import * as THREE from "three"; // 导入Three.js库
import { selectRandom } from "./util"; // 导入自定义的随机选择函数
import Stats from "three/addons/libs/stats.module.js"; // 导入性能统计库
import { GPUStatsPanel } from "three/addons/utils/GPUStatsPanel.js"; // 导入GPU性能统计面板
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // 导入轨道控制器
import { Line2 } from "three/addons/lines/Line2.js"; // 导入Line2类
import { LineMaterial } from "three/addons/lines/LineMaterial.js"; // 导入LineMaterial类
import { LineGeometry } from "three/addons/lines/LineGeometry.js"; // 导入LineGeometry类
import * as GeometryUtils from "three/addons/utils/GeometryUtils.js"; // 导入几何工具
import defautPipesData from "../assets/data.json"; // 导入默认管道数据

const materialColor = ["#e14848"]; // 定义材质颜色数组
const gridBounds = new THREE.Box3( // 定义网格边界
  new THREE.Vector3(-10, -10, -10),
  new THREE.Vector3(10, 10, 10)
);
const pipeRadius = 0.6; // 定义管道半径

export class Pipe {
  public positions: THREE.Vector3[]; // 管道位置数组
  public object3d: THREE.Object3D; // 管道的3D对象
  public material: THREE.Material; // 内层管道材质
  public outMaterial: THREE.Material; // 外层管道材质
  public options: any; // 配置选项

  private texture: THREE.Texture | null = null; // 纹理
  private scene: THREE.Scene; // 场景
  private renderer: THREE.WebGLRenderer; // 渲染器
  private camera: THREE.PerspectiveCamera; // 主相机
  private camera2: THREE.PerspectiveCamera; // 辅助相机
  private controls: OrbitControls; // 轨道控制器
  private stats: Stats; // 性能统计
  private gpuPanel: GPUStatsPanel; // GPU性能统计面板
  private insetWidth: number; // 插图宽度
  private insetHeight: number; // 插图高度
  private line: Line2; // 线条对象
  private matLine: LineMaterial; // 线条材质

  constructor(scene: THREE.Scene, options: any) {
    this.options = options; // 初始化配置选项
    this.object3d = new THREE.Object3D(); // 创建3D对象
    scene.add(this.object3d); // 将3D对象添加到场景中

    this.material = this.createMaterial(options.texturePath); // 创建内层管道材质
    this.outMaterial = this.createOutMaterial(); // 创建外层管道材质
    this.scene = scene; // 初始化场景
  }

  // 创建外层管道材质
  private createOutMaterial(): THREE.Material {
    const color = selectRandom("#fff"); // 随机选择颜色
    const emissive = new THREE.Color(color).multiplyScalar(0.3); // 设置发光颜色

    return new THREE.MeshPhongMaterial({
      specular: 0xa9fcff,
      color: "#fff",
      emissive: emissive,
      emissiveIntensity: 0.5,
      shininess: 100,
      transparent: true,
      opacity: 0.4, // 降低透明度
      side: THREE.DoubleSide,
      depthWrite: false, // 确保深度写入关闭
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

  // 生成管道
  public generatePipeLine(fromPoint: THREE.Vector3, toPoint: THREE.Vector3) {
    const deltaVector = new THREE.Vector3().subVectors(toPoint, fromPoint); // 计算两个点之间的向量
    const arrow = new THREE.ArrowHelper(
      deltaVector.clone().normalize(),
      fromPoint
    ); // 创建一个箭头辅助对象

    // 创建圆柱体
    const createCylinder = (radius: number, material: THREE.Material) => {
      const geometry = new THREE.CylinderGeometry(
        radius,
        radius,
        deltaVector.length(),
        10,
        4,
        true
      ); // 创建圆柱几何体
      const mesh = new THREE.Mesh(geometry, material); // 创建圆柱网格
      mesh.rotation.setFromQuaternion(arrow.quaternion); // 设置旋转
      mesh.position.addVectors(
        fromPoint,
        deltaVector.clone().multiplyScalar(0.5)
      ); // 设置位置
      mesh.updateMatrix(); // 更新矩阵
      this.object3d.add(mesh); // 将圆柱网格添加到3D对象中
    };

    createCylinder(pipeRadius, this.material); // 先创建内层管道
    createCylinder(pipeRadius + 0.2, this.outMaterial); // 再创建外层管道
  }

  // 生成管道接头
  public generatePipeJoint(jointType: string, position: THREE.Vector3) {
    if (jointType === "elbow") {
      this.makeElbowJoint(position); // 如果接头类型是弯头，则生成弯头接头
    }
  }

  // 生成弯头接头
  private makeElbowJoint(position: THREE.Vector3) {
    const elball = new THREE.Mesh(
      new THREE.SphereGeometry(pipeRadius, 8, 8),
      this.material
    ); // 创建内层弯头
    elball.position.copy(position); // 设置位置
    this.object3d.add(elball); // 将内层弯头添加到3D对象中
    const elballOut = new THREE.Mesh(
      new THREE.SphereGeometry(pipeRadius + 0.2, 8, 8),
      this.outMaterial
    ); // 创建外层弯头
    elballOut.position.copy(position); // 设置位置
    this.object3d.add(elballOut); // 将外层弯头添加到3D对象中
  }

  // 生成管道
  public generate() {
    let currentVector = new THREE.Vector3(); // 当前向量
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

  // 初始化
  private init() {
    this.setupRenderer(); // 设置渲染器
    this.setupCameras(); // 设置相机
    this.setupControls(); // 设置控制器
    this.addLighting(); // 添加光照
    this.setupHilbertCurve(); // 设置Hilbert曲线
    this.setupEventListeners(); // 设置事件监听器
    this.setupStats(); // 设置性能统计
  }

  // 设置渲染器
  private setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true }); // 创建WebGL渲染器
    this.renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比
    this.renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器大小
    this.renderer.setClearColor(0x000000, 0.0); // 设置背景颜色
    this.renderer.setAnimationLoop(this.animate.bind(this)); // 设置动画循环
  }

  // 设置相机
  private setupCameras() {
    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      1000
    ); // 创建主相机
    this.camera.position.set(-40, 0, 60); // 设置主相机位置

    this.camera2 = new THREE.PerspectiveCamera(40, 1, 1, 1000); // 创建辅助相机
    this.camera2.position.copy(this.camera.position); // 设置辅助相机位置
  }

  // 设置控制器
  private setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); // 创建轨道控制器
    this.controls.enableDamping = true; // 启用阻尼
    this.controls.minDistance = 10; // 设置最小距离
    this.controls.maxDistance = 500; // 设置最大距离
  }

  // 添加光照
  private addLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 1); // 创建环境光
    this.scene.add(ambientLight); // 将环境光添加到场景中

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 创建方向光
    directionalLight.position.set(50, 50, 50).normalize(); // 设置方向光位置
    this.scene.add(directionalLight); // 将方向光添加到场景中
  }

  // 设置Hilbert曲线
  private setupHilbertCurve() {
    const { positions, colors } = this.generateHilbertCurve(); // 生成Hilbert曲线的顶点和颜色

    const geometry = new LineGeometry(); // 创建线条几何体
    geometry.setPositions(positions); // 设置顶点位置
    geometry.setColors(colors); // 设置顶点颜色

    this.matLine = new LineMaterial({
      color: 0xffffff,
      linewidth: 30,
      vertexColors: true,
      dashed: false,
      alphaToCoverage: true,
    }); // 创建线条材质

    this.line = new Line2(geometry, this.matLine); // 创建线条对象
    this.line.computeLineDistances(); // 计算线条距离
    this.line.scale.set(1, 1, 1); // 设置线条缩放
    this.scene.add(this.line); // 将线条添加到场景中
  }

  // 设置事件监听器
  private setupEventListeners() {
    window.addEventListener("resize", this.onWindowResize.bind(this)); // 监听窗口大小变化事件
    this.onWindowResize(); // 初始化窗口大小
  }

  // 设置性能统计
  private setupStats() {
    this.stats = new Stats(); // 创建性能统计对象
    this.gpuPanel = new GPUStatsPanel(this.renderer.getContext()); // 创建GPU性能统计面板
    this.stats.addPanel(this.gpuPanel); // 添加GPU性能统计面板
    this.stats.showPanel(0); // 显示性能统计面板
  }

  // 生成Hilbert曲线
  private generateHilbertCurve() {
    const positions = []; // 顶点位置数组
    const colors = []; // 顶点颜色数组

    const points = GeometryUtils.hilbert3D(new THREE.Vector3(0, 0, 0)); // 生成Hilbert曲线的顶点
    const spline = new THREE.CatmullRomCurve3(points); // 创建样条曲线
    const divisions = Math.round(12 * points.length); // 计算分段数
    const point = new THREE.Vector3(); // 创建顶点对象
    const color = new THREE.Color(); // 创建颜色对象

    for (let i = 0; i < divisions; i++) {
      const t = i / divisions; // 计算参数t
      spline.getPoint(t, point); // 获取曲线上的点
      positions.push(point.x, point.y, point.z); // 将点的位置添加到数组中
      color.setHSL(t, 10.0, 0.5, THREE.SRGBColorSpace); // 设置颜色
      colors.push(color.r, color.g, color.b); // 将颜色添加到数组中
    }

    return { positions, colors }; // 返回顶点位置和颜色
  }

  // 窗口大小变化事件处理函数
  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight; // 更新主相机的纵横比
    this.camera.updateProjectionMatrix(); // 更新主相机的投影矩阵
    this.renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器的大小

    this.insetWidth = window.innerHeight / 4; // 设置插图宽度
    this.insetHeight = window.innerHeight / 4; // 设置插图高度

    this.camera2.aspect = this.insetWidth / this.insetHeight; // 更新辅助相机的纵横比
    this.camera2.updateProjectionMatrix(); // 更新辅助相机的投影矩阵
  }

  // 动画循环
  private animate() {
    this.renderer.setClearColor(0x000000, 0); // 设置背景颜色
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight); // 设置视口
    this.controls.update(); // 更新控制器

    this.gpuPanel.startQuery(); // 开始GPU性能查询
    this.renderer.render(this.scene, this.camera); // 渲染场景
    this.gpuPanel.endQuery(); // 结束GPU性能查询

    this.renderer.setClearColor(0x222222, 1); // 设置背景颜色
    this.renderer.clearDepth(); // 清除深度缓冲区
    this.renderer.setScissorTest(true); // 启用裁剪测试
    this.renderer.setScissor(20, 20, this.insetWidth, this.insetHeight); // 设置裁剪区域
    this.renderer.setViewport(20, 20, this.insetWidth, this.insetHeight); // 设置视口

    this.camera2.position.copy(this.camera.position); // 更新辅助相机的位置
    this.camera2.quaternion.copy(this.camera.quaternion); // 更新辅助相机的旋转

    this.renderer.render(this.scene, this.camera2); // 渲染场景
    this.renderer.setScissorTest(false); // 禁用裁剪测试

    this.stats.update(); // 更新性能统计
  }
}