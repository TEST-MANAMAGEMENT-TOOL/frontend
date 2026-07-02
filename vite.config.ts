import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 8080,
    strictPort: true,
    host: true,
    open: true,
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'https://kiwamitestcloud.com/dashboardapis',
        changeOrigin: true,
        secure: false, // Only for development
        ws: true,
        rewrite: (path) => path, // Keep /api in the path
        configure: (proxy, _options) => {
          // Log proxy errors
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          
          // Log outgoing requests
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            const targetUrl = `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`;
            console.log('[PROXY] Outgoing:', req.method, req.url, '→', targetUrl);
            // Remove headers that might cause CORS issues
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('x-forwarded-host');
            
            // Add CORS headers to the request
            proxyReq.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
            proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            proxyReq.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
            proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
          });
          
          // Log and modify incoming responses
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`[PROXY] Incoming: ${proxyRes.statusCode} ${req.method} ${req.url}`);
            
            // Ensure CORS headers are set in the response
            const headers = proxyRes.headers || {};
            headers['Access-Control-Allow-Origin'] = 'http://localhost:8080';
            headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
            headers['Access-Control-Allow-Headers'] = 'X-Requested-With, Content-Type, Authorization';
            headers['Access-Control-Allow-Credentials'] = 'true';
            
            // Handle preflight requests
            if (req.method === 'OPTIONS') {
              proxyRes.statusCode = 204;
              headers['Access-Control-Max-Age'] = '1728000';
            }
          });
        }
      }
    },
    // Enable CORS for the dev server
    cors: {
      origin: 'http://localhost:8080',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204
    }
  },
  // Resolve path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Optimize development build
  build: {
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Add timestamp to filenames to force cache busting
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
      }
    }
  },
  // Environment variables
  define: {
    'process.env': {}
  }
});
