import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Hide loading spinner once React takes over
const rootElement = document.getElementById('root')!
rootElement.classList.add('app-loaded')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
