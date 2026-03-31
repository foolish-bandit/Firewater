import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches unhandled React rendering errors and displays a fallback UI
 * instead of crashing the entire app. Logs errors for debugging.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // Log to console with structured context
    console.error('[ErrorBoundary] Uncaught error in component tree:', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface-base">
          <div className="surface-raised p-8 max-w-md w-full text-center space-y-4">
            <h2 className="font-serif text-2xl text-on-surface">Something went wrong</h2>
            <p className="text-on-surface-muted text-sm">
              An unexpected error occurred. This has been logged for investigation.
            </p>
            {this.state.error && (
              <details className="text-left text-xs text-on-surface-muted">
                <summary className="cursor-pointer hover:text-on-surface-accent">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-surface-base overflow-x-auto whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={this.handleDismiss}
                className="btn btn-secondary btn-sm"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="btn btn-secondary btn-sm"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
