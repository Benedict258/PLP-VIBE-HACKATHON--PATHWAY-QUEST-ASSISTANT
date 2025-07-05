
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
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <BrowserRouter>
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
