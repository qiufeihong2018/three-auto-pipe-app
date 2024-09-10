
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { textures } from './textures';
import { chance, random } from './util';
import { clearGrid } from './node';
import { Pipe } from './pipe';
import { initGui } from './gui';

const JOINTS_ELBOW = "elbow";
const JOINTS_BALL = "ball";
const JOINTS_MIXED = "mixed";
const JOINTS_CYCLE = "cycle";

const jointsCycleArray = [JOINTS_ELBOW, JOINTS_BALL, JOINTS_MIXED];
let jointsCycleIndex = 0;


let pipes: any[] = [];
let scene;
let renderer;
let camera;
let controls;

const options = {
  multiple: true,
  texturePath: null,
  joints: 'elbow', // 切换关节类型
  interval: [16, 24], // 渐隐效果的时间区间
};


/**
 * 创建场景
 */
function createScene() {
  const canvasWebGL = document.getElementById("canvas-webgl") as HTMLCanvasElement;
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvasWebGL,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    100000
  );

  // controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = true;
  // 搭建场景
  scene = new THREE.Scene();

  // 场景的光线
  const ambientLight = new THREE.AmbientLight(0x111111);
  scene.add(ambientLight);
  const directionalLightL = new THREE.DirectionalLight(0xffffff, 0.9);
  directionalLightL.position.set(-1.2, 1.5, 0.5);
  scene.add(directionalLightL);
}


let clearing = false; // 是否正在清除场景
let clearTID = -1;

/**
 * 清除场景
 * @param fast 是否快速清除
 */
function clear() {
  clearTimeout(clearTID);
  clearTID = setTimeout(
    clear,
    random(options.interval[0], options.interval[1]) * 1000
  );

  if (!clearing) {
    clearing = true;
    reset()
  }
}

// TODO：取消重复新建场景的逻辑
// clearTID = setTimeout(
//   clear,
//   random(options.interval[0], options.interval[1]) * 1000
// );

function reset() {
  renderer.clear();
  for (let i = 0; i < pipes.length; i++) {
    scene.remove(pipes[i].object3d);
  }
  pipes = [];
  clearGrid();
  look();
  clearing = false;
}

/**
 * 创建管道（初始化管道配置）
 * 
 */
function createPipes() {
  if (pipes.length === 0) {
    let jointType = options.joints;
    if (options.joints === JOINTS_CYCLE) {
      jointType = jointsCycleArray[jointsCycleIndex++];
    }
    const pipeOptions: any = {
      teapotChance: 1 / 200, // 1 / 1000 in the original
      ballJointChance:
        jointType === JOINTS_BALL ? 1 : jointType === JOINTS_MIXED ? 1 / 3 : 0,
      texturePath: options.texturePath,
    };
    // 5% 的概率生成茶壶
    if (chance(1 / 20)) {
      pipeOptions.teapotChance = 1 / 20;
      pipeOptions.texturePath = "images/textures/candycane.png";
   
      if (!textures[pipeOptions.texturePath]) {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(pipeOptions.texturePath);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        textures[pipeOptions.texturePath] = texture;
      }
    }
    // 构建管道（从头到尾属于一个管道，而非一节一节）
    for (let i = 0; i < 1 + +options.multiple * (1 + +chance(1 / 10)); i++) {
      pipes.push(new Pipe(scene, pipeOptions));
    }
  }
}

/**
 * 更新材质
 */
function updateTexture() {
  if (options.texturePath && !textures[options.texturePath]) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(options.texturePath);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    textures[options.texturePath] = texture;
  }
}

function animate() {
  controls.update();
  updateTexture();
  // 执行管道的更新方法，每一帧都在运算（两个管道同时在绘制）
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].update();
  }
  createPipes();
  if (!clearing) {
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}

// TODO: 随机视角
function randomLook() {
    // 随机视角 view
    const vector = new THREE.Vector3(14, 0, 0);
    const axis = new THREE.Vector3(random(-1, 1), random(-1, 1), random(-1, 1));
    const angle = Math.PI / 2;
    const matrix = new THREE.Matrix4().makeRotationAxis(axis, angle);

    vector.applyMatrix4(matrix);
    camera.position.copy(vector);
  
  const center = new THREE.Vector3(0, 0, 0);
  camera.lookAt(center);
  controls.update();
}

function look() {
  camera.position.set(25, 25, 25);
  const center = new THREE.Vector3(0, 0, 0);
  camera.lookAt(center);
  controls.update();
}


// start animation
export function init() {
  createScene()
  initGui({
    clear: () => {
      clear();
      window.getSelection()?.removeAllRanges();
      document.activeElement?.blur();
    },
    // 切换关节类型
    setJointType: (val) => {
      options.joints = val;
    }
  });
  animate();

  return {
    renderer,
    camera
  }
}

