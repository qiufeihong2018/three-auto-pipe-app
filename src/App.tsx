import { useEffect } from 'react'
// import { init } from './core';
import { init } from './core/render';
import Tips from './components/Tips';


function App() {
  useEffect(() => {
    init()
  }, [])

  return (
    <>
      <Tips />
      <div id="container"></div>
    </>
  )
}

export default App
