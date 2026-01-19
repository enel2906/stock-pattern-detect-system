import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  // Enable network access - allows other devices on same WiFi to access
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    // Allow connections from any origin for development
    cors: true,
    // Proxy configuration - enables single ngrok URL for all services
    proxy: {
      // Java Backend API (alert-service)
      '/api': {
        target: 'http://localhost:60',
        changeOrigin: true,
        secure: false,
        // Forward original host for OAuth
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward the original host header for OAuth redirect URI detection
            if (req.headers.host) {
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
              proxyReq.setHeader('X-Forwarded-Proto', req.headers['x-forwarded-proto'] || 'http');
            }
          });
        },
      },
      // Stock endpoints (Java backend)
      '/stock': {
        target: 'http://localhost:60',
        changeOrigin: true,
        secure: false,
      },
      // Alert endpoints (Java backend)  
      '/alert': {
        target: 'http://localhost:60',
        changeOrigin: true,
        secure: false,
      },
      // OAuth2 authorization (Java backend) - IMPORTANT for Google login
      '/oauth2': {
        target: 'http://localhost:60',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward original host so backend knows the real frontend URL
            if (req.headers.host) {
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
              proxyReq.setHeader('X-Forwarded-Proto', req.headers['x-forwarded-proto'] || (req.headers.host.includes('ngrok') ? 'https' : 'http'));
            }
          });
        },
      },
      // OAuth2 login callback (Java backend)
      '/login/oauth2': {
        target: 'http://localhost:60',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.host) {
              proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
              proxyReq.setHeader('X-Forwarded-Proto', req.headers['x-forwarded-proto'] || (req.headers.host.includes('ngrok') ? 'https' : 'http'));
            }
          });
        },
      },
      // WebSocket endpoint (Java backend)
      '/ws': {
        target: 'http://localhost:60',
        changeOrigin: true,
        secure: false,
        ws: true,  // Enable WebSocket proxy
      },
      // Python Data Service API
      '/data-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/data-api/, ''),
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
})
