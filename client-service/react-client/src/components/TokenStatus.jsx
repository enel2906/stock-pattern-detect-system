// Token Status Display Component (for debugging)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTokenExpirationTime, formatTimeRemaining, decodeToken } from '../utils/tokenUtils';

const TokenStatus = () => {
  const { accessToken, isAuthenticated } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      setTimeRemaining(0);
      setTokenInfo(null);
      return;
    }

    // Decode token to get info
    const decoded = decodeToken(accessToken);
    setTokenInfo(decoded);

    // Update time remaining every second
    const interval = setInterval(() => {
      const remaining = getTokenExpirationTime(accessToken);
      setTimeRemaining(remaining);

      // Clear interval if token expired
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [accessToken]);

  if (!isAuthenticated || !accessToken) {
    return null;
  }

  const isExpired = timeRemaining <= 0;
  const isExpiringSoon = timeRemaining > 0 && timeRemaining < 60000; // Less than 1 minute

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: isExpired ? '#ef5350' : isExpiringSoon ? '#FFA500' : '#26a69a',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        maxWidth: '250px'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        🔐 Token Status
      </div>
      <div style={{ fontSize: '11px' }}>
        {isExpired ? (
          '⚠️ Expired - Refreshing...'
        ) : (
          <>
            ⏱️ Expires in: {formatTimeRemaining(timeRemaining)}
            {tokenInfo && (
              <div style={{ marginTop: '4px', opacity: 0.8 }}>
                User: {tokenInfo.sub}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TokenStatus;
