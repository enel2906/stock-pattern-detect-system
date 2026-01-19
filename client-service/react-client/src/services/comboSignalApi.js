/**
 * Combo Signal API Service
 * Service gọi API lấy combo signals từ server và quản lý alert settings của user
 */

import apiInterceptor from './apiInterceptor';
import { API_BASE_URL } from '../config/apiConfig';

// Cache cho combo signals (tránh gọi API nhiều lần)
let comboSignalsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Helper function to get auth headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Kiểm tra cache còn hợp lệ không
 */
const isCacheValid = () => {
  return comboSignalsCache && cacheTimestamp && 
         (Date.now() - cacheTimestamp) < CACHE_DURATION;
};

/**
 * Clear cache (khi cần refresh dữ liệu)
 */
export const clearComboSignalsCache = () => {
  comboSignalsCache = null;
  cacheTimestamp = null;
};

// ===== COMBO SIGNALS APIs (Public) =====

/**
 * Lấy tất cả combo signals từ server
 * GET /api/combo-signals
 * @returns {Promise<Array>} Danh sách combo signals
 */
export const fetchAllComboSignals = async (forceRefresh = false) => {
  // Trả về cache nếu còn hợp lệ
  if (!forceRefresh && isCacheValid()) {
    return comboSignalsCache;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/combo-signals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch combo signals');
    }

    const response = await res.json();
    
    if (response.code !== 0) {
      throw new Error(response.data || 'Failed to fetch combo signals');
    }

    // Cập nhật cache
    comboSignalsCache = response.data || [];
    cacheTimestamp = Date.now();

    return comboSignalsCache;
  } catch (error) {
    console.error('Error fetching combo signals:', error);
    throw error;
  }
};

/**
 * Lấy combo signals đã nhóm theo sentiment
 * GET /api/combo-signals/grouped
 * @returns {Promise<Object>} { bullish: [], bearish: [], neutral: [], total: number }
 */
export const fetchComboSignalsGrouped = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/combo-signals/grouped`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch grouped combo signals');
    }

    const response = await res.json();
    
    if (response.code !== 0) {
      throw new Error(response.data || 'Failed to fetch grouped combo signals');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching grouped combo signals:', error);
    throw error;
  }
};

/**
 * Lấy combo signal theo ID
 * GET /api/combo-signals/{comboId}
 * @param {string} comboId - ID của combo signal
 * @returns {Promise<Object>} Combo signal object
 */
export const fetchComboSignalById = async (comboId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/combo-signals/${comboId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch combo signal');
    }

    const response = await res.json();
    
    if (response.code !== 0) {
      throw new Error(response.data || 'Failed to fetch combo signal');
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching combo signal ${comboId}:`, error);
    throw error;
  }
};

// ===== ALERT SETTINGS APIs (Authenticated) =====

/**
 * Lấy danh sách comboSignalId mà user đã bật
 * GET /api/alert-settings/active-ids
 * @returns {Promise<Array<string>>} Danh sách comboSignalId đã bật
 */
export const fetchActiveComboSignalIds = async () => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}/alert-settings/active-ids`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error('Failed to fetch active combo signal ids');
    }

    const response = await res.json();
    
    if (response.code !== 0) {
      throw new Error(response.data || 'Failed to fetch active combo signal ids');
    }

    return response.data || [];
  } catch (error) {
    console.error('Error fetching active combo signal ids:', error);
    throw error;
  }
};

/**
 * Toggle (bật/tắt) một combo signal
 * PUT /api/alert-settings/{comboSignalId}/toggle
 * @param {string} comboSignalId - ID của combo signal
 * @returns {Promise<Object>} { comboSignalId, enabled, message }
 */
export const toggleComboSignal = async (comboSignalId) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}/alert-settings/${comboSignalId}/toggle`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.data || 'Failed to toggle combo signal');
    }

    const response = await res.json();
    
    if (response.code !== 0) {
      throw new Error(response.data || 'Failed to toggle combo signal');
    }

    return response.data;
  } catch (error) {
    console.error(`Error toggling combo signal ${comboSignalId}:`, error);
    throw error;
  }
};

/**
 * Bật một combo signal
 * POST /api/alert-settings/{comboSignalId}
 * @param {string} comboSignalId - ID của combo signal
 * @returns {Promise<Object>} AlertSetting object
 */
export const enableComboSignal = async (comboSignalId) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}/alert-settings/${comboSignalId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.data || 'Failed to enable combo signal');
    }

    const response = await res.json();
    
    if (response.code !== 0) {
      throw new Error(response.data || 'Failed to enable combo signal');
    }

    return response.data;
  } catch (error) {
    console.error(`Error enabling combo signal ${comboSignalId}:`, error);
    throw error;
  }
};

/**
 * Tắt một combo signal
 * DELETE /api/alert-settings/{comboSignalId}
 * @param {string} comboSignalId - ID của combo signal
 * @returns {Promise<string>} Success message
 */
export const disableComboSignal = async (comboSignalId) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}/alert-settings/${comboSignalId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error('Failed to disable combo signal');
    }

    const response = await res.json();
    
    if (response.code !== 0) {
      throw new Error(response.data || 'Failed to disable combo signal');
    }

    return response.data;
  } catch (error) {
    console.error(`Error disabling combo signal ${comboSignalId}:`, error);
    throw error;
  }
};

/**
 * Kiểm tra user có bật combo signal này không
 * GET /api/alert-settings/{comboSignalId}/status
 * @param {string} comboSignalId - ID của combo signal
 * @returns {Promise<boolean>} true nếu đã bật
 */
export const checkComboSignalStatus = async (comboSignalId) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}/alert-settings/${comboSignalId}/status`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      return false;
    }

    const response = await res.json();
    return response.data === true;
  } catch (error) {
    console.error(`Error checking combo signal status ${comboSignalId}:`, error);
    return false;
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Convert API response thành format giống comboSignalDefinitions.js
 * để tương thích với advanceSignalService.js
 */
export const convertToLocalFormat = (apiComboSignal) => {
  if (!apiComboSignal) return null;
  
  return {
    id: apiComboSignal.comboId,
    name: apiComboSignal.name,
    description: apiComboSignal.description,
    pattern: apiComboSignal.pattern,
    indicators: apiComboSignal.indicators || [],
    prediction: apiComboSignal.prediction || {},
    sentiment: apiComboSignal.sentiment,
    reliability: apiComboSignal.reliability,
    icon: apiComboSignal.icon,
    color: apiComboSignal.color
  };
};

/**
 * Convert danh sách combo signals từ API sang format local
 */
export const convertAllToLocalFormat = (apiComboSignals) => {
  if (!Array.isArray(apiComboSignals)) return [];
  return apiComboSignals.map(convertToLocalFormat);
};

/**
 * Lấy tất cả combo signals và convert sang format local
 * Sử dụng thay thế cho getAllComboSignals() từ comboSignalDefinitions.js
 */
export const getComboSignalsFromServer = async () => {
  try {
    const signals = await fetchAllComboSignals();
    return convertAllToLocalFormat(signals);
  } catch (error) {
    console.error('Error getting combo signals from server:', error);
    return [];
  }
};

/**
 * Lấy combo signal theo ID từ server
 * Sử dụng thay thế cho getComboSignal() từ comboSignalDefinitions.js
 */
export const getComboSignalFromServer = async (comboId) => {
  try {
    const signal = await fetchComboSignalById(comboId);
    return convertToLocalFormat(signal);
  } catch (error) {
    console.error(`Error getting combo signal ${comboId} from server:`, error);
    return null;
  }
};

export default {
  // Combo Signals APIs
  fetchAllComboSignals,
  fetchComboSignalsGrouped,
  fetchComboSignalById,
  
  // Alert Settings APIs
  fetchActiveComboSignalIds,
  toggleComboSignal,
  enableComboSignal,
  disableComboSignal,
  checkComboSignalStatus,
  
  // Helper functions
  convertToLocalFormat,
  convertAllToLocalFormat,
  getComboSignalsFromServer,
  getComboSignalFromServer,
  clearComboSignalsCache
};
