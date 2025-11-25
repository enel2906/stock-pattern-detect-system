# Client-Side Candle Pattern Detection

## Overview

This implementation moves candlestick pattern detection from server-side (Java) to client-side (JavaScript), reducing server load and improving response time.

## Architecture

### Services Structure

```
src/services/
├── candlePatternDetector.js      # Single & two-candle patterns + helper functions
├── candlePatternDetectorPart2.js # Three-candle patterns
├── patternDetectionService.js    # Main service interface
└── api.js                         # Updated to use client-side detection
```

### Pattern Categories

#### 1. Single Candle Patterns
- Hammer
- Inverted Hammer
- Hanging Man
- Shooting Star
- Bearish/Bullish Marubozu
- Dragonfly/Gravestone/Long-legged Doji
- Bearish/Bullish Belt Hold

#### 2. Two Candle Patterns
- Bullish/Bearish Engulfing
- Piercing Line
- Dark Cloud Cover
- Harami
- Tweezer Top/Bottom

#### 3. Three Candle Patterns
- Three White Soldiers
- Three Black Crows
- Morning/Evening Star
- Morning/Evening Star Doji
- Three Outside Up
- Three Inside Up
- Bearish Abandoned Baby
- Thrusting
- Upside/Downside Tasuki Gap

## Usage

### Detecting Patterns

```javascript
import { detectCandlePattern } from './services/patternDetectionService';

// Candles must have: {time, open, high, low, close}
const candles = [
  { time: '2024-01-01', open: 100, high: 105, low: 99, close: 103 },
  // ... more candles
];

// Detect a specific pattern
const patterns = detectCandlePattern(candles, 'hammer');

// Each detected pattern includes:
// - Original candle data (time, open, high, low, close)
// - index: position in the candles array
console.log(`Found ${patterns.length} hammer patterns`);
```

### Integration with API

The `api.js` service automatically handles pattern detection:

```javascript
import { stockApi } from './services/api';

// This now uses client-side detection for supported patterns
const patterns = await stockApi.getPatternData('ACB', 'hammer');
```

### Fallback Strategy

For patterns not yet implemented on client-side (complex chart patterns like Cup & Handle, Double Tops, etc.), the system automatically falls back to the server API.

## Pattern Detection Logic

### Constants
```javascript
DOJI_BODY_THRESHOLD = 0.1          // 10% of range for Doji
SMALL_BODY_THRESHOLD = 0.3         // 30% of range for small body
LONG_SHADOW_RATIO = 2.0            // Shadow 2x body length
MINIMAL_SHADOW_THRESHOLD = 0.1     // 10% of range for minimal shadow
MARUBOZU_BODY_THRESHOLD = 0.95     // 95% of range for Marubozu
PRICE_TOLERANCE = 0.003            // 0.3% tolerance for price matching
```

### Helper Functions

All helper functions are exported and can be reused:

```javascript
import { 
  getBodySize, 
  getTotalRange, 
  isBullish, 
  isBearish,
  hasUptrend,
  hasDowntrend
} from './services/candlePatternDetector';

const bodySize = getBodySize(candle);
const isUptrending = hasUptrend(candles, currentIndex, 3);
```

## Benefits

1. **Reduced Server Load**: Pattern detection happens in the browser
2. **Faster Response**: No network latency for pattern detection
3. **Offline Capability**: Patterns can be detected without server connection (if data is cached)
4. **Scalability**: Better handling of multiple concurrent users
5. **Consistent Results**: Same logic as Java implementation

## Testing

To verify patterns are detected correctly:

```javascript
import { detectCandlePattern, getSupportedPatterns } from './services/patternDetectionService';

// Get all supported patterns
const supportedPatterns = getSupportedPatterns();
console.log('Supported patterns:', supportedPatterns);

// Test with sample data
const testCandles = [/* your test data */];
const results = detectCandlePattern(testCandles, 'hammer');
console.log('Detection results:', results);
```

## Future Enhancements

### Planned Client-Side Implementations
- Bearish/Bullish Kicker
- Matching Low/High
- Bearish/Bullish Counterattack
- Bearish/Bullish Harami Cross
- Three Line Strike patterns
- Ladder Top
- Tri-Star patterns
- Rising/Falling Three Methods

### Complex Chart Patterns (Currently Server-Side)
- Cup with Handle
- Double Tops/Bottoms
- Head and Shoulders
- Triangle patterns (Ascending, Descending, Symmetrical)
- Flag and Pennant patterns

## Performance Considerations

- Pattern detection runs synchronously but is fast (< 100ms for 1000 candles)
- For very large datasets (>5000 candles), consider:
  - Web Workers for background processing
  - Chunking data for progressive detection
  - Caching detection results

## Migration Notes

### What Changed
1. `api.js` now checks if pattern is supported client-side first
2. Falls back to server API for unsupported patterns
3. No changes needed to React components - they work transparently

### Backward Compatibility
- All existing API calls continue to work
- Complex patterns still use server detection
- No breaking changes to component interfaces

## Debugging

Enable detailed logging:

```javascript
// In api.js
console.log(`Detecting ${patternName} patterns on client-side...`);
console.log(`Client-side detection found ${detectedPatterns.length} patterns`);

// In patternDetectionService.js
console.log(`Detected ${patterns.length} ${patternName} patterns`);
```

## Troubleshooting

### Pattern not detected?
1. Check candle data format: must have `{time, open, high, low, close}`
2. Verify sufficient candles (minimum 3-5 depending on pattern)
3. Check trend requirements (some patterns need uptrend/downtrend)
4. Review pattern-specific thresholds

### Using server fallback?
- Check if pattern name is in `PATTERN_DETECTORS` map
- Complex patterns (cup_with_handle, double_tops, etc.) use server API intentionally

## Contact & Support

For issues or questions about pattern detection logic, refer to:
- `DetectCandlePatternServiceImpl.java` - Server implementation reference
- Pattern definitions in `patternDefinitions.js`
