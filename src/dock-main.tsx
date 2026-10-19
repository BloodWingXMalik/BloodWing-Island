import React from 'react'
import ReactDOM from 'react-dom/client'
import Dock from './Dock'
import './Dock.css'
import './dock-theme.css'
import { MotionProvider, initMotionPreference } from './motion'

document.addEventListener('contextmenu', (e) => e.preventDefault());

// Apply the motion preference before the first paint to avoid a flash.
initMotionPreference();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MotionProvider>
      <Dock />
    </MotionProvider>
  </React.StrictMode>,
)
