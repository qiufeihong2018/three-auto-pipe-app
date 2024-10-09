import * as THREE from 'three'; // 导入 three.js 库
import { initRenderer, renderer, labelRenderer } from './renderer'; // 从 renderer 模块导入初始化渲染器函数、渲染器和标签渲染器
import { initCameraAndControls, camera, controls, look } from './camera'; // 从 camera 模块导入初始化相机和控制器函数、相机、控制器和 look 函数
import { addLights } from './lights'; // 从 lights 模块导入添加灯光函数
import { createPanel } from './panel'; // 从 panel 模块导入创建面板函数
import { createChart } from './chart'; // 从 chart 模块导入创建图表函数
import { createLine } from './line'; // 从 line 模块导入创建线条函数
import { initPipes, pipes, clearPipes } from './pipes'; // 从 pipes 模块导入初始化管道函数和管道数组
import { updateTexture } from './textures'; // 从 textures 模块导入更新纹理函数
import { clearGrid } from './node'; // 从 node 模块导入清除网格函数
import { initGui } from './gui'; // 从 gui 模块导入初始化 GUI 函数
import { InitOptions } from '../types'; // 导入初始化选项接口

let scene: THREE.Scene; // 声明一个场景变量
let clearing = false; // 声明一个清除标志变量

class RendererManager {
  static init(canvas: HTMLCanvasElement) {
    initRenderer(canvas); // 初始化渲染器
  }

  static render() {
    renderer.render(scene, camera); // 渲染场景
    labelRenderer.render(scene, camera); // 渲染标签
  }

  static clear() {
    renderer.clear(); // 清除渲染器
  }

  static resize() {
    renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器大小
    labelRenderer.setSize(window.innerWidth, window.innerHeight); // 更新标签渲染器大小
  }
}

class CameraManager {
  static init() {
    initCameraAndControls(); // 初始化相机和控制器
  }

  static update() {
    controls.update(); // 更新控制器
  }

  static resize() {
    camera.aspect = window.innerWidth / window.innerHeight; // 更新相机的纵横比
    camera.updateProjectionMatrix(); // 更新相机的投影矩阵
  }
}

class LightManager {
  static addLights() {
    addLights(scene); // 添加灯光到场景中
  }
}

class PanelManager {
  static createPanel() {
    const panelLabel = createPanel(scene); // 创建面板并添加到场景中
    createChart(panelLabel.element as HTMLDivElement); // 创建图表并添加到面板中
    return panelLabel;
  }
}

class PipeManager {
  static initPipes(options: InitOptions) {
    initPipes(scene, options); // 初始化管道
  }

  static clearPipes() {
    pipes.forEach((pipe) => scene.remove(pipe.object3d)); // 从场景中移除所有管道
    clearPipes(); // 清空管道数组
  }

  static updatePipes() {
    pipes.forEach((pipe) => pipe.updateTextureOffset(0.01)); // 更新每个管道的纹理偏移
  }
}

export function createScene(): void { // 导出创建场景函数
  const canvasWebGL = document.getElementById('canvas-webgl') as HTMLCanvasElement; // 获取 WebGL 画布元素

  RendererManager.init(canvasWebGL); // 初始化渲染器
  scene = new THREE.Scene(); // 创建一个新的场景
  CameraManager.init(); // 初始化相机和控制器
  LightManager.addLights(); // 添加灯光到场景中

  const panelLabel = PanelManager.createPanel(); // 创建面板并添加到场景中
  const line = createLine(scene); // 创建线条并添加到场景中

  window.addEventListener('resize', onWindowResize, false); // 监听窗口大小变化事件

  function animate(): void { // 定义动画函数
    requestAnimationFrame(animate); // 请求下一帧动画

    const panelPosition = new THREE.Vector3(); // 创建一个新的三维向量用于存储面板位置
    panelLabel.getWorldPosition(panelPosition); // 获取面板的世界位置

    const pipePosition = new THREE.Vector3(); // 创建一个新的三维向量用于存储管道位置

    line.geometry.setFromPoints([panelPosition, pipePosition]); // 设置线条的几何点

    CameraManager.update(); // 更新控制器
    RendererManager.render(); // 渲染场景和标签
  }

  animate(); // 开始动画
}

export function reset(): void { // 导出重置函数
  RendererManager.clear(); // 清除渲染器
  PipeManager.clearPipes(); // 清空管道数组
  clearGrid(); // 清除网格
  look(); // 调用 look 函数
  clearing = false; // 重置清除标志
}

export function animate(options: InitOptions): void { // 导出动画函数
  requestAnimationFrame(() => animate(options)); // 请求下一帧动画
  CameraManager.update(); // 更新控制器
  if (pipes.length === 0) { // 如果管道数组为空
    PipeManager.initPipes(options); // 初始化管道
  }

  if (!clearing) { // 如果不在清除状态
    PipeManager.updatePipes(); // 更新每个管道的纹理偏移
    RendererManager.render(); // 渲染场景和标签
  }
}

export function init(options: InitOptions): { scene: THREE.Scene; renderer: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera } { // 导出初始化函数
  createScene(); // 创建场景
  look(); // 调用 look 函数
  updateTexture(options); // 更新纹理
  animate(options); // 开始动画
  initGui({ // 初始化 GUI
    printPipesInfo: () => { // 打印管道信息
      console.log('pipes:', pipes); // 打印管道数组到控制台
    },
  });
  return { // 返回场景、渲染器和相机
    scene,
    renderer,
    camera,
  };
}

function onWindowResize(): void { // 定义窗口大小变化处理函数
  CameraManager.resize(); // 更新相机的纵横比和投影矩阵
  RendererManager.resize(); // 更新渲染器和标签渲染器大小
}