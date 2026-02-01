import { useState, useEffect } from 'react';
import { stockApi } from '../services/api';
import './FinancialReportModal.css';

const FinancialReportModal = ({ isOpen, onClose, stockSymbol }) => {
  const [financialData, setFinancialData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('year'); // 'year' hoặc 'quarter'
  const [activeTab, setActiveTab] = useState('company'); // 'company', 'ratios', 'balance', 'income', 'cashflow'

  useEffect(() => {
    if (isOpen && stockSymbol) {
      // Tab "Thông tin công ty" chỉ cần load 1 lần
      if (activeTab === 'company') {
        fetchCompanyInfo();
      } else {
        fetchFinancialReport();
      }
    }
  }, [isOpen, stockSymbol, period, activeTab]);

  // Xử lý phím ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await stockApi.getCompanyInfo(stockSymbol);
      
      if (data.error) {
        setError(data.error);
        setCompanyInfo(null);
      } else {
        setCompanyInfo(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin công ty:', err);
      setError('Không thể tải thông tin công ty. Vui lòng thử lại sau.');
      setCompanyInfo(null);
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Lỗi khi tải báo cáo tài chính:', err);
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
      
      // Nếu số lớn hơn 1 tỷ, hiển thị dạng tỷ
      if (Math.abs(number) >= 1e9) {
        return (number / 1e9).toFixed(2) + ' tỷ';
      }
      // Nếu số lớn hơn 1 triệu, hiển thị dạng triệu
      if (Math.abs(number) >= 1e6) {
        return (number / 1e6).toFixed(2) + ' triệu';
      }
      
      return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      }).format(number);
    } catch {
      return 'N/A';
    }
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined || num === '') return 'N/A';
    try {
      const number = parseFloat(num);
      if (isNaN(number)) return 'N/A';
      return (number * 100).toFixed(2) + '%';
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  // ===================== TAB: THÔNG TIN CÔNG TY =====================
  const renderCompanyInfo = () => {
    if (!companyInfo) {
      return <div className="financial-empty">Không có dữ liệu thông tin công ty</div>;
    }

    const { overview, shareholders, officers, subsidiaries, events, tradingStats, ratioSummary } = companyInfo;

    return (
      <div className="company-info-container">
        {/* Thông tin tổng quan */}
        {overview && (
          <div className="company-section">
            <h3 className="section-title">🏢 Thông Tin Tổng Quan</h3>
            <div className="company-overview-grid">
              <div className="overview-item">
                <span className="overview-label">Mã cổ phiếu</span>
                <span className="overview-value highlight">{overview.symbol || stockSymbol}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Vốn điều lệ</span>
                <span className="overview-value">{formatNumber(overview.charter_capital)} VNĐ</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Số cổ phiếu lưu hành</span>
                <span className="overview-value">{formatNumber(overview.issue_share)}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Ngành (Cấp 2)</span>
                <span className="overview-value">{overview.icb_name2 || 'N/A'}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Ngành (Cấp 3)</span>
                <span className="overview-value">{overview.icb_name3 || 'N/A'}</span>
              </div>
              <div className="overview-item">
                <span className="overview-label">Ngành (Cấp 4)</span>
                <span className="overview-value">{overview.icb_name4 || 'N/A'}</span>
              </div>
            </div>
            
            {/* Giới thiệu công ty */}
            {overview.company_profile && (
              <div className="company-profile">
                <h4>📝 Giới thiệu công ty</h4>
                <p>{overview.company_profile}</p>
              </div>
            )}
            
            {/* Lịch sử hình thành */}
            {overview.history && (
              <div className="company-history">
                <h4>📜 Lịch sử hình thành & phát triển</h4>
                <p>{overview.history}</p>
              </div>
            )}
          </div>
        )}

        {/* Thống kê giao dịch */}
        {tradingStats && (
          <div className="company-section">
            <h3 className="section-title">📊 Thống Kê Giao Dịch</h3>
            <div className="trading-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Giá khớp lệnh</span>
                <span className="stat-value price">{formatNumber(tradingStats.match_price)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Thay đổi</span>
                <span className={`stat-value ${tradingStats.price_change >= 0 ? 'positive' : 'negative'}`}>
                  {tradingStats.price_change >= 0 ? '+' : ''}{formatNumber(tradingStats.price_change)} ({(tradingStats.price_change_pct * 100).toFixed(2)}%)
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Giá cao nhất 52 tuần</span>
                <span className="stat-value">{formatNumber(tradingStats.high_price_1y)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Giá thấp nhất 52 tuần</span>
                <span className="stat-value">{formatNumber(tradingStats.low_price_1y)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">KLGD trung bình 2 tuần</span>
                <span className="stat-value">{formatNumber(tradingStats.avg_match_volume_2w)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Tổng KLGD</span>
                <span className="stat-value">{formatNumber(tradingStats.total_volume)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Tỷ lệ sở hữu NN</span>
                <span className="stat-value">{formatPercent(tradingStats.current_holding_ratio)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Room NN còn lại</span>
                <span className="stat-value">{formatNumber(tradingStats.foreign_holding_room)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chỉ số tài chính tóm tắt từ ratio_summary */}
        {ratioSummary && (
          <div className="company-section">
            <h3 className="section-title">📈 Chỉ Số Tài Chính Chính</h3>
            <div className="ratio-summary-grid">
              <div className="ratio-card highlight">
                <span className="ratio-label">P/E</span>
                <span className="ratio-value">{ratioSummary.pe?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="ratio-card highlight">
                <span className="ratio-label">P/B</span>
                <span className="ratio-value">{ratioSummary.pb?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">EPS</span>
                <span className="ratio-value">{formatNumber(ratioSummary.eps)}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">EPS TTM</span>
                <span className="ratio-value">{formatNumber(ratioSummary.eps_ttm)}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">ROE</span>
                <span className="ratio-value">{ratioSummary.roe ? (ratioSummary.roe * 100).toFixed(2) + '%' : 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">ROA</span>
                <span className="ratio-value">{ratioSummary.roa ? (ratioSummary.roa * 100).toFixed(2) + '%' : 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Doanh thu</span>
                <span className="ratio-value">{formatNumber(ratioSummary.revenue)}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Tăng trưởng DT</span>
                <span className={`ratio-value ${ratioSummary.revenue_growth >= 0 ? 'positive' : 'negative'}`}>
                  {ratioSummary.revenue_growth ? (ratioSummary.revenue_growth * 100).toFixed(2) + '%' : 'N/A'}
                </span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Lợi nhuận ròng</span>
                <span className="ratio-value">{formatNumber(ratioSummary.net_profit)}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Tăng trưởng LN</span>
                <span className={`ratio-value ${ratioSummary.net_profit_growth >= 0 ? 'positive' : 'negative'}`}>
                  {ratioSummary.net_profit_growth ? (ratioSummary.net_profit_growth * 100).toFixed(2) + '%' : 'N/A'}
                </span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Biên LN ròng</span>
                <span className="ratio-value">{ratioSummary.net_profit_margin ? (ratioSummary.net_profit_margin * 100).toFixed(2) + '%' : 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Nợ/VCSH</span>
                <span className="ratio-value">{ratioSummary.debt_equity?.toFixed(2) || ratioSummary.de?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Cổ đông lớn */}
        {shareholders && shareholders.length > 0 && (
          <div className="company-section">
            <h3 className="section-title">👥 Cổ Đông Lớn</h3>
            <div className="shareholders-table">
              <table>
                <thead>
                  <tr>
                    <th>Tên cổ đông</th>
                    <th>Số lượng CP</th>
                    <th>Tỷ lệ sở hữu</th>
                    <th>Ngày cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {shareholders.map((sh, idx) => (
                    <tr key={idx}>
                      <td className="shareholder-name">{sh.share_holder || 'N/A'}</td>
                      <td>{formatNumber(sh.quantity)}</td>
                      <td className="highlight">{formatPercent(sh.share_own_percent)}</td>
                      <td>{formatDate(sh.update_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ban lãnh đạo */}
        {officers && officers.length > 0 && (
          <div className="company-section">
            <h3 className="section-title">👔 Ban Lãnh Đạo</h3>
            <div className="officers-table">
              <table>
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Chức vụ</th>
                    <th>Số CP sở hữu</th>
                    <th>Tỷ lệ sở hữu</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((of, idx) => (
                    <tr key={idx}>
                      <td className="officer-name">{of.officer_name || 'N/A'}</td>
                      <td>{of.officer_position || of.position_short_name || 'N/A'}</td>
                      <td>{formatNumber(of.quantity)}</td>
                      <td>{formatPercent(of.officer_own_percent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Công ty con/liên kết */}
        {subsidiaries && subsidiaries.length > 0 && (
          <div className="company-section">
            <h3 className="section-title">🏭 Công Ty Con & Liên Kết</h3>
            <div className="subsidiaries-table">
              <table>
                <thead>
                  <tr>
                    <th>Tên công ty</th>
                    <th>Loại hình</th>
                    <th>Tỷ lệ sở hữu</th>
                  </tr>
                </thead>
                <tbody>
                  {subsidiaries.map((sub, idx) => (
                    <tr key={idx}>
                      <td className="subsidiary-name">{sub.organ_name || 'N/A'}</td>
                      <td>{sub.type || 'N/A'}</td>
                      <td className="highlight">{formatPercent(sub.ownership_percent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sự kiện công ty */}
        {events && events.length > 0 && (
          <div className="company-section">
            <h3 className="section-title">📅 Sự Kiện Gần Đây</h3>
            <div className="events-list">
              {events.slice(0, 10).map((event, idx) => (
                <div key={idx} className="event-item">
                  <div className="event-date">{formatDate(event.public_date)}</div>
                  <div className="event-content">
                    <div className="event-title">{event.event_title || 'N/A'}</div>
                    <div className="event-type">{event.event_list_name || ''}</div>
                    {event.value && <div className="event-value">Giá trị: {formatNumber(event.value)}</div>}
                    {event.ratio && <div className="event-ratio">Tỷ lệ: {event.ratio}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===================== TAB: CHỈ SỐ TÀI CHÍNH =====================
  const renderRatios = () => {
    // Ưu tiên dùng ratioSummary từ financialData
    const ratioSummary = financialData?.ratioSummary;
    const ratios = financialData?.ratios;
    
    if (!ratioSummary && (!ratios || ratios.length === 0)) {
      return <div className="financial-empty">Không có dữ liệu chỉ số tài chính</div>;
    }

    // Nếu có ratioSummary, hiển thị dạng card đẹp hơn
    if (ratioSummary) {
      return (
        <div className="financial-ratios-container">
          <h3 className="section-title">📊 Chỉ Số Tài Chính Tóm Tắt</h3>
          
          {/* Nhóm Định giá */}
          <div className="ratio-group">
            <h4 className="ratio-group-title">💰 Định Giá</h4>
            <div className="ratios-grid">
              <div className="ratio-card large">
                <span className="ratio-label">P/E (Price/Earnings)</span>
                <span className="ratio-value">{ratioSummary.pe?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="ratio-card large">
                <span className="ratio-label">P/B (Price/Book)</span>
                <span className="ratio-value">{ratioSummary.pb?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">P/S (Price/Sales)</span>
                <span className="ratio-value">{ratioSummary.ps?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">P/CF (Price/CashFlow)</span>
                <span className="ratio-value">{ratioSummary.pcf?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Nhóm Hiệu quả */}
          <div className="ratio-group">
            <h4 className="ratio-group-title">📈 Hiệu Quả Hoạt Động</h4>
            <div className="ratios-grid">
              <div className="ratio-card">
                <span className="ratio-label">ROE (Lợi nhuận/VCSH)</span>
                <span className="ratio-value">{ratioSummary.roe ? (ratioSummary.roe * 100).toFixed(2) + '%' : 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">ROA (Lợi nhuận/Tài sản)</span>
                <span className="ratio-value">{ratioSummary.roa ? (ratioSummary.roa * 100).toFixed(2) + '%' : 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">ROIC</span>
                <span className="ratio-value">{ratioSummary.roic ? (ratioSummary.roic * 100).toFixed(2) + '%' : 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Biên LN ròng</span>
                <span className="ratio-value">{ratioSummary.net_profit_margin ? (ratioSummary.net_profit_margin * 100).toFixed(2) + '%' : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Nhóm Thu nhập */}
          <div className="ratio-group">
            <h4 className="ratio-group-title">💵 Thu Nhập</h4>
            <div className="ratios-grid">
              <div className="ratio-card">
                <span className="ratio-label">EPS (Thu nhập/CP)</span>
                <span className="ratio-value">{formatNumber(ratioSummary.eps)} VNĐ</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">EPS TTM (12 tháng)</span>
                <span className="ratio-value">{formatNumber(ratioSummary.eps_ttm)} VNĐ</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Cổ tức</span>
                <span className="ratio-value">{formatNumber(ratioSummary.dividend)} VNĐ</span>
              </div>
            </div>
          </div>

          {/* Nhóm Tăng trưởng */}
          <div className="ratio-group">
            <h4 className="ratio-group-title">🚀 Tăng Trưởng</h4>
            <div className="ratios-grid">
              <div className="ratio-card">
                <span className="ratio-label">Doanh thu</span>
                <span className="ratio-value">{formatNumber(ratioSummary.revenue)}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Tăng trưởng DT</span>
                <span className={`ratio-value ${ratioSummary.revenue_growth >= 0 ? 'positive' : 'negative'}`}>
                  {ratioSummary.revenue_growth ? (ratioSummary.revenue_growth * 100).toFixed(2) + '%' : 'N/A'}
                </span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Lợi nhuận ròng</span>
                <span className="ratio-value">{formatNumber(ratioSummary.net_profit)}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Tăng trưởng LN</span>
                <span className={`ratio-value ${ratioSummary.net_profit_growth >= 0 ? 'positive' : 'negative'}`}>
                  {ratioSummary.net_profit_growth ? (ratioSummary.net_profit_growth * 100).toFixed(2) + '%' : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Nhóm Thanh khoản & Nợ */}
          <div className="ratio-group">
            <h4 className="ratio-group-title">💳 Thanh Khoản & Nợ</h4>
            <div className="ratios-grid">
              <div className="ratio-card">
                <span className="ratio-label">Tỷ số thanh khoản hiện hành</span>
                <span className="ratio-value">{ratioSummary.current_ratio?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Tỷ số thanh khoản nhanh</span>
                <span className="ratio-value">{ratioSummary.quick_ratio?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="ratio-card">
                <span className="ratio-label">Nợ/VCSH (D/E)</span>
                <span className="ratio-value">{ratioSummary.debt_equity?.toFixed(2) || ratioSummary.de?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Fallback: hiển thị ratios dạng bảng cũ
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

  // ===================== TAB: BẢNG CÂN ĐỐI KẾ TOÁN =====================
  const renderBalanceSheet = () => {
    if (!financialData?.balanceSheet || financialData.balanceSheet.length === 0) {
      return <div className="financial-empty">Không có dữ liệu bảng cân đối kế toán</div>;
    }

    const data = financialData.balanceSheet;
    const years = data.map(row => row.report_period || row.yearReport || row.quarterReport || 'N/A');
    
    // Lấy các key quan trọng để hiển thị
    const importantKeys = Object.keys(data[0] || {}).filter(key => 
      !['ticker', 'symbol', 'report_period', 'yearReport', 'quarterReport'].includes(key)
    ).slice(0, 15);
    
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
              {importantKeys.map((key, idx) => (
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

  // ===================== TAB: KẾT QUẢ KINH DOANH =====================
  const renderIncomeStatement = () => {
    if (!financialData?.incomeStatement || financialData.incomeStatement.length === 0) {
      return <div className="financial-empty">Không có dữ liệu báo cáo kết quả kinh doanh</div>;
    }

    const data = financialData.incomeStatement;
    const years = data.map(row => row.report_period || row.yearReport || row.quarterReport || 'N/A');
    
    const importantKeys = Object.keys(data[0] || {}).filter(key => 
      !['ticker', 'symbol', 'report_period', 'yearReport', 'quarterReport'].includes(key)
    ).slice(0, 15);
    
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
              {importantKeys.map((key, idx) => (
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

  // ===================== TAB: LƯU CHUYỂN TIỀN TỆ =====================
  const renderCashFlow = () => {
    if (!financialData?.cashFlow || financialData.cashFlow.length === 0) {
      return <div className="financial-empty">Không có dữ liệu lưu chuyển tiền tệ</div>;
    }

    const data = financialData.cashFlow;
    const years = data.map(row => row.report_period || row.yearReport || row.quarterReport || 'N/A');
    
    const importantKeys = Object.keys(data[0] || {}).filter(key => 
      !['ticker', 'symbol', 'report_period', 'yearReport', 'quarterReport'].includes(key)
    ).slice(0, 15);
    
    return (
      <div className="financial-table-wrapper">
        <h3 className="section-title">💵 Báo Cáo Lưu Chuyển Tiền Tệ</h3>
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
              {importantKeys.map((key, idx) => (
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
            <h2>Thông Tin Công Ty & Tài Chính - {stockSymbol}</h2>
          </div>
          <button className="financial-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="financial-controls">
          {/* Tab selector */}
          <div className="tab-selector">
            <button
              className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
              onClick={() => setActiveTab('company')}
            >
              🏢 Thông Tin Công Ty
            </button>
            <button
              className={`tab-btn ${activeTab === 'ratios' ? 'active' : ''}`}
              onClick={() => setActiveTab('ratios')}
            >
              📊 Chỉ Số Tài Chính
            </button>
            <button
              className={`tab-btn ${activeTab === 'balance' ? 'active' : ''}`}
              onClick={() => setActiveTab('balance')}
            >
              💼 Cân Đối KT
            </button>
            <button
              className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
              onClick={() => setActiveTab('income')}
            >
              💰 Kết Quả KD
            </button>
            <button
              className={`tab-btn ${activeTab === 'cashflow' ? 'active' : ''}`}
              onClick={() => setActiveTab('cashflow')}
            >
              💵 Lưu Chuyển TT
            </button>
          </div>

          {/* Period selector - chỉ hiển thị cho các tab báo cáo tài chính */}
          {activeTab !== 'company' && (
            <div className="period-selector">
              <button
                className={`period-btn ${period === 'year' ? 'active' : ''}`}
                onClick={() => setPeriod('year')}
              >
                📅 Theo Năm
              </button>
              <button
                className={`period-btn ${period === 'quarter' ? 'active' : ''}`}
                onClick={() => setPeriod('quarter')}
              >
                📆 Theo Quý
              </button>
            </div>
          )}
        </div>

        <div className="financial-modal-body">
          {loading && (
            <div className="financial-loading">
              <div className="financial-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          )}

          {error && (
            <div className="financial-error">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button className="retry-btn" onClick={activeTab === 'company' ? fetchCompanyInfo : fetchFinancialReport}>
                🔄 Thử lại
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="financial-content">
              {activeTab === 'company' && renderCompanyInfo()}
              {activeTab === 'ratios' && renderRatios()}
              {activeTab === 'balance' && renderBalanceSheet()}
              {activeTab === 'income' && renderIncomeStatement()}
              {activeTab === 'cashflow' && renderCashFlow()}
            </div>
          )}
        </div>

        <div className="financial-modal-footer">
          <span className="data-source">Nguồn dữ liệu: vnstock_data (VCI)</span>
          <button className="financial-close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinancialReportModal;
