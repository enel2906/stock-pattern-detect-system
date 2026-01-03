// API Service
import { detectCandlePattern, isPatternSupported } from './patternDetectionService';
import apiInterceptor from './apiInterceptor';

// Java backend cho stock chart data
const JAVA_API_URL = 'http://localhost:60';
// Python backend cho news và financial reports
const PYTHON_API_URL = 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const stockApi = {
  // Fetch stock data - Public API (no auth required)
  getStockData: async (stockSymbol) => {
    try {
      const res = await fetch(`${JAVA_API_URL}/stock?symbol=${stockSymbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const response = await res.json();
      if (response.code !== 0 || !response.data) {
        throw new Error('Invalid data format');
      }

      const cdata = response.data.map(item => ({
        time: `${item.dateStr.substring(0, 4)}-${item.dateStr.substring(4, 6)}-${item.dateStr.substring(6, 8)}`,
        
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));

      return cdata;
    } catch (error) {
      console.error('Error fetching data:', error.message);
      throw error; // Throw error để component có thể xử lý
    }
  },

  // Fetch pattern data - now using client-side detection with cached data
  getPatternData: async (stockSymbol, patternName, cachedStockData = null) => {
    try {
      // Check if pattern is supported for client-side detection
      if (!isPatternSupported(patternName)) {
        console.warn(`Pattern ${patternName} is not yet supported for client-side detection. Falling back to server API.`);
        
        // Fallback to server API for unsupported patterns (complex patterns like cup_with_handle, etc.)
        const res = await apiInterceptor.fetch(
          `${JAVA_API_URL}/alert/candle-stick/${stockSymbol}?candlePattern=${patternName}`,
          {
            method: 'GET',
            headers: getAuthHeaders()
          }
        );
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Unauthorized - Please login again');
          }
          throw new Error('Failed to fetch pattern data');
        }

        const response = await res.json();
        if (response.code !== 0 || !response.data) {
          return [];
        }

        // Check if this is a complex pattern (has candleIndex but no date)
        const isComplexPattern = response.data.length > 0 && 
          response.data[0].candleIndex !== undefined && 
          !response.data[0].date;

        if (isComplexPattern) {
          return response.data;
        } else {
          const patterns = response.data.map(item => {
            // Convert dateStr (yyyyMMdd) to yyyy-MM-dd if available
            let time;
            if (item.dateStr) {
              time = `${item.dateStr.substring(0, 4)}-${item.dateStr.substring(4, 6)}-${item.dateStr.substring(6, 8)}`;
            } else if (item.date) {
              // Fallback to timestamp if dateStr not available
              time = new Date(item.date * 1000).toISOString().split('T')[0];
            } else {
              console.warn('No date information in pattern data:', item);
              return null;
            }
            
            return {
              time,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
              ...item
            };
          }).filter(item => item !== null);
          return patterns;
        }
      }

      // Client-side pattern detection
      console.log(`Detecting ${patternName} patterns on client-side...`);
      
      // Use cached data if available, otherwise fetch new data
      let stockData = cachedStockData;
      if (!stockData || stockData.length === 0) {
        console.log('No cached data provided, fetching from API...');
        stockData = await stockApi.getStockData(stockSymbol);
      } else {
        console.log(`Using cached data (${stockData.length} candles) for pattern detection`);
      }
      
      if (!stockData || stockData.length === 0) {
        console.warn('No stock data available for pattern detection');
        return [];
      }

      // Detect patterns using client-side logic
      const detectedPatterns = detectCandlePattern(stockData, patternName);
      
      console.log(`Client-side detection found ${detectedPatterns.length} ${patternName} patterns`);
      
      return detectedPatterns;
    } catch (error) {
      console.error('Error fetching pattern data:', error.message);
      return [];
    }
  },

  // Fetch company news (upgraded with vnstock_news sources)
  getCompanyNews: async (stockSymbol, limit = 20, source = 'vci') => {
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/company/news/${stockSymbol}?limit=${limit}&source=${source}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch news');
      }

      const response = await res.json();
      return response;
    } catch (error) {
      console.error('Error fetching news:', error.message);
      throw error;
    }
  },

  // Fetch market news from financial news sources (vnstock_news - Silver package)
  getMarketNews: async (source = 'cafef', limit = 30, keyword = null) => {
    try {
      let url = `${PYTHON_API_URL}/api/market/news?source=${source}&limit=${limit}`;
      if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
      }
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch market news');
      }

      const response = await res.json();
      return response;
    } catch (error) {
      console.error('Error fetching market news:', error.message);
      throw error;
    }
  },

  // Get available news sources
  getNewsSources: async () => {
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/news/sources`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch news sources');
      }

      const response = await res.json();
      return response;
    } catch (error) {
      console.error('Error fetching news sources:', error.message);
      return { sources: [], vnstock_news_available: false };
    }
  },

  // Fetch financial reports
  getFinancialReport: async (stockSymbol, period = 'year') => {
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/company/financial/${stockSymbol}?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch financial report');
      }

      const response = await res.json();
      return response;
    } catch (error) {
      console.error('Error fetching financial report:', error.message);
      throw error;
    }
  },

  // Fetch all stocks from database (for stock search modal)
  getAllStocks: async () => {
    try {
      const res = await fetch(`${JAVA_API_URL}/stock/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch stocks');
      }

      const response = await res.json();
      // Response can be array directly or {stocks: [...]}
      return Array.isArray(response) ? response : (response.data || response);
    } catch (error) {
      console.error('Error fetching stocks:', error.message);
      throw error;
    }
  }
};
