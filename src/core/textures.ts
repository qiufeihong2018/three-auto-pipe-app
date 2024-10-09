import * as THREE from 'three';

export const textures: { [key: string]: THREE.Texture } = {};

export function updateTexture(options: any): void {
  if (options.texturePath && !textures[options.texturePath]) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(options.texturePath);

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.offset.set(0, 0.5);
    texture.center.set(0.5, 0.5);
    texture.rotation = Math.PI;

    textures[options.texturePath] = texture;
  }
}