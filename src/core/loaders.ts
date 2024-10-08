import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Scene } from 'three';
import { ModelConfig } from '../types';

export const loadModels = (scene: Scene, models: ModelConfig[]) => {
  const loader = new GLTFLoader();

  models.forEach(({ path, scale, position, rotation }) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(scale, scale, scale);
        model.position.set(...position);
        model.rotation.set(...rotation);
        scene.add(model);
      },
      undefined,
      (error) => {
        console.error('An error happened', error);
      },
    );
  });
};
