import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application UI crashed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultCrashFallback />;
    }

    return this.props.children;
  }
}

const DefaultCrashFallback = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">MVA Imobiliare</p>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Pagina a întâmpinat o eroare.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Am blocat ecranul negru și am afișat acest fallback. Reîncarcă pagina, iar dacă problema persistă, eroarea rămâne acum vizibilă pentru diagnostic.
        </p>
        <button
          type="button"
          onClick={handleReload}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Reîncarcă pagina
        </button>
      </div>
    </div>
  );
};

export default AppErrorBoundary;