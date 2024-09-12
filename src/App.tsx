import { TextureLoader } from "three"; // 从 Three.js 库中导入 TextureLoader
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
    const models = [
      { path: "/model/压力容器-112.glb", scale: 20, position: [0, -10, 0] },
      { path: "/model/压力容器-112.glb", scale: 10, position: [-20, -8, 10] },
      { path: "/model/压力容器-112.glb", scale: 10, position: [20, -8, 0] },
    ];

    models.forEach(({ path, scale, position }) => {
      loader.load(
        path, // 加载模型路径
        (gltf) => {
          const model = gltf.scene; // 获取加载的模型场景
          model.scale.set(scale, scale, scale); // 缩放模型大小
          model.position.set(...position); // 设置模型位置
          scene.add(model); // 将模型添加到场景中
        },
        undefined,
        (error) => {
          console.error("An error happened", error); // 处理加载错误
        }
      );
    });

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器大小
      camera.aspect = window.innerWidth / window.innerHeight; // 更新相机宽高比
      camera.updateProjectionMatrix(); // 更新相机投影矩阵
    };

    window.addEventListener("resize", handleResize); // 监听窗口大小变化事件

    return () => {
      reset(); // 组件卸载时重置场景
      window.removeEventListener("resize", handleResize); // 移除窗口大小变化事件监听
    };
  }, []);

  useEffect(() => {
    const canvasContainer = document.getElementById(
      "canvas-container"
    ) as HTMLElement; // 获取 canvas 容器元素

    // 禁用鼠标右键
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // 禁用默认右键菜单
    };

    canvasContainer.addEventListener("contextmenu", handleContextMenu);

    return () => {
      canvasContainer.removeEventListener("contextmenu", handleContextMenu); // 移除右键菜单事件监听
    };
  }, []);

  return (
    <>
      <Tips /> {/* 渲染 Tips 组件 */}
      <div id="canvas-container"> {/* 定义 canvas 容器 */}
        <canvas id="canvas-webgl"></canvas> {/* 定义 canvas 元素 */}
      </div>
    </>
  );
}

export default App; // 导出 App 组件