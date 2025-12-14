# News and Financial Report Features

## Tổng quan
Đã thêm 2 tính năng mới vào hệ thống:
1. **Tin tức công ty** (📰 Tin tức button)
2. **Báo cáo tài chính** (📈 BCTC button)

## 1. Backend API (server.py)

### Thư viện mới
```python
from vnstock import Company, Finance
from vnstock_news import Crawler
```

### API Endpoints

#### 1.1. Company News API
**Endpoint:** `GET /api/company/news/{symbol}`
**Query Parameters:**
- `limit` (optional, default=20): Số lượng tin tức tối đa

**Response:**
```json
{
  "symbol": "VIC",
  "news": [
    {
      "id": "unique_id",
      "title": "Tiêu đề tin tức",
      "subTitle": "Tiêu đề phụ",
      "summary": "Tóm tắt nội dung",
      "url": "https://...",
      "imageUrl": "https://...",
      "publishTime": "2024-01-15T10:30:00",
      "priceChange": 2.5
    }
  ],
  "total": 15
}
```

**Features:**
- Lấy tin tức từ vnstock với source="vci"
- Sử dụng Company(symbol, source="vci").news()
- Trả về DataFrame với các cột: news_id, news_title, news_sub_title, news_short_content, news_source_link, news_image_url, public_date, price_change_pct
- Error handling: Trả về empty array nếu có lỗi (không throw HTTP 500)

#### 1.2. Financial Report API
**Endpoint:** `GET /api/company/financial/{symbol}`
**Query Parameters:**
- `period` (optional, default="year"): "year" hoặc "quarter"

**Response:**
```json
{
  "symbol": "VIC",
  "period": "year",
  "balanceSheet": [...],
  "incomeStatement": [...],
  "cashFlow": [...],
  "ratios": [...]
}
```

**Features:**
- Sử dụng Finance API từ vnstock với source="vci"
- 4 loại báo cáo:
  - `balance_sheet(period)`: Bảng cân đối kế toán
  - `income_statement(period)`: Báo cáo kết quả kinh doanh
  - `cash_flow(period)`: Báo cáo lưu chuyển tiền tệ
  - `ratio()`: Các chỉ số tài chính
- Hỗ trợ period: "year" (năm) hoặc "quarter" (quý)

## 2. Frontend Components

### 2.1. NewsModal Component

**File:** `src/components/NewsModal.jsx` + `NewsModal.css`

**Features:**
- **Auto-fetch on open**: Tự động load tin tức khi modal mở
- **Responsive design**: Grid layout responsive (3 columns → 2 → 1 on mobile)
- **Image display**: Hiển thị thumbnail ảnh tin tức
- **HTML stripping**: Loại bỏ HTML tags từ summary
- **Click to open**: Click vào card để mở tin tức trong tab mới
- **ESC key handler**: Đóng modal bằng ESC
- **Loading/Error states**: Spinner, error message, retry button
- **Empty state**: Hiển thị message khi không có tin

**UI Elements:**
```jsx
<NewsModal
  isOpen={showNewsModal}
  onClose={() => setShowNewsModal(false)}
  stockSymbol="VIC"
/>
```

**Design:**
- Gradient background: #1e2139 → #2a2d4a
- Backdrop blur overlay
- News cards với hover effects
- Custom scrollbar styling
- Responsive breakpoints (@media 768px)

### 2.2. FinancialReportModal Component

**File:** `src/components/FinancialReportModal.jsx` + `FinancialReportModal.css`

**Features:**
- **4-tab interface**: 
  - Overview (Chỉ số tài chính - 12 ratios)
  - Balance Sheet (Bảng cân đối kế toán)
  - Income Statement (Kết quả kinh doanh)
  - Cash Flow (Lưu chuyển tiền tệ)
- **Period selector**: Toggle Year/Quarter
- **Responsive tables**: Sticky first column, horizontal scroll
- **Number formatting**: Vietnamese locale (1.234.567,89)
- **Loading/Error states**: Spinner, error, retry
- **ESC key handler**: Đóng modal

**UI Elements:**
```jsx
<FinancialReportModal
  isOpen={showFinancialModal}
  onClose={() => setShowFinancialModal(false)}
  stockSymbol="VIC"
/>
```

**Design:**
- Tab-based navigation với active state
- Period toggle buttons (Year/Quarter)
- Ratio cards grid (auto-fill, min 250px)
- Financial tables với sticky header & first column
- Hover effects trên rows
- Responsive design (mobile-friendly)

## 3. Integration

### 3.1. App.jsx Changes

**New State:**
```javascript
const [showNewsModal, setShowNewsModal] = useState(false);
const [showFinancialModal, setShowFinancialModal] = useState(false);
```

**New Props to Header:**
```javascript
onShowNews={() => setShowNewsModal(true)}
onShowFinancial={() => setShowFinancialModal(true)}
```

**Modal Rendering:**
```jsx
<NewsModal
  isOpen={showNewsModal}
  onClose={() => setShowNewsModal(false)}
  stockSymbol={stockSymbol}
/>

<FinancialReportModal
  isOpen={showFinancialModal}
  onClose={() => setShowFinancialModal(false)}
  stockSymbol={stockSymbol}
/>
```

### 3.2. Header.jsx Changes

**New Props:**
```javascript
onShowNews,
onShowFinancial
```

**New Buttons:**
```jsx
<button className="news-button" onClick={onShowNews} title="Company News">
  <span className="icon">📰</span>
  <span className="label">Tin tức</span>
</button>

<button className="financial-button" onClick={onShowFinancial} title="Financial Report">
  <span className="icon">📈</span>
  <span className="label">BCTC</span>
</button>
```

**Button Styling:**
- **News button**: Orange theme (rgba(245, 158, 11))
- **Financial button**: Purple theme (rgba(168, 85, 247))
- Hover effects: transform translateY(-1px)
- Light theme support

### 3.3. API Service (api.js)

**New Functions:**

```javascript
// Get company news
getCompanyNews: async (stockSymbol, limit = 20) => {
  const res = await fetch(`${API_BASE_URL}/api/company/news/${stockSymbol}?limit=${limit}`);
  return await res.json();
}

// Get financial report
getFinancialReport: async (stockSymbol, period = 'year') => {
  const res = await fetch(`${API_BASE_URL}/api/company/financial/${stockSymbol}?period=${period}`);
  return await res.json();
}
```

**API_BASE_URL:** Updated to `http://localhost:8000`

## 4. User Flow

### 4.1. Viewing News
1. User clicks "📰 Tin tức" button in Header
2. NewsModal opens with loading spinner
3. Fetches news from `/api/company/news/{symbol}?limit=20`
4. Displays news cards in grid layout
5. Click any card → Opens article in new tab
6. Press ESC or click close button → Modal closes

### 4.2. Viewing Financial Report
1. User clicks "📈 BCTC" button in Header
2. FinancialReportModal opens with loading spinner
3. Fetches data from `/api/company/financial/{symbol}?period=year`
4. Default tab: "Overview" shows 12 key ratios
5. User can:
   - Switch tabs (Overview/Balance/Income/CashFlow)
   - Toggle period (Year/Quarter) - refetches data
   - Scroll horizontally through tables
6. Press ESC or click close button → Modal closes

## 5. Data Sources (vnstock)

### Company.news()
**Returns DataFrame with columns:**
- `news_id`: Unique identifier
- `news_title`: Main headline
- `news_sub_title`: Sub headline
- `news_short_content`: Summary (may contain HTML)
- `news_source_link`: URL to full article
- `news_image_url`: Thumbnail image URL
- `public_date`: Publication timestamp
- `price_change_pct`: Stock price change %

**Supported sources:** VCI (primary), TCBS, SSI, etc.

### Finance API
**Methods:**
1. `balance_sheet(period)`: Assets, Liabilities, Equity
2. `income_statement(period)`: Revenue, Profit, Expenses
3. `cash_flow(period)`: Operating, Investing, Financing activities
4. `ratio()`: Financial ratios (P/E, ROE, ROA, EPS, etc.)

**Period options:**
- `"year"`: Annual data
- `"quarter"`: Quarterly data

## 6. Error Handling

### Backend
- Returns empty data instead of HTTP 500 errors
- Try-except blocks around vnstock API calls
- Graceful degradation if data unavailable

### Frontend
- Loading states with spinners
- Error messages with retry buttons
- Empty state messages
- Network error handling

## 7. Styling

### Theme Colors
- **News**: Orange (#f59e0b)
- **Financial**: Purple (#a855f7)
- **Indicators**: Teal (#26a69a)
- **Price Board**: Blue-Purple gradient

### Responsive Breakpoints
```css
@media (max-width: 768px) {
  /* Single column layout */
  /* Stacked controls */
  /* Smaller font sizes */
}
```

### Dark/Light Theme Support
- All buttons support `body.light` class
- Modal backgrounds adjust opacity
- Border colors change based on theme

## 8. Performance Considerations

- **Lazy loading**: Modals only fetch when opened
- **Caching**: Data refreshes on period change
- **Pagination**: News limited to 20 items
- **Optimized rendering**: useState for tab switching (no re-fetch)

## 9. Future Enhancements

1. **News Features:**
   - Search/filter by keyword
   - Sort by date/relevance
   - Sentiment analysis display
   - Multi-source aggregation

2. **Financial Features:**
   - Chart visualizations (trend graphs)
   - Comparison with industry averages
   - Export to CSV/Excel
   - Historical comparisons (YoY, QoQ)

3. **UI/UX:**
   - Dark mode toggle per modal
   - Bookmark/save articles
   - Share on social media
   - Print-friendly view

## 10. Testing Checklist

- [ ] Backend APIs return correct data
- [ ] Modals open/close correctly
- [ ] ESC key closes modals
- [ ] Loading states display
- [ ] Error states display with retry
- [ ] Empty states display
- [ ] News cards clickable
- [ ] Financial tabs switch correctly
- [ ] Period toggle works
- [ ] Responsive design on mobile
- [ ] Light/dark theme support
- [ ] Number formatting correct
- [ ] Vietnamese date formatting
- [ ] Horizontal scroll on tables
- [ ] Sticky table columns work

## Files Modified/Created

### Backend
- ✅ `data-service/server.py` - Added 2 new endpoints

### Frontend Components
- ✅ `src/components/NewsModal.jsx` - New component
- ✅ `src/components/NewsModal.css` - New stylesheet
- ✅ `src/components/FinancialReportModal.jsx` - New component
- ✅ `src/components/FinancialReportModal.css` - New stylesheet
- ✅ `src/components/Header.jsx` - Added 2 buttons
- ✅ `src/components/Header.css` - Button styles
- ✅ `src/App.jsx` - Modal integration
- ✅ `src/services/api.js` - API functions

## How to Use

1. **Start backend:**
   ```bash
   cd data-service
   python server.py
   ```

2. **Start frontend:**
   ```bash
   cd client-service/react-client
   npm run dev
   ```

3. **Access app:**
   - Open browser: `http://localhost:5173`
   - Select a stock (e.g., VIC, VNM, FPT)
   - Click "📰 Tin tức" to view news
   - Click "📈 BCTC" to view financial reports

## Dependencies

### Backend
- `vnstock` >= 3.3.0 - Stock data API
- `vnstock_news` - News crawler
- `fastapi` - Web framework
- `pandas` - Data manipulation

### Frontend
- `react` 19.2.0
- `lightweight-charts` - Chart library
- No additional dependencies needed for modals

---

**Implementation Date:** 2024
**Author:** GitHub Copilot
**Status:** ✅ Complete and Ready for Testing
