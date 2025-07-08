
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        setDebugInfo({
          session,
          user,
          sessionError,
          userError,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setDebugInfo({
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-100 p-8">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-xl font-bold mb-4">Auth Debug Info</h1>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Reload
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
