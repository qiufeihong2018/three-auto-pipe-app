import { useEffect } from "react";
// import { init } from './core';
import { init, reset } from "./core/render";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Tips from "./components/Tips";

function App() {
  useEffect(() => {
    const { renderer, camera, scene } = init();

    // 加载 3D 模型
    const loader = new GLTFLoader();
    loader.load(
      // "/model/花仙子_拉克丝.glb", // 替换为你的 3D 模型文件路径
      '/model/压力容器-112.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(10, 10, 10); // 缩放模型大小
        scene.add(model); // 将模型添加到场景中
      },
      undefined,
      (error) => {
        console.error("An error happened", error); // 处理加载错误
      }
    );
    addEventListener(
      "resize",
      function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      },
      false
    );
    return () => {
      reset();
    };
  }, []);

  useEffect(() => {
    // canvas 的容器
    const canvasContainer = document.getElementById(
      "canvas-container"
    ) as HTMLElement;
    // 禁用鼠标右键
    canvasContainer.addEventListener(
      "contextmenu",
      function (e) {
        e.preventDefault();
      },
      false
    );
  }, []);

  return (
    <>
      <Tips />
      <div id="canvas-container">
        <canvas id="canvas-webgl"></canvas>
      </div>
    </>
  );
}

export default App;
// import React from "react";
// import ThreeScene from "./components/LinesFat";

// const App: React.FC = () => {
//   return (
//     <div>
//       <ThreeScene />
//     </div>
//   );
// };

// export default App;
