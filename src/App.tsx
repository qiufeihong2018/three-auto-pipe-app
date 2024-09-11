import { useEffect } from 'react'
// import { init } from './core';
import { init, reset } from './core/render';
import Tips from './components/Tips';

function App() {
  useEffect(() => {
    // 初始化渲染器和相机
    const { renderer, camera } = init();
    // 添加窗口大小调整事件监听器
    addEventListener(
      "resize",
      function () {
        // 调整渲染器大小
        renderer.setSize(window.innerWidth, window.innerHeight);
        // 更新相机的宽高比
        camera.aspect = window.innerWidth / window.innerHeight;
        // 更新相机的投影矩阵
        camera.updateProjectionMatrix();
      },
      false
    );
    return () => {
      // 组件卸载时重置渲染器和相机
      reset();
    }
  }, [])

  useEffect(() => {
    // 获取 canvas 的容器
    const canvasContainer = document.getElementById("canvas-container") as HTMLElement;
    // 禁用鼠标右键菜单
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
      {/* 提示组件 */}
      <Tips />
      {/* canvas 容器 */}
      <div id="canvas-container">
        <canvas id="canvas-webgl"></canvas>
      </div>
    </>
  )
}

export default App