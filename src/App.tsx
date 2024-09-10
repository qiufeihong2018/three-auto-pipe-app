import { useEffect } from 'react'
// import { init } from './core';
import { init } from './core/render';
import Tips from './components/Tips';


function App() {
  useEffect(() => {
    const { renderer, camera } = init();
    addEventListener(
      "resize",
      function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      },
      false
    );
  }, [])

  useEffect(() => {
    // canvas 的容器
    const canvasContainer = document.getElementById("canvas-container") as HTMLElement;

    // 禁用鼠标右键
    canvasContainer.addEventListener(
      "contextmenu",
      function (e) {
        e.preventDefault();
      },
      false
    );

  }, [])

  return (
    <>
      <Tips />
      <div id="canvas-container">
        <canvas id="canvas-webgl"></canvas>
      </div>
    </>
  )
}

export default App
