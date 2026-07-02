import React, { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Debug component to check authentication status
 * Add this to any page to see auth state
 */
export function AuthDebugger() {
  const [authState, setAuthState] = useState<any>(null);

  const checkAuth = () => {
    const token = authService.getToken();
    const isAuth = authService.isAuthenticated();
    
    const state = {
      isAuthenticated: isAuth,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 30)}...${token.substring(token.length - 10)}` : 'No token',
      tokenStartsWithBearer: token?.startsWith('Bearer '),
      localStorage: {
        token: localStorage.getItem('token') ? 'exists' : 'missing',
        user: localStorage.getItem('user') ? 'exists' : 'missing',
      },
      currentPath: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    console.log('🔍 Auth State:', state);
    setAuthState(state);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (!authState) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>🔐 Auth Debugger</span>
          <Button size="sm" variant="outline" onClick={checkAuth}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-semibold">Authenticated:</div>
          <div className={authState.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {authState.isAuthenticated ? '✅ Yes' : '❌ No'}
          </div>

          <div className="font-semibold">Has Token:</div>
          <div className={authState.hasToken ? 'text-green-600' : 'text-red-600'}>
            {authState.hasToken ? '✅ Yes' : '❌ No'}
          </div>

          <div className="font-semibold">Token Length:</div>
          <div>{authState.tokenLength}</div>

          <div className="font-semibold">Bearer Prefix:</div>
          <div className={authState.tokenStartsWithBearer ? 'text-green-600' : 'text-yellow-600'}>
            {authState.tokenStartsWithBearer ? '✅ Yes' : '⚠️ No'}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="font-semibold mb-1">Token Preview:</div>
          <div className="bg-gray-100 p-2 rounded text-[10px] break-all">
            {authState.tokenPreview}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="font-semibold mb-1">LocalStorage:</div>
          <div className="space-y-1">
            <div>Token: {authState.localStorage.token}</div>
            <div>User: {authState.localStorage.user}</div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="font-semibold">Current Path:</div>
          <div className="text-blue-600">{authState.currentPath}</div>
        </div>

        <div className="pt-2 border-t flex gap-2">
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => {
              authService.clearToken();
              checkAuth();
            }}
            className="flex-1"
          >
            Clear Token
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              console.log('Full token:', authService.getToken());
              console.log('LocalStorage:', {
                token: localStorage.getItem('token'),
                user: localStorage.getItem('user'),
              });
            }}
            className="flex-1"
          >
            Log to Console
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
