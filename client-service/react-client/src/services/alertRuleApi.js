// Alert Rule API service

import apiInterceptor from './apiInterceptor';

const API_BASE_URL = 'http://localhost:60';
const ALERT_RULE_BASE_URL = '/api/alert-rules';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Create a new alert rule
 */
export const createAlertRule = async (ruleData) => {
  try {
    console.log('Creating alert rule with data:', ruleData);
    
    const res = await apiInterceptor.fetch(`${API_BASE_URL}${ALERT_RULE_BASE_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ruleData)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Server error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Failed to create alert rule' };
      }
      
      throw new Error(errorData.message || errorData.data || 'Failed to create alert rule');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error creating alert rule:', error);
    throw error;
  }
};

/**
 * Update an existing alert rule
 */
export const updateAlertRule = async (ruleId, ruleData) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}${ALERT_RULE_BASE_URL}/${ruleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(ruleData)
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to update alert rule' }));
      throw new Error(error.message || 'Failed to update alert rule');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error updating alert rule:', error);
    throw error;
  }
};

/**
 * Delete an alert rule
 */
export const deleteAlertRule = async (ruleId) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}${ALERT_RULE_BASE_URL}/${ruleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to delete alert rule' }));
      throw new Error(error.message || 'Failed to delete alert rule');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    throw error;
  }
};

/**
 * Get a single alert rule
 */
export const getAlertRule = async (ruleId) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}${ALERT_RULE_BASE_URL}/${ruleId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to fetch alert rule' }));
      throw new Error(error.message || 'Failed to fetch alert rule');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching alert rule:', error);
    throw error;
  }
};

/**
 * Get all alert rules for the current user
 */
export const getAllAlertRules = async () => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}${ALERT_RULE_BASE_URL}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to fetch alert rules' }));
      throw new Error(error.message || 'Failed to fetch alert rules');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    throw error;
  }
};

/**
 * Get alert rules for a specific symbol
 */
export const getAlertRulesBySymbol = async (symbol) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}${ALERT_RULE_BASE_URL}/symbol/${symbol}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to fetch alert rules for symbol' }));
      throw new Error(error.message || 'Failed to fetch alert rules for symbol');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching alert rules for symbol:', error);
    throw error;
  }
};

/**
 * Toggle rule status (ACTIVE <-> PAUSED)
 */
export const toggleAlertRuleStatus = async (ruleId) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}${ALERT_RULE_BASE_URL}/${ruleId}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to toggle alert rule status' }));
      throw new Error(error.message || 'Failed to toggle alert rule status');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error toggling alert rule status:', error);
    throw error;
  }
};

/**
 * Evaluate alert rules for current chart data
 * This would be called when chart data updates
 */
export const evaluateAlertRules = async (symbol, candleData) => {
  try {
    const res = await apiInterceptor.fetch(`${API_BASE_URL}/api/alert-rules/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ symbol, candleData })
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to evaluate alert rules' }));
      throw new Error(error.message || 'Failed to evaluate alert rules');
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error evaluating alert rules:', error);
    throw error;
  }
};

const alertRuleApi = {
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertRule,
  getAllAlertRules,
  getAlertRulesBySymbol,
  toggleAlertRuleStatus,
  evaluateAlertRules
};

export default alertRuleApi;
