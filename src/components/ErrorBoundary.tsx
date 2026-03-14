'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-redLight mb-4">
              <AlertTriangle className="h-8 w-8 text-redPrimary" />
            </div>
            <h2 className="text-xl font-semibold text-whitePure mb-2">
              Something went wrong
            </h2>
            <p className="text-textSecondary mb-6">
              {this.state.error?.message || 'An unexpected error occurred while loading this section.'}
            </p>
            <Button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dashboard-specific error boundary with custom styling
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-containerBg rounded-xl shadow-sm border border-grayBorder p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-redLight mb-3">
              <AlertTriangle className="h-6 w-6 text-redPrimary" />
            </div>
            <h3 className="text-lg font-semibold text-whitePure mb-1">
              Failed to load data
            </h3>
            <p className="text-sm text-textSecondary">
              Please refresh the page to try again
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
