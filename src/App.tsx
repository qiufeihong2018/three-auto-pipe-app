import { TextureLoader } from "three"; // 从 Three.js 库中导入 THREE 变量
import { useEffect } from "react"; // 从 React 库中导入 useEffect 钩子函数
import { init, reset } from "./core/render"; // 从 core/render 模块中导入 init 和 reset 函数
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"; // 从 Three.js 库中导入 GLTFLoader
import Tips from "./components/Tips"; // 导入 Tips 组件

function App() {
  useEffect(() => {
    const { renderer, camera, scene } = init(); // 初始化渲染器、相机和场景

    const textureLoader = new TextureLoader(); // 创建纹理加载器
    const backgroundTexture = textureLoader.load(
      "/public/texture/Corridor.jpg"
    ); // 加载背景纹理
    scene.background = backgroundTexture; // 设置场景背景

    // 加载 3D 模型
    const loader = new GLTFLoader(); // 创建 GLTFLoader 实例
    loader.load(
      "/model/压力容器-112.glb", // 加载压力容器模型
      (gltf) => {
        const model = gltf.scene; // 获取加载的模型场景
        model.scale.set(10, 10, 10); // 缩放模型大小
        scene.add(model); // 将模型添加到场景中
      },
      undefined,
      (error) => {
        console.error("An error happened", error); // 处理加载错误
      }
    );
    addEventListener(
      "resize", // 监听窗口大小变化事件
      function () {
        renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器大小
        camera.aspect = window.innerWidth / window.innerHeight; // 更新相机宽高比
        camera.updateProjectionMatrix(); // 更新相机投影矩阵
      },
      false
    );
    return () => {
      reset(); // 组件卸载时重置场景
    };
  }, []);

  useEffect(() => {
    // canvas 的容器
    const canvasContainer = document.getElementById(
      "canvas-container"
    ) as HTMLElement; // 获取 canvas 容器元素
    // 禁用鼠标右键
    canvasContainer.addEventListener(
      "contextmenu", // 监听右键菜单事件
      function (e) {
        e.preventDefault(); // 禁用默认右键菜单
      },
      false
    );
  }, []);

  return (
    <>
      <Tips /> {/* 渲染 Tips 组件 */}
      <div id="canvas-container">
        {" "}
        {/* 定义 canvas 容器 */}
        <canvas id="canvas-webgl"></canvas> {/* 定义 canvas 元素 */}
      </div>
    </>
  );
}

export default App; // 导出 App 组件
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
