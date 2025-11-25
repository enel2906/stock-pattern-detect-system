// API Request Interceptor
// Handles automatic token refresh on 401 errors

import { authApi } from './authApi';

class ApiInterceptor {
  constructor() {
    this.authContext = null;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Set auth context from AuthProvider
  setAuthContext(context) {
    this.authContext = context;
  }

  // Process queued requests after token refresh
  processQueue(error, token = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  // Main fetch wrapper with automatic retry
  async fetch(url, options = {}) {
    try {
      // First attempt with current token
      let response = await this.fetchWithAuth(url, options);

      // If 401, try to refresh token and retry
      if (response.status === 401 && this.authContext) {
        console.log('Received 401, attempting token refresh...');

        // If already refreshing, queue this request
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({
              resolve: async (token) => {
                try {
                  const retryResponse = await this.fetchWithAuth(url, options, token);
                  resolve(retryResponse);
                } catch (err) {
                  reject(err);
                }
              },
              reject: (err) => {
                reject(err);
              }
            });
          });
        }

        // Start refresh process
        this.isRefreshing = true;

        try {
          // Refresh token
          const newToken = await this.authContext.refresh();

          // Process queued requests
          this.processQueue(null, newToken);

          // Retry original request with new token
          response = await this.fetchWithAuth(url, options, newToken);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          this.processQueue(refreshError, null);
          
          // Redirect to login if refresh fails
          if (this.authContext) {
            this.authContext.logout();
          }
          
          throw refreshError;
        } finally {
          this.isRefreshing = false;
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Fetch with authentication header
  async fetchWithAuth(url, options = {}, token = null) {
    const authToken = token || (this.authContext && this.authContext.accessToken);

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    };

    // Add auth header if token exists
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const fetchOptions = {
      ...options,
      headers,
    };

    return fetch(url, fetchOptions);
  }

  // Helper method for JSON responses
  async fetchJSON(url, options = {}) {
    const response = await this.fetch(url, options);

    if (!response.ok && response.status !== 401) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response;
  }
}

// Create singleton instance
const apiInterceptor = new ApiInterceptor();

export default apiInterceptor;
