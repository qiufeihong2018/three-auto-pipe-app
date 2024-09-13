import * as THREE from "three"; // 导入Three.js库
import { selectRandom, randomIntegerVector3WithinBox } from "./util"; // 导入工具函数
import { setAt } from "./node"; // 导入节点设置函数
import Stats from "three/addons/libs/stats.module.js"; // 导入性能统计模块
import { GPUStatsPanel } from "three/addons/utils/GPUStatsPanel.js"; // 导入GPU统计面板
import { GUI } from "three/addons/libs/lil-gui.module.min.js"; // 导入GUI库
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // 导入轨道控制器
import { Line2 } from "three/addons/lines/Line2.js"; // 导入Line2类
import { LineMaterial } from "three/addons/lines/LineMaterial.js"; // 导入LineMaterial类
import { LineGeometry } from "three/addons/lines/LineGeometry.js"; // 导入LineGeometry类
import * as GeometryUtils from "three/addons/utils/GeometryUtils.js"; // 导入几何工具

const materialColor = ["#e14848"]; // 定义材质颜色
const gridBounds = new THREE.Box3( // 定义网格边界
  new THREE.Vector3(-10, -10, -10), // 最小边界
  new THREE.Vector3(10, 10, 10) // 最大边界
);

const pipeRadius = 0.6; // 定义管道半径

export class Pipe {
  public currentPosition: THREE.Vector3; // 当前管道位置
  public positions: THREE.Vector3[]; // 管道位置数组
  public object3d: THREE.Object3D; // 管道3D对象
  public material: THREE.Material; // 管道材质
  public options: any; // 管道选项
  private texture: THREE.Texture | null = null; // 管道纹理
  private scene: THREE.Scene; // Three.js场景
  private renderer: THREE.WebGLRenderer; // Three.js渲染器
  private camera: THREE.PerspectiveCamera; // 主相机
  private camera2: THREE.PerspectiveCamera; // 第二相机
  private controls: OrbitControls; // 轨道控制器
  private stats: Stats; // 性能统计
  private gpuPanel: GPUStatsPanel; // GPU统计面板
  private gui: GUI; // GUI界面
  private insetWidth: number; // 插图宽度
  private insetHeight: number; // 插图高度
  private line: Line2; // Line2对象
  private line1: THREE.Line; // Line对象
  private matLine: LineMaterial; // Line材质
  private matLineBasic: THREE.LineBasicMaterial; // 基本Line材质
  private matLineDashed: THREE.LineDashedMaterial; // 虚线Line材质

  constructor(scene: THREE.Scene, options: any) {
    this.options = options; // 初始化选项
    this.currentPosition = randomIntegerVector3WithinBox(gridBounds); // 随机生成初始位置
    this.positions = [this.currentPosition]; // 初始化位置数组
    this.object3d = new THREE.Object3D(); // 创建3D对象
    scene.add(this.object3d); // 将3D对象添加到场景中

    this.material = this.createMaterial(options.texturePath); // 创建材质

    setAt(this.currentPosition, this); // 设置当前节点位置

    this.scene = scene; // 初始化场景
    this.init(); // 初始化Three.js
  }

  private createMaterial(texturePath: string): THREE.Material {
    const color = selectRandom(materialColor); // 随机选择颜色
    const emissive = new THREE.Color(color).multiplyScalar(0.3); // 设置发光颜色

    this.texture = new THREE.TextureLoader().load(texturePath); // 加载纹理
    this.texture.wrapS = THREE.RepeatWrapping; // 设置纹理水平重复
    this.texture.wrapT = THREE.RepeatWrapping; // 设置纹理垂直重复
    this.texture.repeat.set(3, 5); // 设置纹理重复次数

    return new THREE.MeshPhongMaterial({
      // 返回Phong材质
      map: this.texture, // 纹理贴图
      specular: 0xa9fcff, // 镜面反射颜色
      color: color, // 材质颜色
      emissive: emissive, // 发光颜色
      emissiveIntensity: 0.5, // 发光强度
      shininess: 100, // 光泽度
      transparent: true, // 透明
      opacity: 0.5, // 不透明度
    });
  }

  public generatePipeLine(
    fromPoint: THREE.Vector3, // 起点
    toPoint: THREE.Vector3, // 终点
    material: THREE.Material // 材质
  ) {
    const deltaVector = new THREE.Vector3().subVectors(toPoint, fromPoint); // 计算向量差
    const arrow = new THREE.ArrowHelper(
      deltaVector.clone().normalize(),
      fromPoint
    ); // 创建箭头辅助对象
    const geometry = new THREE.CylinderGeometry( // 创建圆柱几何体
      pipeRadius, // 顶部半径
      pipeRadius, // 底部半径
      deltaVector.length(), // 高度
      10, // 横截面分段数
      4, // 高度分段数
      true // 是否开启端盖
    );

    const mesh = new THREE.Mesh(geometry, material); // 创建网格对象
    mesh.rotation.setFromQuaternion(arrow.quaternion); // 设置旋转
    mesh.position.addVectors(fromPoint, deltaVector.multiplyScalar(0.5)); // 设置位置
    mesh.updateMatrix(); // 更新矩阵
    this.object3d.add(mesh); // 将网格对象添加到3D对象中
  }

  public generatePipeJoint(jointType: string, position: THREE.Vector3) {
    switch (
      jointType // 根据接头类型生成接头
    ) {
      case "elbow":
        this.makeElbowJoint(position); // 生成弯头接头
        break;
    }
  }

  private makeElbowJoint(position: THREE.Vector3) {
    const elball = new THREE.Mesh( // 创建球体几何体
      new THREE.SphereGeometry(pipeRadius, 8, 8), // 球体半径和分段数
      this.material // 材质
    );
    elball.position.copy(position); // 设置位置
    this.object3d.add(elball); // 将球体添加到3D对象中
  }

  public generate() {
    let currentVector = new THREE.Vector3(); // 当前向量
    for (let i = 0; i < this.positions.length - 1; i++) {
      // 遍历位置数组
      const currentNode = this.positions[i]; // 当前节点
      const nextNode = this.positions[i + 1]; // 下一个节点
      if (currentNode && nextNode) {
        // 如果节点存在
        const nextVector = new THREE.Vector3().subVectors(
          currentNode,
          nextNode
        ); // 计算向量差
        if (!nextVector.equals(currentVector)) {
          // 如果向量不同
          this.generatePipeJoint(this.options.jointType, currentNode); // 生成接头
        }
        this.generatePipeLine(currentNode, nextNode, this.material); // 生成管道线段
        currentVector = nextVector; // 更新当前向量
      }
    }
  }

  public updateTextureOffset(delta: number) {
    if (this.texture) {
      // 如果纹理存在
      this.texture.offset.y += delta; // 更新纹理偏移
    }
  }
  private init() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true }); // 创建WebGL渲染器并启用抗锯齿
    this.renderer.setPixelRatio(window.devicePixelRatio); // 设置设备像素比
    this.renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器大小为窗口大小
    this.renderer.setClearColor(0x000000, 0.0); // 设置渲染器背景颜色为黑色，透明度为0
    this.renderer.setAnimationLoop(this.animate.bind(this)); // 设置动画循环

    this.camera = new THREE.PerspectiveCamera( // 创建透视相机
      40, // 视角
      window.innerWidth / window.innerHeight, // 宽高比
      1, // 近剪切面
      1000 // 远剪切面
    );
    this.camera.position.set(-40, 0, 60); // 设置相机位置

    this.camera2 = new THREE.PerspectiveCamera(40, 1, 1, 1000); // 创建第二个透视相机
    this.camera2.position.copy(this.camera.position); // 将第二个相机的位置设置为与第一个相机相同

    this.controls = new OrbitControls(this.camera, this.renderer.domElement); // 创建轨道控制器
    this.controls.enableDamping = true; // 启用阻尼效果
    this.controls.minDistance = 10; // 设置最小距离
    this.controls.maxDistance = 500; // 设置最大距离

    this.addLighting(); // 添加光照

    const { positions, colors } = this.generateHilbertCurve(); // 生成Hilbert曲线的顶点和颜色

    const geometry = new LineGeometry(); // 创建线条几何体
    geometry.setPositions(positions); // 设置几何体的顶点位置
    geometry.setColors(colors); // 设置几何体的顶点颜色

    this.matLine = new LineMaterial({ // 创建线条材质
      color: 0xffffff, // 颜色
      linewidth: 5, // 线宽
      vertexColors: true, // 顶点颜色
      dashed: false, // 是否虚线
      alphaToCoverage: true, // 是否启用alpha覆盖
    });

    this.line = new Line2(geometry, this.matLine); // 创建Line2对象
    this.line.computeLineDistances(); // 计算线条距离
    this.line.scale.set(1, 1, 1); // 设置缩放
    this.scene.add(this.line); // 将线条添加到场景中

    const geo = new THREE.BufferGeometry(); // 创建缓冲几何体
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3) // 设置位置属性
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3)); // 设置颜色属性

    this.matLineBasic = new THREE.LineBasicMaterial({ vertexColors: true }); // 创建基本线条材质
    this.matLineDashed = new THREE.LineDashedMaterial({ // 创建虚线材质
      vertexColors: true, // 顶点颜色
      scale: 2, // 缩放
      dashSize: 1, // 虚线大小
      gapSize: 1, // 间隔大小
    });

    this.line1 = new THREE.Line(geo, this.matLineBasic); // 创建Line对象
    this.line1.computeLineDistances(); // 计算线条距离
    this.line1.visible = false; // 设置不可见
    this.scene.add(this.line1); // 将线条添加到场景中

    window.addEventListener("resize", this.onWindowResize.bind(this)); // 添加窗口大小改变事件监听器
    this.onWindowResize(); // 调用窗口大小改变处理函数

    this.stats = new Stats(); // 创建性能统计对象
    this.gpuPanel = new GPUStatsPanel(this.renderer.getContext()); // 创建GPU统计面板
    this.stats.addPanel(this.gpuPanel); // 添加GPU统计面板到性能统计对象
    this.stats.showPanel(0); // 显示第一个面板

    this.initGui(); // 初始化GUI
  }

  private addLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 1); // 创建环境光
    this.scene.add(ambientLight); // 将环境光添加到场景中

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 创建方向光
    directionalLight.position.set(50, 50, 50).normalize(); // 设置方向光位置并归一化
    this.scene.add(directionalLight); // 将方向光添加到场景中
  }

  private generateHilbertCurve() {
    const positions = []; // 定义位置数组
    const colors = []; // 定义颜色数组

    const points = GeometryUtils.hilbert3D( // 生成Hilbert曲线的顶点
      new THREE.Vector3(0, 0, 0), // 起点
      20.0, // 大小
      1, // 迭代次数
      0, 1, 2, 3, 4, 5, 6, 7 // 维度
    );

    const spline = new THREE.CatmullRomCurve3(points); // 创建Catmull-Rom样条曲线
    const divisions = Math.round(12 * points.length); // 计算分段数
    const point = new THREE.Vector3(); // 定义顶点
    const color = new THREE.Color(); // 定义颜色

    for (let i = 0, l = divisions; i < l; i++) { // 遍历分段数
      const t = i / l; // 计算参数t

      spline.getPoint(t, point); // 获取曲线上的点
      positions.push(point.x, point.y, point.z); // 将点的坐标添加到位置数组中

      color.setHSL(t, 1.0, 0.5, THREE.SRGBColorSpace); // 设置颜色
      colors.push(color.r, color.g, color.b); // 将颜色添加到颜色数组中
    }

    return { positions, colors }; // 返回位置和颜色数组
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight; // 更新相机宽高比
    this.camera.updateProjectionMatrix(); // 更新相机投影矩阵

    this.renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器大小

    this.insetWidth = window.innerHeight / 4; // 设置插图宽度
    this.insetHeight = window.innerHeight / 4; // 设置插图高度

    this.camera2.aspect = this.insetWidth / this.insetHeight; // 更新第二个相机宽高比
    this.camera2.updateProjectionMatrix(); // 更新第二个相机投影矩阵
  }

  private animate() {
    this.renderer.setClearColor(0x000000, 0); // 设置渲染器背景颜色为黑色，透明度为0
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight); // 设置视口大小

    this.controls.update(); // 更新控制器

    this.gpuPanel.startQuery(); // 开始GPU查询
    this.renderer.render(this.scene, this.camera); // 渲染场景
    this.gpuPanel.endQuery(); // 结束GPU查询

    this.renderer.setClearColor(0x222222, 1); // 设置渲染器背景颜色为灰色，透明度为1
    this.renderer.clearDepth(); // 清除深度缓冲区

    this.renderer.setScissorTest(true); // 启用裁剪测试
    this.renderer.setScissor(20, 20, this.insetWidth, this.insetHeight); // 设置裁剪区域
    this.renderer.setViewport(20, 20, this.insetWidth, this.insetHeight); // 设置视口大小

    this.camera2.position.copy(this.camera.position); // 将第二个相机的位置设置为与第一个相机相同
    this.camera2.quaternion.copy(this.camera.quaternion); // 将第二个相机的四元数设置为与第一个相机相同

    this.renderer.render(this.scene, this.camera2); // 渲染场景

    this.renderer.setScissorTest(false); // 禁用裁剪测试

    this.stats.update(); // 更新性能统计
  }

  private initGui() {
    this.gui = new GUI(); // 创建GUI

    const param = { // 定义参数对象
      "line type": 0, // 线条类型
      "world units": false, // 世界单位
      width: 5, // 线宽
      alphaToCoverage: true, // alpha覆盖
      dashed: false, // 虚线
      "dash scale": 1, // 虚线缩放
      "dash / gap": 1, // 虚线/间隔比
    };

    this.gui
      .add(param, "line type", { LineGeometry: 0, "gl.LINE": 1 }) // 添加线条类型选项
      .onChange((val) => { // 添加改变事件监听器
        this.line.visible = val === 0; // 设置Line2对象的可见性
        this.line1.visible = val === 1; // 设置Line对象的可见性
      });

    this.gui.add(param, "world units").onChange((val) => { // 添加世界单位选项
      this.matLine.worldUnits = val; // 设置Line材质的世界单位
      this.matLine.needsUpdate = true; // 标记材质需要更新
    });

    this.gui.add(param, "width", 1, 10).onChange((val) => { // 添加线宽选项
      this.matLine.linewidth = val; // 设置Line材质的线宽
    });

    this.gui.add(param, "alphaToCoverage").onChange((val) => { // 添加alpha覆盖选项
      this.matLine.alphaToCoverage = val; // 设置Line材质的alpha覆盖
    });

    this.gui.add(param, "dashed").onChange((val) => { // 添加虚线选项
      this.matLine.dashed = val; // 设置Line材质的虚线
      this.line1.material = val ? this.matLineDashed : this.matLineBasic; // 设置Line对象的材质
    });

    this.gui.add(param, "dash scale", 0.5, 2, 0.1).onChange((val) => { // 添加虚线缩放选项
      this.matLine.dashScale = val; // 设置Line材质的虚线缩放
      this.matLineDashed.scale = val; // 设置虚线材质的缩放
    });

    this.gui
      .add(param, "dash / gap", { "2 : 1": 0, "1 : 1": 1, "1 : 2": 2 }) // 添加虚线/间隔比选项
      .onChange((val) => { // 添加改变事件监听器
        switch (val) { // 根据选项值设置虚线和间隔大小
          case 0:
            this.matLine.dashSize = 2;
            this.matLine.gapSize = 1;
            this.matLineDashed.dashSize = 2;
            this.matLineDashed.gapSize = 1;
            break;
          case 1:
            this.matLine.dashSize = 1;
            this.matLine.gapSize = 1;
            this.matLineDashed.dashSize = 1;
            this.matLineDashed.gapSize = 1;
            break;
          case 2:
            this.matLine.dashSize = 1;
            this.matLine.gapSize = 2;
            this.matLineDashed.dashSize = 1;
            this.matLineDashed.gapSize = 2;
            break;
        }
      });
  }

  public getRendererDomElement() {
    return this.renderer.domElement; // 返回渲染器的DOM元素
  }
}