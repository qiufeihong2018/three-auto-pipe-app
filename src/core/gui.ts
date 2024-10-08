import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let gui;

export function initGui(options) {
  gui = new GUI();
  // 输出管道数据
  gui
    .add(
      {
        button: () => {
          options.printPipesInfo();
        },
      },
      'button',
    )
    .name('管道数据');
}
