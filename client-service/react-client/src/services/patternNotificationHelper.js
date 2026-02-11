/**
 * Pattern Notification Helper
 * Xử lý logic phát hiện pattern mới và tạo notification
 */
import { showPatternToast } from '../components/ToastNotification';
import { notificationApi } from './notificationApi';
import { getPatternSentiment } from '../utils/patternUtils';

// Store để track các pattern đã thông báo (tránh duplicate trong session)
const notifiedPatternsCache = new Map();

// Pattern display names mapping
const PATTERN_DISPLAY_NAMES = {
  // Single candle patterns
  'hammer': 'Hammer (Nến Búa)',
  'inverted_hammer': 'Inverted Hammer (Búa Ngược)',
  'hanging_man': 'Hanging Man (Người Treo)',
  'shooting_star': 'Shooting Star (Sao Băng)',
  'bearish_marubozu': 'Bearish Marubozu',
  'bullish_marubozu': 'Bullish Marubozu',
  'dragonfly_doji': 'Dragonfly Doji',
  'gravestone_doji': 'Gravestone Doji',
  'long_legged_doji': 'Long Legged Doji',
  'bearish_belt_hold': 'Bearish Belt Hold',
  'bullish_belt_hold': 'Bullish Belt Hold',

  // Two candle patterns
  'bullish_engulfing': 'Bullish Engulfing (Nhấn Chìm Tăng)',
  'bearish_engulfing': 'Bearish Engulfing (Nhấn Chìm Giảm)',
  'piercing_line': 'Piercing Line',
  'dark_cloud_cover': 'Dark Cloud Cover',
  'harami': 'Harami',
  'tweezer_bottom': 'Tweezer Bottom',
  'tweezer_top': 'Tweezer Top',

  // Three candle patterns
  'three_white_soldiers': 'Three White Soldiers',
  'three_black_crows': 'Three Black Crows',
  'morning_star': 'Morning Star (Sao Mai)',
  'evening_star': 'Evening Star (Sao Hôm)',
  'morning_star_doji': 'Morning Star Doji',
  'evening_star_doji': 'Evening Star Doji',
  
  // Complex patterns
  'cup_with_handle': 'Cup with Handle (Tách có Quai)',
  'double_tops': 'Double Top (Đỉnh Đôi)',
  'double_bottoms': 'Double Bottom (Đáy Đôi)',
  'head_and_shoulders': 'Head and Shoulders',
  'inverse_head_and_shoulders': 'Inverse Head and Shoulders',
  'flag_pattern': 'Flag Pattern (Mô hình Cờ)',
  'pennant': 'Pennant Pattern',
  'triangle': 'Triangle Pattern',
  'ascending_triangle': 'Ascending Triangle',
  'descending_triangle': 'Descending Triangle',
  'symmetrical_triangle': 'Symmetrical Triangle',
};

/**
 * Lấy display name của pattern
 */
export const getPatternDisplayName = (patternName) => {
  return PATTERN_DISPLAY_NAMES[patternName] || patternName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

/**
 * Tạo cache key cho pattern
 */
const createCacheKey = (stockSymbol, patternName, patternDate) => {
  return `${stockSymbol}-${patternName}-${patternDate}`;
};

/**
 * Kiểm tra pattern đã được thông báo chưa trong session
 */
export const isPatternAlreadyNotified = (stockSymbol, patternName, patternDate) => {
  const key = createCacheKey(stockSymbol, patternName, patternDate);
  return notifiedPatternsCache.has(key);
};

/**
 * Đánh dấu pattern đã được thông báo
 */
const markPatternAsNotified = (stockSymbol, patternName, patternDate) => {
  const key = createCacheKey(stockSymbol, patternName, patternDate);
  notifiedPatternsCache.set(key, Date.now());
  
  // Clean up cache entries older than 24 hours
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, v] of notifiedPatternsCache.entries()) {
    if (v < oneDayAgo) {
      notifiedPatternsCache.delete(k);
    }
  }
};

/**
 * Xử lý khi phát hiện patterns mới (gọi sau khi loadPatternsData)
 * So sánh với patterns đã biết và thông báo patterns mới
 * 
 * @param {string} stockSymbol - Mã cổ phiếu
 * @param {Object} newPatternCounts - { patternName: count }
 * @param {Object} previousPatternCounts - Pattern counts từ lần load trước
 * @param {Object} patternPositions - { patternName: [times...] }
 * @param {Array} candleData - Dữ liệu nến
 * @param {boolean} isUserLoggedIn - User đã đăng nhập chưa
 * @returns {Object} Updated previousPatternCounts
 */
export const checkAndNotifyNewPatterns = async (
  stockSymbol,
  newPatternCounts,
  previousPatternCounts,
  patternPositions,
  candleData,
  isUserLoggedIn
) => {
  if (!newPatternCounts || !stockSymbol) return previousPatternCounts;

  const notifications = [];

  for (const [patternName, newCount] of Object.entries(newPatternCounts)) {
    const prevCount = previousPatternCounts[patternName] || 0;
    
    // Chỉ thông báo nếu có pattern mới
    if (newCount > prevCount) {
      const positions = patternPositions[patternName] || [];
      
      // Lấy các pattern mới (những pattern gần nhất)
      const newPatternCount = newCount - prevCount;
      const newPositions = positions.slice(0, newPatternCount);
      
      for (const patternDate of newPositions) {
        // Kiểm tra xem đã thông báo chưa
        if (isPatternAlreadyNotified(stockSymbol, patternName, patternDate)) {
          continue;
        }

        // Tìm giá đóng cửa tại thời điểm pattern
        let closePrice = 0;
        const candle = candleData.find(c => c.time === patternDate);
        if (candle) {
          closePrice = candle.close;
        }

        const sentiment = getPatternSentiment(patternName);
        const displayName = getPatternDisplayName(patternName);
        
        const message = generateNotificationMessage(stockSymbol, displayName, sentiment, patternDate, closePrice);

        const notification = {
          stockSymbol,
          patternName,
          patternDisplayName: displayName,
          sentiment,
          patternDate,
          closePrice,
          message
        };

        notifications.push(notification);
        
        // Đánh dấu đã thông báo
        markPatternAsNotified(stockSymbol, patternName, patternDate);
      }
    }
  }

  // Gửi notifications
  for (const notification of notifications) {
    // Hiển thị toast notification
    showPatternToast(notification);
    
    // Dispatch event cho NotificationBell để update UI ngay lập tức
    window.dispatchEvent(new CustomEvent('new-pattern-notification', { detail: notification }));
    
    // Nếu đã đăng nhập, lưu vào database
    if (isUserLoggedIn) {
      try {
        await notificationApi.createNotification({
          stockSymbol: notification.stockSymbol,
          patternName: notification.patternName,
          patternDisplayName: notification.patternDisplayName,
          sentiment: notification.sentiment,
          patternDate: notification.patternDate,
          closePrice: notification.closePrice
        });
      } catch (error) {
        console.error('Failed to save notification to server:', error);
        // Không throw error, vẫn tiếp tục show toast
      }
    }
  }

  return { ...newPatternCounts };
};

/**
 * Tạo message cho notification
 */
const generateNotificationMessage = (stockSymbol, displayName, sentiment, patternDate, closePrice) => {
  const sentimentText = sentiment === 'bullish' ? 'tăng giá' : 
                        sentiment === 'bearish' ? 'giảm giá' : 'trung lập';
  
  let priceText = '';
  if (closePrice > 0) {
    priceText = ` - Giá: ${closePrice.toLocaleString('vi-VN')}`;
  }
  
  return `Phát hiện mô hình ${displayName} (${sentimentText}) tại mã ${stockSymbol} vào ngày ${patternDate}${priceText}`;
};

/**
 * Clear cache (dùng khi user thay đổi stock symbol)
 */
export const clearNotificationCache = () => {
  notifiedPatternsCache.clear();
};

export default {
  checkAndNotifyNewPatterns,
  isPatternAlreadyNotified,
  getPatternDisplayName,
  clearNotificationCache
};
