import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Try to initialize the app with proper error handling
try {
  // Hide loading spinner once React takes over
  const rootElement = document.getElementById('root')!
  rootElement.classList.add('app-loaded')

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary feature="app-initialization">
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (error) {
  // If initialization fails completely, show an error message
  console.error('Application initialization failed:', error)
  
  const rootElement = document.getElementById('root')!
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        max-width: 500px;
        text-align: center;
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        <h1 style="color: #dc2626; margin-bottom: 16px;">Configuration Error</h1>
        <p style="color: #374151; margin-bottom: 20px;">
          The application could not start due to missing configuration. 
          Please ensure all required environment variables are set.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Error: ${error instanceof Error ? error.message : 'Unknown initialization error'}
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 20px;
          "
        >
          Retry
        </button>
      </div>
    </div>
  `
}
