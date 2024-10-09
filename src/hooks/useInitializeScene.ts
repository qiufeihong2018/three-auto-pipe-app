import { useEffect } from 'react'; // 从 React 导入 useEffect 钩子
import { TextureLoader } from 'three'; // 从 three.js 导入 TextureLoader 类
import { init, reset } from '../core/scene'; // 从 core/scene 模块导入 init 和 reset 函数
import { loadModels } from '../core/loaders'; // 从 core/loaders 模块导入 loadModels 函数
import { models } from '../config/models'; // 从 config/models 模块导入 models 配置
import { InitOptions } from '../types';

const options: InitOptions = {
  texturePath: 'public/texture/arrow.png', // 纹理路径选项
  joints: 'elbow', // 关节选项
};

const useInitializeScene = () => {
  useEffect(() => {
    const { scene, renderer, camera } = init(options); // 初始化场景，渲染器和相机

    const textureLoader = new TextureLoader(); // 创建一个新的纹理加载器
    const backgroundTexture = textureLoader.load('/texture/Corridor.jpg'); // 加载背景纹理
    scene.background = backgroundTexture; // 设置场景的背景纹理

    loadModels(scene, models); // 加载模型到场景中

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight); // 调整渲染器大小
      camera.aspect = window.innerWidth / window.innerHeight; // 更新相机的纵横比
      camera.updateProjectionMatrix(); // 更新相机的投影矩阵
    };

    window.addEventListener('resize', handleResize); // 监听窗口大小变化事件

    return () => {
      reset(); // 重置场景
      window.removeEventListener('resize', handleResize); // 移除窗口大小变化事件监听器
    };
  }, []); // 空依赖数组，确保只在组件挂载和卸载时执行一次
};

export default useInitializeScene; // 导出 useInitializeScene 钩子函数
