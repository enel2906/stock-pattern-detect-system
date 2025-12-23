import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/adminApi';
import './AdminPage.css';

const AdminPage = () => {
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('users');
  
  // User management state
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Stock management state
  const [stocks, setStocks] = useState([]);
  const [stockStats, setStockStats] = useState(null);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [deleteStockConfirm, setDeleteStockConfirm] = useState(null);
  const [stockActionLoading, setStockActionLoading] = useState(null);
  
  // Add Stock Modal state
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [searchExchange, setSearchExchange] = useState('HOSE');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [addingStock, setAddingStock] = useState(null);
  
  // Stock list filter state
  const [stockFilterQuery, setStockFilterQuery] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      if (!isAdmin) return;
      
      try {
        setLoadingData(true);
        const [usersData, statsData] = await Promise.all([
          adminApi.getAllUsers(),
          adminApi.getStats(),
        ]);
        setUsers(usersData);
        setStats(statsData);
        setError(null);
      } catch (err) {
        console.error('Failed to load admin data:', err);
        setError(err.message === 'ACCESS_DENIED' 
          ? 'Bạn không có quyền truy cập trang này' 
          : 'Không thể tải dữ liệu');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [isAdmin]);

  // Load stock data when switching to stocks tab
  const loadStockData = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      setLoadingStocks(true);
      setStockError(null);
      const [stocksData, statsData] = await Promise.all([
        adminApi.getAllStocks(),
        adminApi.getStocksStats(),
      ]);
      // Handle API response - stocksData có thể là array hoặc object {stocks: [...], total: ...}
      const stocksArray = Array.isArray(stocksData) 
        ? stocksData 
        : (stocksData?.stocks || []);
      setStocks(stocksArray);
      
      // Handle stats response
      const normalizedStats = {
        total: statsData?.total || 0,
        by_market: statsData?.byMarket || statsData?.by_market || {}
      };
      setStockStats(normalizedStats);
    } catch (err) {
      console.error('Failed to load stocks data:', err);
      setStockError('Không thể tải dữ liệu cổ phiếu');
    } finally {
      setLoadingStocks(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'stocks' && stocks.length === 0) {
      loadStockData();
    }
  }, [activeTab, stocks.length, loadStockData]);

  // Load available stocks when exchange changes in Add Stock Modal
  const loadAvailableStocks = useCallback(async (exchange) => {
    try {
      setLoadingAvailable(true);
      const data = await adminApi.getAvailableStocks(exchange, '');
      const stocksArray = Array.isArray(data) ? data : (data?.stocks || []);
      setAvailableStocks(stocksArray);
    } catch (err) {
      console.error('Failed to load available stocks:', err);
    } finally {
      setLoadingAvailable(false);
    }
  }, []);

  // Filter available stocks based on search query
  const filteredAvailableStocks = availableStocks.filter(stock => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      stock.symbol?.toLowerCase().includes(query) ||
      stock.name?.toLowerCase().includes(query) ||
      stock.organ_name?.toLowerCase().includes(query)
    );
  });

  // Filter stocks in list based on search
  const filteredStocks = stocks.filter(stock => {
    if (!stockFilterQuery.trim()) return true;
    const query = stockFilterQuery.toLowerCase();
    return (
      stock.symbol?.toLowerCase().includes(query) ||
      stock.name?.toLowerCase().includes(query)
    );
  });

  // Add stock
  const handleAddStock = async (stock) => {
    try {
      setAddingStock(stock.symbol);
      await adminApi.addStock({
        symbol: stock.symbol,
        name: stock.name || stock.organ_name || stock.symbol,
        market: searchExchange,
      });
      // Reload stocks
      await loadStockData();
      // Remove from available list
      setAvailableStocks(prev => prev.filter(s => s.symbol !== stock.symbol));
      alert(`Đã thêm mã ${stock.symbol} thành công!`);
    } catch (err) {
      console.error('Failed to add stock:', err);
      alert('Không thể thêm cổ phiếu: ' + err.message);
    } finally {
      setAddingStock(null);
    }
  };

  // Delete stock
  const handleDeleteStock = async (stockId) => {
    try {
      setStockActionLoading(stockId);
      await adminApi.deleteStock(stockId);
      setStocks(prev => prev.filter(s => (s._id || s.id) !== stockId));
      // Update stats
      const statsData = await adminApi.getStocksStats();
      setStockStats(statsData);
      setDeleteStockConfirm(null);
    } catch (err) {
      console.error('Failed to delete stock:', err);
      alert('Không thể xóa cổ phiếu: ' + err.message);
    } finally {
      setStockActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setActionLoading(userId);
      await adminApi.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers - 1,
        userCount: prev.userCount - 1,
      }));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Không thể xóa người dùng: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      setActionLoading(userId);
      await adminApi.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      // Update stats
      const statsData = await adminApi.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Không thể cập nhật role: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || loadingData) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-error">
          <h2>⚠️ Lỗi</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Về trang chủ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>🛡️ Admin Dashboard</h1>
          <span className="admin-user">Xin chào, {user?.fullName || user?.username}</span>
        </div>
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Về trang chủ
        </button>
      </header>

      {/* Tab Navigation */}
      <nav className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Quản lý người dùng
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('stocks')}
        >
          📈 Quản lý cổ phiếu
        </button>
      </nav>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <>
          {/* User Statistics */}
          <section className="admin-stats">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Tổng người dùng</h3>
                <span className="stat-value">{stats?.totalUsers || 0}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👤</div>
              <div className="stat-info">
                <h3>Người dùng thường</h3>
                <span className="stat-value">{stats?.userCount || 0}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛡️</div>
              <div className="stat-info">
                <h3>Quản trị viên</h3>
                <span className="stat-value">{stats?.adminCount || 0}</span>
              </div>
            </div>
          </section>

          {/* Users Table */}
          <section className="admin-users">
            <h2>📋 Danh sách người dùng</h2>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Họ tên</th>
                    <th>Role</th>
                    <th>Phương thức đăng ký</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem.id} className={userItem.role === 'ADMIN' ? 'admin-row' : ''}>
                      <td className="username-cell">
                        {userItem.username}
                        {userItem.id === user?.id && <span className="you-badge">Bạn</span>}
                      </td>
                      <td>{userItem.email}</td>
                      <td>{userItem.fullName || 'N/A'}</td>
                      <td>
                        <span className={`role-badge ${userItem.role?.toLowerCase()}`}>
                          {userItem.role === 'ADMIN' ? '🛡️ Admin' : '👤 User'}
                        </span>
                      </td>
                      <td>
                        <span className={`auth-badge ${userItem.authProvider?.toLowerCase()}`}>
                          {userItem.authProvider === 'GOOGLE' ? '🔵 Google' : '📧 Local'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {userItem.id !== user?.id && (
                          <>
                            <select
                              value={userItem.role}
                              onChange={(e) => handleChangeRole(userItem.id, e.target.value)}
                              disabled={actionLoading === userItem.id}
                              className="role-select"
                            >
                              <option value="USER">User</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <button
                              className="delete-btn"
                              onClick={() => setDeleteConfirm(userItem.id)}
                              disabled={actionLoading === userItem.id}
                            >
                              {actionLoading === userItem.id ? '...' : '🗑️'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Stocks Tab Content */}
      {activeTab === 'stocks' && (
        <>
          {/* Stock Statistics */}
          <section className="admin-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Tổng cổ phiếu</h3>
                <span className="stat-value">{stockStats?.total || 0}</span>
              </div>
            </div>
            <div className="stat-card hose">
              <div className="stat-icon">🔴</div>
              <div className="stat-info">
                <h3>HOSE</h3>
                <span className="stat-value">{stockStats?.by_market?.HOSE || 0}</span>
              </div>
            </div>
            <div className="stat-card hnx">
              <div className="stat-icon">🟡</div>
              <div className="stat-info">
                <h3>HNX</h3>
                <span className="stat-value">{stockStats?.by_market?.HNX || 0}</span>
              </div>
            </div>
            <div className="stat-card upcom">
              <div className="stat-icon">🟢</div>
              <div className="stat-info">
                <h3>UPCOM</h3>
                <span className="stat-value">{stockStats?.by_market?.UPCOM || 0}</span>
              </div>
            </div>
            <div className="stat-card us">
              <div className="stat-icon">🇺🇸</div>
              <div className="stat-info">
                <h3>US</h3>
                <span className="stat-value">{stockStats?.by_market?.US || 0}</span>
              </div>
            </div>
          </section>

          {/* Stock Management */}
          <section className="admin-stocks">
            <div className="stocks-header">
              <h2>📈 Danh sách cổ phiếu theo dõi</h2>
              <div className="stocks-header-actions">
                <div className="stock-search-box">
                  <input
                    type="text"
                    placeholder="🔍 Tìm mã cổ phiếu..."
                    value={stockFilterQuery}
                    onChange={(e) => setStockFilterQuery(e.target.value)}
                    className="stock-filter-input"
                  />
                </div>
                <button 
                  className="add-stock-btn"
                  onClick={() => {
                    setShowAddStockModal(true);
                    setSearchQuery('');
                    loadAvailableStocks(searchExchange);
                  }}
                >
                  ➕ Thêm mã cổ phiếu
                </button>
              </div>
            </div>

            {loadingStocks ? (
              <div className="loading-stocks">
                <div className="spinner"></div>
                <p>Đang tải danh sách cổ phiếu...</p>
              </div>
            ) : stockError ? (
              <div className="stock-error">
                <p>{stockError}</p>
                <button onClick={loadStockData}>Thử lại</button>
              </div>
            ) : (
              <div className="stocks-table-container">
                <table className="stocks-table">
                  <thead>
                    <tr>
                      <th>Mã CK</th>
                      <th>Tên công ty</th>
                      <th>Sàn</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="no-data">
                          {stocks.length === 0 
                            ? 'Chưa có mã cổ phiếu nào. Nhấn "Thêm mã cổ phiếu" để bắt đầu.'
                            : `Không tìm thấy mã cổ phiếu "${stockFilterQuery}"`}
                        </td>
                      </tr>
                    ) : (
                      filteredStocks.map((stock) => (
                        <tr key={stock._id || stock.id} className={`market-${stock.market?.toLowerCase()}`}>
                          <td className="symbol-cell">
                            <span className="stock-symbol">{stock.symbol}</span>
                          </td>
                          <td>{stock.name || 'N/A'}</td>
                          <td>
                            <span className={`market-badge ${stock.market?.toLowerCase()}`}>
                              {stock.market}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button
                              className="delete-btn"
                              onClick={() => setDeleteStockConfirm(stock._id || stock.id)}
                              disabled={stockActionLoading === (stock._id || stock.id)}
                            >
                              {stockActionLoading === (stock._id || stock.id) ? '...' : '🗑️'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa người dùng này?</p>
            <p className="warning-text">Hành động này không thể hoàn tác!</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setDeleteConfirm(null)}
              >
                Hủy
              </button>
              <button 
                className="confirm-delete-btn" 
                onClick={() => handleDeleteUser(deleteConfirm)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Stock Confirmation Modal */}
      {deleteStockConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteStockConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Xác nhận xóa cổ phiếu</h3>
            <p>Bạn có chắc chắn muốn xóa mã cổ phiếu này?</p>
            <p className="warning-text">Dữ liệu giá lịch sử của mã này cũng sẽ bị xóa!</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setDeleteStockConfirm(null)}
              >
                Hủy
              </button>
              <button 
                className="confirm-delete-btn" 
                onClick={() => handleDeleteStock(deleteStockConfirm)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="modal-overlay" onClick={() => setShowAddStockModal(false)}>
          <div className="modal-content add-stock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Thêm mã cổ phiếu</h3>
              <button className="close-modal-btn" onClick={() => setShowAddStockModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="search-stock-form">
              <div className="search-row">
                <select 
                  value={searchExchange} 
                  onChange={(e) => {
                    setSearchExchange(e.target.value);
                    setSearchQuery('');
                    loadAvailableStocks(e.target.value);
                  }}
                  className="exchange-select"
                >
                  <option value="HOSE">HOSE</option>
                  <option value="HNX">HNX</option>
                  <option value="UPCOM">UPCOM</option>
                </select>
                <input
                  type="text"
                  placeholder="Tìm theo mã hoặc tên công ty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="available-stocks-list">
              {loadingAvailable ? (
                <div className="loading-available">
                  <div className="spinner"></div>
                  <p>Đang tải danh sách...</p>
                </div>
              ) : filteredAvailableStocks.length === 0 ? (
                <div className="no-results">
                  {availableStocks.length === 0 
                    ? <p>Không có mã cổ phiếu nào</p>
                    : <p>Không tìm thấy mã "{searchQuery}"</p>}
                </div>
              ) : (
                <table className="available-stocks-table">
                  <thead>
                    <tr>
                      <th>Mã CK</th>
                      <th>Tên công ty</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAvailableStocks.map((stock) => {
                      const isAdded = stocks.some(s => s.symbol === stock.symbol);
                      return (
                        <tr key={stock.symbol} className={isAdded ? 'already-added' : ''}>
                          <td className="symbol-cell">{stock.symbol}</td>
                          <td>{stock.name || stock.organ_name || stock.symbol}</td>
                          <td>
                            {isAdded ? (
                              <span className="added-badge">✓ Đã thêm</span>
                            ) : (
                              <button
                                className="add-btn"
                                onClick={() => handleAddStock(stock)}
                                disabled={addingStock === stock.symbol}
                              >
                                {addingStock === stock.symbol ? 'Đang thêm...' : '➕ Thêm'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
