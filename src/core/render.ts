import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Chart } from '@antv/g2';

import { textures } from './textures';
import { clearGrid } from './node';
import { Pipe } from './pipe';
import { initGui } from './gui';
import defautPipesData from '../assets/data.json';

let pipes: Pipe[] = [];
let renderer: THREE.WebGLRenderer;
let labelRenderer: CSS2DRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;

const options = {
  multiple: true,
  texturePath: 'public/texture/arrow.png',
  joints: 'elbow',
};

let clearing = false;

/**
 * 重置场景
 */
export function reset(): void {
  renderer.clear();
  pipes.forEach((pipe) => scene.remove(pipe.object3d));
  pipes = [];
  clearGrid();
  look();
  clearing = false;
}

/**
 * 初始化渲染器
 */
function initRenderer(canvasWebGL: HTMLCanvasElement): void {
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  document.body.appendChild(labelRenderer.domElement);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvasWebGL,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 初始化相机和控制器
 */
function initCameraAndControls(): void {
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 10, 100000);
  controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 500;
}

/**
 * 添加光源
 */
function addLights(): void {
  const ambientLight = new THREE.AmbientLight(0x111111);
  scene.add(ambientLight);

  const directionalLightL = new THREE.DirectionalLight(0xffffff, 2);
  directionalLightL.position.set(1.2, 1.5, 5);
  scene.add(directionalLightL);
}

/**
 * 创建面板
 */
function createPanel(): CSS2DObject {
  const panelDiv = document.createElement('div');
  panelDiv.className = 'label';
  panelDiv.style.backgroundColor = '#fff';
  panelDiv.style.padding = '5px';
  panelDiv.style.opacity = '0.7';
  panelDiv.style.width = '400px';
  panelDiv.style.height = '200px';
  panelDiv.style.borderRadius = '10px';
  panelDiv.style.pointerEvents = 'none';

  const panelLabel = new CSS2DObject(panelDiv);
  panelLabel.position.set(-10, 4, -4);
  scene.add(panelLabel);

  return panelLabel;
}

/**
 * 创建图表
 */
function createChart(panelDiv: HTMLDivElement): void {
  fetch('https://gw.alipayobjects.com/os/bmw-prod/fbe4a8c1-ce04-4ba3-912a-0b26d6965333.json')
    .then((res) => res.json())
    .then((data) => {
      const chart = new Chart({
        container: panelDiv,
        width: 400,
        height: 200,
      });

      const keyframe = chart
        .timingKeyframe()
        .attr('direction', 'alternate')
        .attr('iterationCount', 4);

      keyframe
        .interval()
        .data(data)
        .transform({ type: 'groupX', y: 'mean' })
        .encode('x', 'gender')
        .encode('y', 'weight')
        .encode('color', 'gender')
        .encode('key', 'gender');

      keyframe
        .point()
        .data(data)
        .encode('x', 'height')
        .encode('y', 'weight')
        .encode('color', 'gender')
        .encode('groupKey', 'gender')
        .encode('shape', 'point');

      chart.render();
    })
    .catch((error) => console.error('Error loading chart data:', error));
}

/**
 * 创建连接线
 */
function createLine(): THREE.Line {
  const lineMaterial = new THREE.LineBasicMaterial({
    color: '#fff',
    transparent: true,
    opacity: 0.7,
    linewidth: 5,
    linecap: 'round',
  });
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);

  return line;
}

/**
 * 创建场景
 */
function createScene(): void {
  const canvasWebGL = document.getElementById('canvas-webgl') as HTMLCanvasElement;

  initRenderer(canvasWebGL);
  scene = new THREE.Scene();
  initCameraAndControls();
  addLights();

  const panelLabel = createPanel();
  createChart(panelLabel.element as HTMLDivElement);
  const line = createLine();

  window.addEventListener('resize', onWindowResize, false);

  function animate(): void {
    requestAnimationFrame(animate);

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
function initPipes(): void {
  const pipeOptions = {
    jointType: options.joints,
    teapotChance: 1 / 200,
    ballJointChance: 1,
    texturePath: options.texturePath,
  };

  defautPipesData.forEach((pipeData) => {
    const pipe = new Pipe(scene, pipeOptions);
    pipe.positions = pipeData.map((node) => new THREE.Vector3(node.x, node.y, node.z));
    pipe.generate();
    pipes.push(pipe);
  });
}

/**
 * 更新材质
 */
function updateTexture(): void {
  if (options.texturePath && !textures[options.texturePath]) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(options.texturePath);

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.offset.set(0, 0.5);
    texture.center.set(0.5, 0.5);
    texture.rotation = Math.PI;

    textures[options.texturePath] = texture;
  }
}

/**
 * 动画循环
 */
function animate(): void {
  requestAnimationFrame(animate);
  controls.update();
  if (pipes.length === 0) {
    initPipes();
  }

  if (!clearing) {
    pipes.forEach((pipe) => pipe.updateTextureOffset(0.01));
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
}

/**
 * 初始化视角
 */
function look(): void {
  camera.position.set(25, 25, 25);
  const center = new THREE.Vector3(0, 0, 0);
  camera.lookAt(center);
  controls.update();
}

/**
 * 初始化函数
 */
export function init(): { scene: THREE.Scene; renderer: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera } {
  createScene();
  look();
  updateTexture();
  animate();
  initGui({
    printPipesInfo: () => {
      console.log('pipes:', pipes);
    },
  });
  return {
    scene,
    renderer,
    camera,
  };
}

/**
 * 处理窗口大小变化事件
 */
function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}