import { useEffect } from 'react'
import { init } from './core';


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
