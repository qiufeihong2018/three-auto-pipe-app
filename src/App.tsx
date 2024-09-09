import { useEffect } from 'react'
// import { init } from './core';
import { init } from './core/render';


function App() {
  useEffect(() => {
    init()
  }, [])

  return (
    <>
      <div id="container"></div>
    </>
  )
}

export default App
