import { TextureLoader } from 'three';
import { useEffect } from 'react';
import { init, reset } from './core/render';
import { loadModels } from './core/loaders';
import { models } from './config/models';
import Tips from './components/Tips';

function App() {
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const canvasContainer = document.getElementById(
      'canvas-container',
    ) as HTMLElement;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvasContainer.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvasContainer.removeEventListener('contextmenu', handleContextMenu);
    };
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
