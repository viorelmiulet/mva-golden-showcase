import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import AppErrorBoundary from '@/components/AppErrorBoundary'
import './index.css'

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
