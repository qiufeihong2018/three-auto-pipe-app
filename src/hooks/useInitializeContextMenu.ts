import { useEffect } from 'react';

const useInitializeContextMenu = () => {
  useEffect(() => {
    const canvasContainer = document.getElementById('canvas-container') as HTMLElement;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvasContainer.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvasContainer.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
};

export default useInitializeContextMenu;