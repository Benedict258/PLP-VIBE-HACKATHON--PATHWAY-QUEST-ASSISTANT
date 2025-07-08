import React, { useEffect } from 'react';
import './App.css';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Debug from "./pages/Debug";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

// Auto-refresh version from .env
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.7';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-300 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    const storedVersion = localStorage.getItem('appVersion');

    if (storedVersion !== APP_VERSION) {
      localStorage.setItem('appVersion', APP_VERSION);

      // 🧼 Clear old caches
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach(name => caches.delete(name));
        });
      }

      // 🔁 Reload after cache cleared
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationsProvider>
          <BrowserRouter>
            <div className="min-h-screen w-full">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/debug" element={<Debug />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <PWAInstallPrompt />
            </div>
          </BrowserRouter>
        </NotificationsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
