/**
 * API Configuration - Smart detection for different environments
 * 
 * Modes:
 * 1. localhost → Direct calls to localhost:60, localhost:8000
 * 2. LAN (192.168.x.x) → Direct calls to IP:60, IP:8000
 * 3. ngrok/external → Use Vite proxy (relative URLs)
 */

// Lấy thông tin từ URL hiện tại
const currentHost = window.location.hostname;
const currentProtocol = window.location.protocol;
const currentOrigin = window.location.origin;

// Detect environment
const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
const isPrivateIP = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(currentHost);
const isNgrok = currentHost.includes('ngrok-free.app') || currentHost.includes('ngrok.io');
const isExternalDomain = !isLocalhost && !isPrivateIP;

// Determine if we should use proxy (ngrok or any external domain)
const useProxy = isNgrok || isExternalDomain;

// Port configurations (only used for direct connections)
const JAVA_PORT = 60;
const PYTHON_PORT = 8000;

// Build API URLs based on environment
let JAVA_API_URL, PYTHON_API_URL, API_BASE_URL, WS_URL, OAUTH2_URL;

if (useProxy) {
  // Proxy mode: Use relative URLs, Vite proxy handles routing
  // All requests go through the same origin, proxy routes to correct backend
  JAVA_API_URL = currentOrigin;  // Base URL for Java backend
  PYTHON_API_URL = `${currentOrigin}/data-api`;  // Python API via /data-api prefix
  API_BASE_URL = `${currentOrigin}/api`;
  WS_URL = `${currentOrigin}/ws`;
  OAUTH2_URL = `${currentOrigin}/oauth2/authorization/google`;
} else if (isLocalhost) {
  // Localhost mode: Direct connections with ports
  JAVA_API_URL = `http://localhost:${JAVA_PORT}`;
  PYTHON_API_URL = `http://localhost:${PYTHON_PORT}`;
  API_BASE_URL = `http://localhost:${JAVA_PORT}/api`;
  WS_URL = `http://localhost:${JAVA_PORT}/ws`;
  OAUTH2_URL = `http://localhost:${JAVA_PORT}/oauth2/authorization/google`;
} else {
  // LAN mode: Direct connections to IP with ports
  JAVA_API_URL = `http://${currentHost}:${JAVA_PORT}`;
  PYTHON_API_URL = `http://${currentHost}:${PYTHON_PORT}`;
  API_BASE_URL = `http://${currentHost}:${JAVA_PORT}/api`;
  WS_URL = `http://${currentHost}:${JAVA_PORT}/ws`;
  OAUTH2_URL = `http://${currentHost}:${JAVA_PORT}/oauth2/authorization/google`;
}

// Helper functions for manual ngrok configuration (legacy support)
export const setNgrokBackendUrl = (url) => {
  console.warn('setNgrokBackendUrl is deprecated. Use Vite proxy instead.');
  localStorage.setItem('NGROK_BACKEND_URL', url);
};

export const clearNgrokConfig = () => {
  localStorage.removeItem('NGROK_BACKEND_URL');
  localStorage.removeItem('NGROK_BACKEND_HOST');
  localStorage.removeItem('NGROK_DATA_SERVICE_URL');
};

export const getNgrokConfig = () => ({
  useProxy,
  isNgrok,
  currentOrigin,
});

// Debug info
if (import.meta.env.DEV) {
  console.log('🔧 API Config:', {
    currentHost,
    currentProtocol,
    isLocalhost,
    isPrivateIP,
    isNgrok,
    isExternalDomain,
    useProxy,
    JAVA_API_URL,
    PYTHON_API_URL,
    API_BASE_URL,
    WS_URL,
    OAUTH2_URL,
  });
}

export { 
  JAVA_API_URL, 
  PYTHON_API_URL, 
  API_BASE_URL, 
  WS_URL, 
  OAUTH2_URL,
  isNgrok,
  isPrivateIP,
  isLocalhost,
  useProxy,
  currentHost,
  currentOrigin
};

export default {
  JAVA_API_URL,
  PYTHON_API_URL,
  API_BASE_URL,
  WS_URL,
  OAUTH2_URL,
  isNgrok,
  isPrivateIP,
  useProxy
};
