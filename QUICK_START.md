# Quick Start Guide - Pattern Indicator Feature

## What You'll See

### 1. On the Chart
Instead of seeing long pattern names like "Bullish Engulfing Pattern", you'll see short abbreviations:
- **BE** = Bullish Engulfing
- **HM** = Hammer
- **MS** = Morning Star
- **3WS** = Three White Soldiers
- etc.

### 2. Marker Colors
- 🟢 **Green** = Bullish patterns (appears below the candlestick)
- 🔴 **Red** = Bearish patterns (appears above the candlestick)
- 🟣 **Purple** = Neutral patterns

### 3. Hover for Details
When you move your mouse over any pattern marker, a tooltip will appear showing:
```
╔══════════════════════════════════════╗
║ Bullish Engulfing                    ║
║──────────────────────────────────────║
║ A strong bullish reversal pattern   ║
║ consisting of two candles. The       ║
║ second candle (bullish) completely   ║
║ engulfs the body of the first candle ║
║ (bearish)...                         ║
╚══════════════════════════════════════╝
```

## Files Created/Modified

### Backend (Java/Spring Boot)
```
alert-service/
├── src/main/java/com/example/alert/
│   ├── job/
│   │   └── PatternDefinitionInitializer.java    [NEW] - Initializes pattern definitions
│   ├── controller/
│   │   └── PatternDefinitionController.java      [NEW] - API endpoint for definitions
│   ├── domain/
│   │   └── PatternDefinition.java                [EXISTING] - Entity class
│   ├── repository/
│   │   └── PatternDefinitionRepository.java      [EXISTING] - MongoDB repository
│   └── service/
│       ├── PatternDefinitionService.java         [EXISTING] - Service interface
│       └── impl/
│           └── PatternDefinitionServiceImpl.java [EXISTING] - Service implementation
```

### Frontend (HTML/JavaScript)
```
client-service/
└── main.html                                      [MODIFIED] - Added tooltip feature
```

## API Endpoint

### Get All Pattern Definitions
```http
GET http://localhost:60/alert/pattern-definitions
```

**Response:**
```json
{
  "code": 0,
  "data": {
    "hammer": "A bullish reversal pattern that forms at the bottom...",
    "bullish_engulfing": "A strong bullish reversal pattern consisting...",
    "morning_star": "A bullish reversal pattern consisting of three...",
    ...
  }
}
```

## How to Test

### Step 1: Start MongoDB
```bash
mongod
```

### Step 2: Start Backend Service
```bash
cd stock-pattern-detect-system/alert-service
mvn spring-boot:run
```

**Expected Console Output:**
```
Initializing pattern definitions...
Pattern definitions initialized successfully. Total: 70+
```

### Step 3: Verify Database
Open MongoDB Compass or CLI:
```bash
mongo
use candlestick_db
db.pattern_definition.count()  // Should return 70+
db.pattern_definition.findOne() // View a sample definition
```

### Step 4: Test API
Open browser or Postman:
```
http://localhost:60/alert/pattern-definitions
```

### Step 5: Open Frontend
Open `main.html` in your browser

### Step 6: Use the Feature
1. Select a stock (e.g., HPG)
2. Click "Tải dữ liệu" (Load Data)
3. Select a pattern from dropdown (e.g., "Bullish Engulfing")
4. Observe pattern markers with abbreviations
5. Hover mouse over any marker
6. See the tooltip with full definition

## Pattern Abbreviation Reference

| Abbreviation | Pattern Name | Sentiment |
|--------------|--------------|-----------|
| HM | Hammer | Bullish |
| IH | Inverted Hammer | Bullish |
| HM | Hanging Man | Bearish |
| SS | Shooting Star | Bearish |
| LDJ | Long Legged Doji | Neutral |
| GDJ | Gravestone Doji | Bearish |
| DDJ | Dragonfly Doji | Bullish |
| BMZ | Bearish Marubozu | Bearish |
| BMZ | Bullish Marubozu | Bullish |
| BE | Bullish Engulfing | Bullish |
| BE | Bearish Engulfing | Bearish |
| PL | Piercing Line | Bullish |
| DCC | Dark Cloud Cover | Bearish |
| HR | Harami | Neutral |
| MS | Morning Star | Bullish |
| ES | Evening Star | Bearish |
| 3WS | Three White Soldiers | Bullish |
| 3BC | Three Black Crows | Bearish |
| CWH | Cup With Handle | Bullish |
| H&S | Head and Shoulders | Bearish |
| IH&S | Inverse Head and Shoulders | Bullish |
| DT | Double Tops | Bearish |
| DB | Double Bottoms | Bullish |
| FLG | Flag Pattern | Continuation |
| PEN | Pennant | Continuation |
| AT | Ascending Triangle | Bullish |
| DT | Descending Triangle | Bearish |
| ST | Symmetrical Triangle | Neutral |

## Sample Pattern Definitions

### Bullish Engulfing
> A strong bullish reversal pattern consisting of two candles. The second candle (bullish) completely engulfs the body of the first candle (bearish). Appears at the end of a downtrend and signals a potential reversal to the upside with strong buying pressure.

### Hammer
> A bullish reversal pattern that forms at the bottom of a downtrend. It has a small body at the upper end of the trading range with a long lower shadow (at least twice the length of the body) and little or no upper shadow. Signals potential trend reversal from bearish to bullish.

### Morning Star
> A bullish reversal pattern consisting of three candles: a long bearish candle, a small-bodied candle (star) that gaps down, and a long bullish candle that closes well into the first candle's body. Signals the end of a downtrend.

### Head and Shoulders
> A bearish reversal pattern with three peaks: a higher peak (head) between two lower peaks (shoulders). The neckline connects the lows between the peaks. A break below the neckline confirms the reversal with a measured downside target equal to the head's height.

## Troubleshooting Quick Fixes

### Problem: "Pattern definitions not found"
**Fix:** 
```bash
# Restart the Spring Boot application
# Check application.properties for correct MongoDB URI
spring.data.mongodb.uri=mongodb://localhost:27017/candlestick_db
```

### Problem: "Tooltip not showing"
**Fix:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify pattern definitions loaded: `console.log(patternDefinitions)`
4. Should show object with 70+ key-value pairs

### Problem: "CORS error"
**Fix:**
- PatternDefinitionController already has `@CrossOrigin(origins = "*")`
- Clear browser cache and reload

### Problem: "Markers showing undefined"
**Fix:**
- Pattern type mismatch between backend and frontend
- Check CandleNames.java constants match HTML pattern selector values

## Advanced: Adding New Patterns

### 1. Add to CandleNames.java
```java
public static final String NEW_PATTERN = "new_pattern";
```

### 2. Add to PatternDefinitionInitializer.java
```java
patterns.put(CandleNames.NEW_PATTERN, new PatternData(
    "New Pattern",
    "Description of the new pattern..."
));
```

### 3. Add to main.html abbreviation map
```javascript
const abbrevMap = {
    // ... existing patterns
    'new_pattern': 'NP',
};
```

### 4. Add to sentiment classification
```javascript
const bullishPatterns = [
    // ... existing patterns
    'new_pattern',
];
```

### 5. Add to HTML dropdown
```html
<option value="new_pattern">🆕 New Pattern - Description</option>
```

### 6. Restart and test!

## Support

For issues or questions:
1. Check the comprehensive guide: `PATTERN_INDICATOR_FEATURE.md`
2. Review browser console for JavaScript errors
3. Check Spring Boot logs for backend errors
4. Verify MongoDB is running and accessible

Happy Trading! 📈📉
