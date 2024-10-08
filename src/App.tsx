import React from 'react';
import Tips from './components/Tips';
import useInitializeScene from './hooks/useInitializeScene';
import useInitializeContextMenu from './hooks/useInitializeContextMenu';

function App() {
  useInitializeScene();
  useInitializeContextMenu();

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