// Watchlist API Service
import { PYTHON_API_URL as DATA_SERVICE_URL, useProxy } from '../config/apiConfig';

/**
 * Lấy bảng giá real-time từ data-service
 * @param {string[]} symbols - Danh sách mã cổ phiếu (optional)
 * @returns {Promise} Response chứa data array và timestamp
 */
export const getPriceBoard = async (symbols = null) => {
  try {
    // When using proxy, DATA_SERVICE_URL already includes /data-api
    // which gets rewritten to /api by Vite proxy
    const apiPath = useProxy ? '/price-board' : '/api/price-board';
    const url = symbols 
      ? `${DATA_SERVICE_URL}${apiPath}?symbols=${symbols.join(',')}` 
      : `${DATA_SERVICE_URL}${apiPath}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching price board:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của một mã cổ phiếu
 * @param {string} symbol - Mã cổ phiếu
 * @returns {Promise} Response chứa thông tin stock
 */
export const getStockInfo = async (symbol) => {
  try {
    const apiPath = useProxy ? '/stocks' : '/api/stocks';
    const response = await fetch(`${DATA_SERVICE_URL}${apiPath}?symbol=${symbol}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stock info:', error);
    throw error;
  }
};

