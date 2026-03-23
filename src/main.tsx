import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      import('virtual:pwa-register').then(({ registerSW }) => {
        registerSW({ immediate: false })
      })
    }, 0)
  })
}

createRoot(document.getElementById("root")!).render(<App />);
