import * as THREE from "three"; // 导入 Three.js 库
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // 导入轨道控制器
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js"; // 导入 CSS2DRenderer 和 CSS2DObject
import { Chart } from "@antv/g2"; // 导入 AntV G2 库

import { textures } from "./textures"; // 导入纹理
import { clearGrid } from "./node"; // 导入清除网格函数
import { Pipe } from "./pipe"; // 导入管道类
import { initGui } from "./gui"; // 导入 GUI 初始化函数
import defautPipesData from "../assets/data.json"; // 导入默认管道数据

let pipes: Pipe[] = []; // 定义管道数组
let renderer: THREE.WebGLRenderer; // 渲染器对象
let labelRenderer: CSS2DRenderer; // CSS2D渲染器对象
let scene: THREE.Scene; // 3D 场景对象
let camera: THREE.PerspectiveCamera; // 相机对象
let controls: OrbitControls; // 相机控件

const options = {
  multiple: true, // 是否生成多个管道
  texturePath: "public/texture/arrow.png", // 纹理路径
  joints: "elbow", // 关节类型
};

let clearing = false; // 是否正在清除场景

/**
 * 重置场景
 */
export function reset() {
  renderer.clear(); // 清除渲染器
  pipes.forEach((pipe) => scene.remove(pipe.object3d)); // 从场景中移除管道
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

  // 初始化 CSS2DRenderer
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  document.body.appendChild(labelRenderer.domElement);

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
    10, // 近剪切面
    100000 // 远剪切面
  );

  controls = new OrbitControls(camera, labelRenderer.domElement); // 创建轨道控制器
  controls.enableDamping = true; // 启用阻尼效果
  controls.dampingFactor = 0.25; // 阻尼系数
  controls.screenSpacePanning = false; // 禁用屏幕空间平移
  controls.minDistance = 1; // 最小距离
  controls.maxDistance = 500; // 最大距离
  // 场景的光线
  const ambientLight = new THREE.AmbientLight(0x111111); // 创建环境光
  scene.add(ambientLight); // 添加环境光到场景
  const directionalLightL = new THREE.DirectionalLight(0xffffff, 2); // 创建定向光
  directionalLightL.position.set(1.2, 1.5, 5); // 设置定向光位置
  scene.add(directionalLightL); // 添加定向光到场景

  // 创建面板
  const panelDiv = document.createElement("div");
  panelDiv.className = "label";
  panelDiv.style.backgroundColor = "#fff";
  panelDiv.style.padding = "5px";
  panelDiv.style.opacity = "0.7";
  panelDiv.style.width = "400px";
  panelDiv.style.height = "200px";
  panelDiv.style.borderRadius = "10px";
  panelDiv.style.pointerEvents = "none"; // 确保面板不会阻止鼠标事件传递

  const panelLabel = new CSS2DObject(panelDiv);
  panelLabel.position.set(-10, 4, -4); // 根据需要调整位置
  scene.add(panelLabel);

  // 创建AntV报表
  fetch(
    "https://gw.alipayobjects.com/os/bmw-prod/fbe4a8c1-ce04-4ba3-912a-0b26d6965333.json"
  )
    .then((res) => res.json())
    .then((data) => {
      const chart = new Chart({
        container: panelDiv,
        width: 400,
        height: 200,
      });

      const keyframe = chart
        .timingKeyframe()
        .attr("direction", "alternate")
        .attr("iterationCount", 4);

      keyframe
        .interval()
        .data(data)
        .transform({ type: "groupX", y: "mean" })
        .encode("x", "gender")
        .encode("y", "weight")
        .encode("color", "gender")
        .encode("key", "gender");

      keyframe
        .point()
        .data(data)
        .encode("x", "height")
        .encode("y", "weight")
        .encode("color", "gender")
        .encode("groupKey", "gender")
        .encode("shape", "point");

      chart.render();
    });

  // 创建连接面板和管道的线
  const lineMaterial = new THREE.LineBasicMaterial({
    color: "#fff",
    transparent: true,
    opacity: 0.7, // 设置线的透明度
    linewidth: 5, // Corrected spelling
    linecap: "round", // 设置线末端样式为圆角
  });
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(), // 起点（将更新）
    new THREE.Vector3(), // 终点（将更新）
  ]);
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);

  // 监听窗口大小变化
  window.addEventListener("resize", onWindowResize, false);

  // 动画循环
  function animate() {
    requestAnimationFrame(animate);

    // 更新线的起点和终点
    const panelPosition = new THREE.Vector3();
    panelLabel.getWorldPosition(panelPosition);

    const pipePosition = new THREE.Vector3();

    line.geometry.setFromPoints([panelPosition, pipePosition]);

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  animate();
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
    pipe.positions = pipeData.map(
      (node) => new THREE.Vector3(node.x, node.y, node.z)
    ); // 设置管道位置
    pipe.generate(); // 生成管道
    pipes.push(pipe); // 将管道添加到数组
  });
}

/**
 * 更新材质
 */
function updateTexture() {
  if (options.texturePath && !textures[options.texturePath]) {
    const textureLoader = new THREE.TextureLoader(); // 创建纹理加载器
    const texture = textureLoader.load(options.texturePath); // 加载纹理

    // 设置纹理重复模式
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    // 设置纹理重复次数，增加重复次数以缩小纹理
    texture.repeat.set(10, 10); // 根据需要调整重复次数

    // 调整纹理的偏移量和旋转，确保方向正确
    texture.offset.set(0, 0.5); // 根据需要调整偏移量
    texture.center.set(0.5, 0.5); // 设置旋转中心为纹理的中心
    texture.rotation = Math.PI; // 确保方向正确

    textures[options.texturePath] = texture; // 将纹理添加到纹理对象
  }
}

/**
 * 动画循环
 */
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // 更新控制器
  if (pipes.length === 0) {
    initPipes(); // 初始化管道
  }

  if (!clearing) {
    pipes.forEach((pipe) => pipe.updateTextureOffset(0.01)); // 更新每个管道的纹理偏移量
    renderer.render(scene, camera); // 渲染场景
    labelRenderer.render(scene, camera); // 渲染CSS2D对象
  }
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
 */
export function init() {
  createScene(); // 创建场景
  look(); // 初始化视角
  updateTexture(); // 更新材质
  animate(); // 开始动画循环
  initGui({
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

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}
