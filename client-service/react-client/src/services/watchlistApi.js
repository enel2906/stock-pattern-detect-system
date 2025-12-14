// Watchlist API Service
const DATA_SERVICE_URL = 'http://localhost:8000';

/**
 * Lấy bảng giá real-time từ data-service
 * @param {string[]} symbols - Danh sách mã cổ phiếu (optional)
 * @returns {Promise} Response chứa data array và timestamp
 */
export const getPriceBoard = async (symbols = null) => {
  try {
    const url = symbols 
      ? `${DATA_SERVICE_URL}/api/price-board?symbols=${symbols.join(',')}` 
      : `${DATA_SERVICE_URL}/api/price-board`;
    
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
    const response = await fetch(`${DATA_SERVICE_URL}/api/stocks?symbol=${symbol}`, {
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

