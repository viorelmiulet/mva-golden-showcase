import { createRoot } from 'react-dom/client'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found')
}

const renderFatalFallback = (error?: unknown) => {
  const root = document.getElementById('root')
  if (!root) return

  const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută'

  root.innerHTML = `
    <div class="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div class="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <p class="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">MVA Imobiliare</p>
        <h1 class="mt-4 text-3xl font-bold text-foreground">Aplicația nu a pornit corect.</h1>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
          Am înlocuit ecranul negru cu un fallback de siguranță. Reîncarcă pagina, iar dacă problema persistă,
          eroarea poate fi diagnosticată direct din acest punct.
        </p>
        <p class="mt-4 rounded-lg border border-border bg-muted px-4 py-3 text-left text-xs text-muted-foreground">${errorMessage}</p>
        <button
          type="button"
          id="bootstrap-reload-button"
          class="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Reîncarcă pagina
        </button>
      </div>
    </div>
  `

  document.getElementById('bootstrap-reload-button')?.addEventListener('click', () => {
    window.location.reload()
  })
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

window.addEventListener('error', (event) => {
  if (!rootElement.hasChildNodes()) {
    renderFatalFallback(event.error ?? new Error(event.message))
  }
})

window.addEventListener('unhandledrejection', (event) => {
  if (!rootElement.hasChildNodes()) {
    renderFatalFallback(event.reason)
  }
})

const bootstrap = async () => {
  try {
    const [{ default: App }, { default: AppErrorBoundary }] = await Promise.all([
      import('./App.tsx'),
      import('@/components/AppErrorBoundary'),
    ])

    createRoot(rootElement).render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    )
  } catch (error) {
    console.error('Application bootstrap failed', error)
    renderFatalFallback(error)
  }
}

void bootstrap()
