import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function createPanel(scene: THREE.Scene): CSS2DObject {
  const panelDiv = document.createElement('div');
  panelDiv.className = 'label';
  panelDiv.style.backgroundColor = '#fff';
  panelDiv.style.padding = '5px';
  panelDiv.style.opacity = '0.7';
  panelDiv.style.width = '400px';
  panelDiv.style.height = '200px';
  panelDiv.style.borderRadius = '10px';
  panelDiv.style.pointerEvents = 'none';

  const panelLabel = new CSS2DObject(panelDiv);
  panelLabel.position.set(-10, 4, -4);
  scene.add(panelLabel);

  return panelLabel;
}