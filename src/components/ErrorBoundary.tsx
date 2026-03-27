"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-center py-20 px-4">
          <div className="text-4xl mb-4">💥</div>
          <p className="font-medium text-[var(--text-primary)] mb-1">Something went wrong</p>
          <p className="text-sm text-[var(--text-secondary)] opacity-70 mb-4">
            {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
