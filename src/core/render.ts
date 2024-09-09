
import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { textures } from './textures';
import { chance, random, showElementsIf, shuffleArrayInPlace } from './util';
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

const options = {
  multiple: true,
  texturePath: null,
  joints: 'elbow', // 切换关节类型
  interval: [16, 24], // 渐隐效果的时间区间
};

const canvasContainer = document.getElementById("canvas-container") as HTMLCanvasElement;

// 2d canvas for dissolve effect
const canvas2d = document.getElementById("canvas-2d") as HTMLCanvasElement;
const ctx2d = canvas2d.getContext("2d")!;

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
controls.enabled = false;
// 搭建场景
const scene = new THREE.Scene();

// lighting
const ambientLight = new THREE.AmbientLight(0x111111);
scene.add(ambientLight);

const directionalLightL = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLightL.position.set(-1.2, 1.5, 0.5);
scene.add(directionalLightL);

// dissolve transition effect

let dissolveRects: { x: number; y: number; }[] = [];
let dissolveRectsIndex = -1;
let dissolveRectsPerRow = 50;
let dissolveRectsPerColumn = 50;
let dissolveTransitionSeconds = 2;
let dissolveTransitionFrames = dissolveTransitionSeconds * 60;
let dissolveEndCallback;

function dissolve(seconds, endCallback) {
  dissolveRectsPerRow = Math.ceil(window.innerWidth / 20);
  dissolveRectsPerColumn = Math.ceil(window.innerHeight / 20);

  dissolveRects = new Array(dissolveRectsPerRow * dissolveRectsPerColumn)
    .fill(null)
    .map(function(_null, index) {
      return {
        x: index % dissolveRectsPerRow,
        y: Math.floor(index / dissolveRectsPerRow),
      };
    });
  shuffleArrayInPlace(dissolveRects);
  dissolveRectsIndex = 0;
  dissolveTransitionSeconds = seconds;
  dissolveTransitionFrames = dissolveTransitionSeconds * 60;
  dissolveEndCallback = endCallback;
}

function finishDissolve() {
  dissolveEndCallback();
  dissolveRects = [];
  dissolveRectsIndex = -1;
  ctx2d.clearRect(0, 0, canvas2d.width, canvas2d.height);
}

let clearing = false;
let clearTID = -1;

// 清除场景
function clear(fast) {
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
      // TODO: DRY
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

  if (
    canvas2d.width !== window.innerWidth ||
    canvas2d.height !== window.innerHeight
  ) {
    canvas2d.width = window.innerWidth;
    canvas2d.height = window.innerHeight;
    // TODO: make the 2d canvas really low resolution, and stretch it with CSS, with pixelated interpolation
    if (dissolveRectsIndex > -1) {
      for ( let i = 0; i < dissolveRectsIndex; i++) {
        const rect = dissolveRects[i];
        // TODO: could precompute rect in screen space, or at least make this clearer with "xIndex"/"yIndex"
        const rectWidth = innerWidth / dissolveRectsPerRow;
        const rectHeight = innerHeight / dissolveRectsPerColumn;
        ctx2d.fillStyle = "black";
        ctx2d.fillRect(
          Math.floor(rect.x * rectWidth),
          Math.floor(rect.y * rectHeight),
          Math.ceil(rectWidth),
          Math.ceil(rectHeight)
        );
      }
    }
  }
  if (dissolveRectsIndex > -1) {
    // TODO: calibrate based on time transition is actually taking
    const rectsAtATime = Math.floor(
      dissolveRects.length / dissolveTransitionFrames
    );
    for (
      let i = 0;
      i < rectsAtATime && dissolveRectsIndex < dissolveRects.length;
      i++
    ) {
      const rect = dissolveRects[dissolveRectsIndex];
      // TODO: could precompute rect in screen space, or at least make this clearer with "xIndex"/"yIndex"
      const rectWidth = innerWidth / dissolveRectsPerRow;
      const rectHeight = innerHeight / dissolveRectsPerColumn;
      ctx2d.fillStyle = "black";
      ctx2d.fillRect(
        Math.floor(rect.x * rectWidth),
        Math.floor(rect.y * rectHeight),
        Math.ceil(rectWidth),
        Math.ceil(rectHeight)
      );
      dissolveRectsIndex += 1;
    }
    if (dissolveRectsIndex === dissolveRects.length) {
      finishDissolve();
    }
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

canvasContainer.addEventListener("mousedown", function(e) {
  e.preventDefault();
  if (!controls.enabled) {
    if (e.button) {
      clear(true);
    }
  }
  window.getSelection()?.removeAllRanges();
  document.activeElement?.blur();
});

// 禁用鼠标右键
canvasContainer.addEventListener(
  "contextmenu",
  function(e) {
    e.preventDefault();
  },
  false
);

const toggleControlButton = document.getElementById("toggle-controls") as HTMLButtonElement;
toggleControlButton.addEventListener(
  "click",
  function() {
    controls.enabled = !controls.enabled;
    showElementsIf(".normal-controls-enabled", !controls.enabled);
    showElementsIf(".orbit-controls-enabled", controls.enabled);
  },
  false
);

// parse URL parameters
function updateFromParametersInURL() {
  const paramsJSON = decodeURIComponent(location.hash.replace(/^#/, ""));
  let params;
  if (paramsJSON) {
    try {
      params = JSON.parse(paramsJSON);
      if (typeof params !== "object") {
        alert("Invalid URL parameter JSON: top level value must be an object");
        params = null;
      }
    } catch (error) {
      alert(
        "Invalid URL parameter JSON syntax\n\n" +
          error +
          "\n\nRecieved:\n" +
          paramsJSON
      );
    }
  }
  params = params || {};

  showElementsIf(".ui-container", !params.hideUI);
}

updateFromParametersInURL();
window.addEventListener("hashchange", updateFromParametersInURL);

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

