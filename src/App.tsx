import { useEffect } from 'react'
// import { init } from './core';
import { render } from './core/render';


function App() {
  useEffect(() => {
    render()
  }, [])

  return (
    <>
      <div id="container"></div>
    </>
  )
}

export default App
