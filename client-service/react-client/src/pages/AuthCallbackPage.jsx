import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authApi';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        console.error('OAuth error:', errorParam);
        setError('Đăng nhập thất bại: ' + errorParam);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      if (accessToken && refreshToken) {
        try {
          // Save tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          // Fetch user data to verify
          const userData = await authApi.getCurrentUser(accessToken);
          
          if (userData) {
            // Reload to apply auth state with proper context
            window.location.href = '/';
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (err) {
          console.error('Failed to process OAuth callback:', err);
          setError('Không thể tải thông tin người dùng');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setTimeout(() => navigate('/login'), 2000);
        }
      } else if (user) {
        navigate('/');
      } else {
        setError('Thiếu thông tin xác thực');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, user]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
            <p style={{ color: 'var(--error)', fontWeight: 'bold' }}>{error}</p>
            <p style={{ marginTop: '10px', fontSize: '14px', opacity: 0.7 }}>
              Đang chuyển hướng về trang đăng nhập...
            </p>
          </>
        ) : (
          <>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '4px solid var(--accent)', 
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Đang xử lý đăng nhập...</p>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallbackPage;
