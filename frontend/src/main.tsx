import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Hide splash after first paint
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      (window as any).__hideSplash?.()
    }, 600)
  })
})
