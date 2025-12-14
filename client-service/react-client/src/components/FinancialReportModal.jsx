import { useState, useEffect } from 'react';
import { stockApi } from '../services/api';
import './FinancialReportModal.css';

const FinancialReportModal = ({ isOpen, onClose, stockSymbol }) => {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('year'); // 'year' or 'quarter'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'balance', 'income', 'cashflow'

  useEffect(() => {
    if (isOpen && stockSymbol) {
      fetchFinancialReport();
    }
  }, [isOpen, stockSymbol, period]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await stockApi.getFinancialReport(stockSymbol, period);
      
      if (data.error) {
        setError(data.error);
        setFinancialData(null);
      } else {
        setFinancialData(data);
      }
    } catch (err) {
      console.error('Error fetching financial report:', err);
      setError('Không thể tải báo cáo tài chính. Vui lòng thử lại sau.');
      setFinancialData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return 'N/A';
    
    try {
      const number = parseFloat(num);
      if (isNaN(number)) return 'N/A';
      
      return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      }).format(number);
    } catch {
      return 'N/A';
    }
  };

  const renderOverview = () => {
    if (!financialData?.ratios || financialData.ratios.length === 0) {
      return <div className="financial-empty">Không có dữ liệu chỉ số tài chính</div>;
    }

    const ratios = financialData.ratios;
    
    return (
      <div className="financial-overview">
        <h3 className="section-title">📊 Chỉ Số Tài Chính</h3>
        <div className="ratios-grid">
          {ratios.slice(0, 12).map((row, index) => (
            <div key={index} className="ratio-card">
              <div className="ratio-label">{Object.keys(row)[0] || `Chỉ số ${index + 1}`}</div>
              <div className="ratio-value">{formatNumber(Object.values(row)[1])}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!financialData?.balanceSheet || financialData.balanceSheet.length === 0) {
      return <div className="financial-empty">Không có dữ liệu bảng cân đối kế toán</div>;
    }

    const data = financialData.balanceSheet;
    const years = data.map(row => row.yearReport || row.quarterReport);
    
    return (
      <div className="financial-table-wrapper">
        <h3 className="section-title">💼 Bảng Cân Đối Kế Toán</h3>
        <div className="financial-table">
          <table>
            <thead>
              <tr>
                <th>Khoản mục</th>
                {years.map((year, idx) => (
                  <th key={idx}>{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(data[0] || {}).slice(2, 10).map((key, idx) => (
                <tr key={idx}>
                  <td className="item-name">{key}</td>
                  {data.map((row, rowIdx) => (
                    <td key={rowIdx}>{formatNumber(row[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!financialData?.incomeStatement || financialData.incomeStatement.length === 0) {
      return <div className="financial-empty">Không có dữ liệu báo cáo kết quả kinh doanh</div>;
    }

    const data = financialData.incomeStatement;
    const years = data.map(row => row.yearReport || row.quarterReport);
    
    return (
      <div className="financial-table-wrapper">
        <h3 className="section-title">💰 Báo Cáo Kết Quả Kinh Doanh</h3>
        <div className="financial-table">
          <table>
            <thead>
              <tr>
                <th>Khoản mục</th>
                {years.map((year, idx) => (
                  <th key={idx}>{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(data[0] || {}).slice(2, 10).map((key, idx) => (
                <tr key={idx}>
                  <td className="item-name">{key}</td>
                  {data.map((row, rowIdx) => (
                    <td key={rowIdx}>{formatNumber(row[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!financialData?.cashFlow || financialData.cashFlow.length === 0) {
      return <div className="financial-empty">Không có dữ liệu lưu chuyển tiền tệ</div>;
    }

    const data = financialData.cashFlow;
    const years = data.map(row => row.yearReport || row.quarterReport);
    
    return (
      <div className="financial-table-wrapper">
        <h3 className="section-title">💵 Lưu Chuyển Tiền Tệ</h3>
        <div className="financial-table">
          <table>
            <thead>
              <tr>
                <th>Khoản mục</th>
                {years.map((year, idx) => (
                  <th key={idx}>{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(data[0] || {}).slice(2, 10).map((key, idx) => (
                <tr key={idx}>
                  <td className="item-name">{key}</td>
                  {data.map((row, rowIdx) => (
                    <td key={rowIdx}>{formatNumber(row[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="financial-modal-overlay" onClick={onClose}>
      <div className="financial-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="financial-modal-header">
          <div className="financial-modal-title">
            <span className="financial-icon">📈</span>
            <h2>Báo Cáo Tài Chính - {stockSymbol}</h2>
          </div>
          <button className="financial-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="financial-controls">
          <div className="period-selector">
            <button
              className={`period-btn ${period === 'year' ? 'active' : ''}`}
              onClick={() => setPeriod('year')}
            >
              📅 Năm
            </button>
            <button
              className={`period-btn ${period === 'quarter' ? 'active' : ''}`}
              onClick={() => setPeriod('quarter')}
            >
              📆 Quý
            </button>
          </div>

          <div className="tab-selector">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng Quan
            </button>
            <button
              className={`tab-btn ${activeTab === 'balance' ? 'active' : ''}`}
              onClick={() => setActiveTab('balance')}
            >
              Cân Đối KT
            </button>
            <button
              className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
              onClick={() => setActiveTab('income')}
            >
              Kết Quả KD
            </button>
            <button
              className={`tab-btn ${activeTab === 'cashflow' ? 'active' : ''}`}
              onClick={() => setActiveTab('cashflow')}
            >
              Lưu Chuyển TT
            </button>
          </div>
        </div>

        <div className="financial-modal-body">
          {loading && (
            <div className="financial-loading">
              <div className="financial-spinner"></div>
              <p>Đang tải báo cáo tài chính...</p>
            </div>
          )}

          {error && (
            <div className="financial-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchFinancialReport}>
                🔄 Thử lại
              </button>
            </div>
          )}

          {!loading && !error && financialData && (
            <div className="financial-content">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'balance' && renderBalanceSheet()}
              {activeTab === 'income' && renderIncomeStatement()}
              {activeTab === 'cashflow' && renderCashFlow()}
            </div>
          )}
        </div>

        <div className="financial-modal-footer">
          <button className="financial-close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportModal;
