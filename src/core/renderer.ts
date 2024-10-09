import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export let renderer: THREE.WebGLRenderer;
export let labelRenderer: CSS2DRenderer;

export function initRenderer(canvasWebGL: HTMLCanvasElement): void {
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  document.body.appendChild(labelRenderer.domElement);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvasWebGL,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
}