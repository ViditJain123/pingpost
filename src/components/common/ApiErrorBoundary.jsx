'use client';

import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * API Error Boundary Component
 * Catches errors in API calls and displays a user-friendly error message
 * with the option to retry the action or report the issue
 */
class ApiErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("API Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Optional: Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorMonitoring(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset the error state
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Call the onRetry prop if provided
    if (typeof this.props.onRetry === 'function') {
      this.props.onRetry();
    }
  };

  handleReport = () => {
    // Example logic to report the error
    const errorDetails = {
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    console.log("Error details to report:", errorDetails);
    
    // Here you would send these details to your error tracking service
    // Example: reportErrorToService(errorDetails);
    
    // Show confirmation to user
    alert('Thank you for reporting this issue. Our team has been notified.');
  };

  render() {
    const { hasError, error } = this.state;
    const { 
      children, 
      fallback,
      showReport = true
    } = this.props;

    if (hasError) {
      // You can render any custom fallback UI
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="rounded-lg bg-white border border-gray-200 shadow p-6 flex flex-col items-center text-center max-w-md mx-auto my-8">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          
          <p className="text-gray-600 mb-4">
            {error?.message || 'An unexpected error occurred while processing your request.'}
          </p>
          
          {process.env.NODE_ENV !== 'production' && error?.stack && (
            <pre className="bg-gray-100 p-3 rounded text-xs text-left overflow-auto w-full mb-4 max-h-32">
              {error.stack}
            </pre>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={this.handleRetry}
              className="bg-blue-600 text-white py-2 px-4 rounded-md flex items-center justify-center hover:bg-blue-700 transition-colors flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
            
            {showReport && (
              <button
                onClick={this.handleReport}
                className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors flex-1"
              >
                Report Issue
              </button>
            )}
          </div>
        </div>
      );
    }

    // Render children if no error
    return children;
  }
}

export default ApiErrorBoundary;