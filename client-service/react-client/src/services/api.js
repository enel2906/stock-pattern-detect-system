// API Service
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

  // Fetch pattern data
  getPatternData: async (stockSymbol, patternName) => {
    try {
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
      // Complex patterns: double, flag, pennant, triangle, head_and_shoulders
      const isComplexPattern = response.data.length > 0 && 
        response.data[0].candleIndex !== undefined && 
        !response.data[0].date;

      if (isComplexPattern) {
        // For complex patterns, return raw data (candleIndex will be used to map to originalData)
        return response.data;
      } else {
        // For simple patterns, transform data to match chart format
        const patterns = response.data.map(item => ({
          time: new Date(item.date * 1000).toISOString().split('T')[0],
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          // Keep additional pattern-specific fields
          ...item
        }));

        return patterns;
      }
    } catch (error) {
      console.error('Error fetching pattern data:', error.message);
      return [];
    }
  }
};
