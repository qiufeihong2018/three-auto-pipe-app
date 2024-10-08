import { TextureLoader } from 'three';
import { useEffect } from 'react';
import { init, reset } from './core/render';
import { loadModels } from './core/loaders';
import { models } from './config/models';
import Tips from './components/Tips';

/**
 * 初始化 Three.js 场景。
 */
const initializeScene = () => {
  const { renderer, camera, scene } = init();

  const textureLoader = new TextureLoader();
  const backgroundTexture = textureLoader.load('/texture/Corridor.jpg');
  scene.background = backgroundTexture;

  loadModels(scene, models);

  const handleResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };

  window.addEventListener('resize', handleResize);

  return () => {
    reset();
    window.removeEventListener('resize', handleResize);
  };
};

/**
 * 初始化右键菜单禁用。
 */
const initializeContextMenu = () => {
  const canvasContainer = document.getElementById('canvas-container') as HTMLElement;

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  canvasContainer.addEventListener('contextmenu', handleContextMenu);

  return () => {
    canvasContainer.removeEventListener('contextmenu', handleContextMenu);
  };
};

function App() {
  useEffect(initializeScene, []);
  useEffect(initializeContextMenu, []);

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