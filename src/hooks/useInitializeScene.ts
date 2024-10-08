import { useEffect } from 'react';
import { TextureLoader } from 'three';
import { init, reset } from '../core/render';
import { loadModels } from '../core/loaders';
import { models } from '../config/models';

const useInitializeScene = () => {
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
};

export default useInitializeScene;