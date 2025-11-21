// API Service
import { detectCandlePattern, isPatternSupported } from './patternDetectionService';

const API_BASE_URL = 'http://localhost:60';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const stockApi = {
  // Fetch stock data
  getStockData: async (stockSymbol) => {
    try {
      const res = await fetch(`${API_BASE_URL}/stock?symbol=${stockSymbol}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
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
        const res = await fetch(
          `${API_BASE_URL}/alert/candle-stick/${stockSymbol}?candlePattern=${patternName}`,
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
          const patterns = response.data.map(item => ({
            time: new Date(item.date * 1000).toISOString().split('T')[0],
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            ...item
          }));
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
  }
};
