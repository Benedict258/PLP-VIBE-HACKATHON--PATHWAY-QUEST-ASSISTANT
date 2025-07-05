import React, { useState, useEffect } from 'react';
import { CheckCircle, Mail, Sparkles, ArrowRight } from 'lucide-react';

function App() {
  const [countdown, setCountdown] = useState(7);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          setTimeout(() => {
            window.location.href = 'https://plp-vibe-hackathon-pathway-quest.onrender.com/';
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleContinue = () => {
    window.location.href = 'https://plp-vibe-hackathon-pathway-quest.onrender.com/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Sparkles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 max-w-md w-full text-center transform hover:scale-105 transition-transform duration-300">
        
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-xl">PQ</span>
          </div>
        </div>

        {/* Success Icon Animation */}
        <div className="mb-8 relative">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full mb-4 relative">
            <CheckCircle className="h-12 w-12 text-emerald-500 animate-bounce" />
            <div className="absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-25"></div>
          </div>
          
          {/* Email Illustration */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className="relative">
              <Mail className="h-8 w-8 text-purple-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Message */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 leading-tight">
            ✅ Email Verified Successfully!
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Welcome to your productivity journey. You can now access all features on Pathway Quest.
          </p>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 group"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>

        {/* Auto-redirect Message */}
        <div className="text-sm text-gray-500">
          {isRedirecting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
              <span>Redirecting...</span>
            </div>
          ) : (
            <span>Auto-redirecting in {countdown} seconds...</span>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full">
          Built with love for the PLP Vibe Hackathon 💜
        </p>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-float opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default App;