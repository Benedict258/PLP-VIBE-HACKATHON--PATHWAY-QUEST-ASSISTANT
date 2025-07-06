
import React from 'react';
import './App.css';
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

function App() {
  console.log('App component rendering...');
  
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <BrowserRouter>
          {/* Debug indicator - remove after confirming it works */}
          <div className="fixed top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs z-50">
            App Loaded ✓
          </div>
          
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <PWAInstallPrompt />
        </BrowserRouter>
      </NotificationsProvider>
    </ThemeProvider>
  );
}

export default App;
