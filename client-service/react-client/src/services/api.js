// API Service
const API_BASE_URL = 'http://localhost:60';

export const stockApi = {
  // Fetch stock data
  getStockData: async (stockSymbol) => {
    try {
      const res = await fetch(`${API_BASE_URL}/stock?symbol=${stockSymbol}`);
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }

      const response = await res.json();
      if (response.code !== 0 || !response.data) {
        throw new Error('Invalid data format');
      }

      const cdata = response.data.map(item => ({
        time: new Date(item.date * 1000).toISOString().split('T')[0],
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      return cdata;
    } catch (error) {
      console.error('Error fetching data:', error.message);
      return [];
    }
  },

  // Fetch pattern data
  getPatternData: async (stockSymbol, patternName) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/alert/candle-stick/${stockSymbol}?candlePattern=${patternName}`
      );
      
      if (!res.ok) {
        throw new Error('Failed to fetch pattern data');
      }

      const response = await res.json();
      if (response.code !== 0 || !response.data) {
        return [];
      }

      // Transform data to match chart format
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
    } catch (error) {
      console.error('Error fetching pattern data:', error.message);
      return [];
    }
  }
};
