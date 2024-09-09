
import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { textures } from './textures';
import { chance, random } from './util';
import { clearGrid } from './node';
import { Pipe } from './pipe';
import { initGui } from './gui';
import { dissolve, runDissolveEffect } from './dissolveEffect';

const JOINTS_ELBOW = "elbow";
const JOINTS_BALL = "ball";
const JOINTS_MIXED = "mixed";
const JOINTS_CYCLE = "cycle";

const jointsCycleArray = [JOINTS_ELBOW, JOINTS_BALL, JOINTS_MIXED];
let jointsCycleIndex = 0;


let pipes: any[] = [];

const options = {
  multiple: true,
  texturePath: null,
  joints: 'elbow', // 切换关节类型
  interval: [16, 24], // 渐隐效果的时间区间
};

const canvasContainer = document.getElementById("canvas-container") as HTMLCanvasElement;

// renderer
const canvasWebGL = document.getElementById("canvas-webgl") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas: canvasWebGL,
});
renderer.setSize(window.innerWidth, window.innerHeight);

// camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  100000
);

// controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = true;
// 搭建场景
const scene = new THREE.Scene();

// lighting
const ambientLight = new THREE.AmbientLight(0x111111);
scene.add(ambientLight);

const directionalLightL = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLightL.position.set(-1.2, 1.5, 0.5);
scene.add(directionalLightL);


let clearing = false; // 是否正在清除场景
let clearTID = -1;

/**
 * 清除场景
 * @param fast 是否快速清除
 */
function clear(fast = true) {
  clearTimeout(clearTID);
  clearTID = setTimeout(
    clear,
    random(options.interval[0], options.interval[1]) * 1000
  );

  if (!clearing) {
    clearing = true;
    const fadeOutTime = fast ? 0.2 : 2;
    dissolve(fadeOutTime, reset);
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

function animate() {
  controls.update();
  if (options.texturePath && !textures[options.texturePath]) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(options.texturePath);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    textures[options.texturePath] = texture;
  }
  // 执行管道的更新方法，每一帧都在运算
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].update();
  }
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
    if (chance(1 / 20)) {
      pipeOptions.teapotChance = 1 / 20; // why not? :)
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

  if (!clearing) {
    renderer.render(scene, camera);
  }

  runDissolveEffect()

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
  camera.position.set(10, 10, 10);
  const center = new THREE.Vector3(0, 0, 0);
  camera.lookAt(center);
  controls.update();
}


addEventListener(
  "resize",
  function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  },
  false
);

// 禁用鼠标右键
canvasContainer.addEventListener(
  "contextmenu",
  function(e) {
    e.preventDefault();
  },
  false
);

// start animation
export function init() {
  initGui({
    clear: () => {
      clear(true)
      window.getSelection()?.removeAllRanges();
      document.activeElement?.blur();
    },
    // 切换关节类型
    setJointType: (val) => {
      options.joints = val;
    }
  });
  animate();
}

