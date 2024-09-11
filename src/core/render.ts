import * as THREE from "three"; // 导入 Three.js 库
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // 导入轨道控制器

import { textures } from "./textures"; // 导入纹理
import { chance, random } from "./util"; // 导入工具函数
import { clearGrid } from "./node"; // 导入清除网格函数
import { Pipe } from "./pipe"; // 导入管道类
import { initGui } from "./gui"; // 导入 GUI 初始化函数
import defautPipesData from "../assets/data.json"; // 导入默认管道数据

const JOINTS_ELBOW = "elbow"; // 定义肘形关节常量
const JOINTS_BALL = "ball"; // 定义球形关节常量
const JOINTS_MIXED = "mixed"; // 定义混合关节常量
const JOINTS_CYCLE = "cycle"; // 定义循环关节常量

const jointsCycleArray = [JOINTS_ELBOW, JOINTS_BALL, JOINTS_MIXED]; // 定义关节循环数组
let jointsCycleIndex = 0; // 定义关节循环索引
let autoRenderPipe = false; // 定义自动渲染管道标志

let pipes: any[] = []; // 定义管道数组
let renderer; // 渲染器对象
let scene; // 3D 场景对象
let camera; // 相机对象
let controls; // 相机控件

const options = {
  multiple: true, // 是否生成多个管道
  texturePath: null, // 纹理路径
  joints: "elbow", // 关节类型
  interval: [16, 24], // 渐隐效果的时间区间
};

let clearing = false; // 是否正在清除场景

/**
 * 清除场景
 */
function clear() {
  if (clearing) {
    return; // 如果正在清除，则返回
  }
  clearing = true; // 设置清除标志
  reset(); // 重置场景
}

/**
 * 重置场景
 * 1. 清除渲染对象
 * 2. 清除场景中的管道
 * 3. 清空管道数据
 * 4. 清空节点
 * 5. 初始化视角
 * 6. 设置清除状态为 false
 */
export function reset() {
  renderer.clear(); // 清除渲染器
  for (let i = 0; i < pipes.length; i++) {
    scene.remove(pipes[i].object3d); // 从场景中移除管道
  }
  pipes = []; // 清空管道数组
  clearGrid(); // 清空节点
  look(); // 初始化视角
  clearing = false; // 设置清除标志为 false
}

/**
 * 创建场景
 */
function createScene() {
  const canvasWebGL = document.getElementById(
    "canvas-webgl"
  ) as HTMLCanvasElement; // 获取 canvas 元素
  renderer = new THREE.WebGLRenderer({
    alpha: true, // 启用透明度
    antialias: true, // 启用抗锯齿
    canvas: canvasWebGL, // 使用指定的 canvas
  });
  renderer.setSize(window.innerWidth, window.innerHeight); // 设置渲染器大小
  scene = new THREE.Scene(); // 创建场景
  camera = new THREE.PerspectiveCamera(
    45, // 视角
    window.innerWidth / window.innerHeight, // 宽高比
    1, // 近剪切面
    100000 // 远剪切面
  );

  /**
   * 旋转：拖动鼠标左键
   * 缩放：滚动鼠标中键
   * 平移：拖动鼠标右键
   */
  controls = new OrbitControls(camera, renderer.domElement); // 创建轨道控制器
  controls.enabled = true; // 启用控制器

  // 场景的光线
  const ambientLight = new THREE.AmbientLight(0x111111); // 创建环境光
  scene.add(ambientLight); // 添加环境光到场景
  const directionalLightL = new THREE.DirectionalLight(0xffffff, 0.9); // 创建定向光
  directionalLightL.position.set(-1.2, 1.5, 0.5); // 设置定向光位置
  scene.add(directionalLightL); // 添加定向光到场景
}

/**
 * 初始化管道
 */
function initPipes() {
  const pipeOptions = {
    jointType: options.joints, // 关节类型
    teapotChance: 1 / 200, // 茶壶出现的概率
    ballJointChance: 1, // 球形关节出现的概率
    texturePath: options.texturePath, // 纹理路径
  };

  defautPipesData.forEach((pipeData) => {
    const pipe = new Pipe(scene, pipeOptions); // 创建管道
    pipe.positions = pipeData.map((node) => {
      return new THREE.Vector3(node.x, node.y, node.z); // 设置管道位置
    });
    pipe.generate(); // 生成管道
    pipes.push(pipe); // 将管道添加到数组
  });
}

/**
 * 创建管道（初始化管道配置）
 */
function createPipes() {
  let jointType = options.joints; // 获取关节类型
  if (options.joints === JOINTS_CYCLE) {
    jointType = jointsCycleArray[jointsCycleIndex++]; // 循环关节类型
  }
  const pipeOptions: any = {
    jointType, // 关节类型
    teapotChance: 1 / 200, // 茶壶出现的概率
    ballJointChance:
      jointType === JOINTS_BALL ? 1 : jointType === JOINTS_MIXED ? 1 / 3 : 0, // 球形关节出现的概率
    texturePath: options.texturePath, // 纹理路径
  };
  // 5% 的概率生成茶壶
  if (chance(1 / 20)) {
    pipeOptions.teapotChance = 1 / 20; // 设置茶壶出现的概率
    pipeOptions.texturePath = "images/textures/candycane.png"; // 设置纹理路径

    if (!textures[pipeOptions.texturePath]) {
      const textureLoader = new THREE.TextureLoader(); // 创建纹理加载器
      const texture = textureLoader.load(pipeOptions.texturePath); // 加载纹理
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 设置纹理重复
      texture.repeat.set(2, 2); // 设置纹理重复次数
      textures[pipeOptions.texturePath] = texture; // 将纹理添加到纹理对象
    }
  }
  // 构建管道（从头到尾属于一个管道，而非一节一节）
  for (let i = 0; i < 1 + +options.multiple * (1 + +chance(1 / 10)); i++) {
    pipes.push(new Pipe(scene, pipeOptions)); // 创建并添加管道
  }
}

/**
 * 渲染管道
 */
function renderPipes() {
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].update(); // 更新管道
  }
}

/**
 * 更新材质
 */
function updateTexture() {
  if (options.texturePath && !textures[options.texturePath]) {
    const textureLoader = new THREE.TextureLoader(); // 创建纹理加载器
    const texture = textureLoader.load(options.texturePath); // 加载纹理
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 设置纹理重复
    texture.repeat.set(2, 2); // 设置纹理重复次数
    textures[options.texturePath] = texture; // 将纹理添加到纹理对象
  }
}

/**
 * 动画循环
 */
function animate() {
  controls.update(); // 更新控制器
  if (!autoRenderPipe) {
    if (pipes.length === 0) {
      initPipes(); // 初始化管道
    }
  } else {
    // 执行管道的更新方法，每一帧都在运算（两个管道同时在绘制）
    if (pipes.length === 0) {
      createPipes(); // 创建管道
    } else {
      renderPipes(); // 渲染管道
    }
  }

  if (!clearing) {
    renderer.render(scene, camera); // 渲染场景
  }
  requestAnimationFrame(animate); // 请求下一帧动画
}

// TODO: 随机视角
function randomLook() {
  // 随机视角 view
  const vector = new THREE.Vector3(14, 0, 0); // 定义向量
  const axis = new THREE.Vector3(random(-1, 1), random(-1, 1), random(-1, 1)); // 定义轴
  const angle = Math.PI / 2; // 定义角度
  const matrix = new THREE.Matrix4().makeRotationAxis(axis, angle); // 创建旋转矩阵

  vector.applyMatrix4(matrix); // 应用旋转矩阵
  camera.position.copy(vector); // 设置相机位置

  const center = new THREE.Vector3(0, 0, 0); // 定义中心点
  camera.lookAt(center); // 设置相机朝向中心点
  controls.update(); // 更新控制器
}

/**
 * 初始化视角
 */
function look() {
  camera.position.set(25, 25, 25); // 设置相机位置
  const center = new THREE.Vector3(0, 0, 0); // 定义中心点
  camera.lookAt(center); // 设置相机朝向中心点
  controls.update(); // 更新控制器
}

/**
 * 初始化函数
 * 1. 创建场景
 * 2. 初始化视角
 * 3. 更新材质
 * 4. 开始动画循环
 * 5. 初始化 GUI
 */
export function init() {
  createScene(); // 创建场景
  look(); // 初始化视角
  updateTexture(); // 更新材质
  animate(); // 开始动画循环
  initGui({
    clear: () => {
      autoRenderPipe = true; // 设置自动渲染管道标志
      clear(); // 清除场景
      window.getSelection()?.removeAllRanges(); // 清除选择范围
      document.activeElement?.blur(); // 失去焦点
    },
    // 切换关节类型
    setJointType: (val) => {
      options.joints = val; // 设置关节类型
    },
    printPipesInfo: () => {
      console.log("pipes:", pipes); // 打印管道信息
    },
  });
  return {
    scene, // 返回场景
    renderer, // 返回渲染器
    camera, // 返回相机
  };
}
