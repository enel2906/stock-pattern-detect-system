# Pattern Indicator Feature - Implementation Guide

## Overview
This document describes the implementation of a TradingView-style pattern indicator feature that displays candlestick pattern abbreviations on the chart with tooltips showing detailed definitions when hovering over them.

## Implementation Summary

### 1. Database Layer - Pattern Definitions Storage

#### Created Files:
- **`PatternDefinition.java`** - Entity class for storing pattern definitions
- **`PatternDefinitionRepository.java`** - MongoDB repository interface
- **`PatternDefinitionService.java`** - Service interface
- **`PatternDefinitionServiceImpl.java`** - Service implementation

#### Key Features:
- MongoDB collection: `pattern_definition`
- Fields: `id`, `pattern_name`, `pattern_type`, `pattern_definition`
- Stores comprehensive definitions for all 70+ candlestick patterns

### 2. Pattern Definition Initialization Job

#### Created File:
**`PatternDefinitionInitializer.java`** - CommandLineRunner implementation

#### Functionality:
- Automatically runs on application startup
- Checks if pattern definitions already exist in database
- If not, initializes all pattern definitions with:
  - Pattern type (matches CandleNames constants)
  - Pattern name (human-readable)
  - Pattern definition (detailed explanation)

#### Patterns Included (70+ patterns):
1. **Single Candle Patterns** (11): Hammer, Inverted Hammer, Hanging Man, Shooting Star, Doji variants, Marubozu, Belt Hold
2. **Two Candle Patterns** (15): Engulfing, Kicker, Piercing Line, Dark Cloud Cover, Harami, Tweezer, Counterattack
3. **Three Candle Patterns** (19): Morning/Evening Star, Three Soldiers/Crows, Abandoned Baby, Tri Star, etc.
4. **Multi-Candle Patterns** (5): Rising/Falling Three Methods, Three Line Strike, Ladder Top
5. **Complex Chart Patterns** (12): Cup & Handle, Double Tops/Bottoms, Head & Shoulders, Triangles, Flag, Pennant

### 3. API Layer - Pattern Definition Endpoint

#### Created File:
**`PatternDefinitionController.java`**

#### Endpoint:
```http
GET http://localhost:60/alert/pattern-definitions
```

#### Response Format:
```json
{
  "code": 0,
  "data": {
    "hammer": "A bullish reversal pattern that forms at the bottom of a downtrend...",
    "bullish_engulfing": "A strong bullish reversal pattern consisting of two candles...",
    ...
  }
}
```

#### Features:
- Returns all pattern definitions as a map
- Key: pattern type (matches CandleNames constants)
- Value: pattern definition text
- CORS enabled for frontend access

### 4. Frontend Implementation - Chart Indicators

#### Modified File:
**`main.html`** - Client-side chart application

#### Key Changes:

##### CSS Additions:
```css
.pattern-tooltip - Tooltip styling with smooth transitions
.pattern-tooltip-title - Bold title styling with accent color
.pattern-tooltip-content - Definition text styling
.pattern-label - On-chart pattern labels (optional)
```

##### JavaScript Features:

1. **Pattern Definition Loading**:
   ```javascript
   async function loadPatternDefinitions()
   ```
   - Fetches definitions from API on app initialization
   - Stores in `patternDefinitions` cache object
   - Called in `displayChart()` function

2. **Tooltip Management**:
   ```javascript
   function showPatternTooltip(patternType, patternName, x, y)
   function hidePatternTooltip()
   ```
   - Creates and positions tooltip element
   - Shows pattern name and definition
   - Automatically adjusts position to stay on screen
   - Smooth fade-in/fade-out animations

3. **Pattern Abbreviations**:
   ```javascript
   function getPatternAbbreviation(patternName)
   ```
   - Maps pattern types to 2-3 character abbreviations
   - Examples: BE (Bullish Engulfing), HM (Hammer), MS (Morning Star)
   - Displayed on chart markers

4. **Pattern Sentiment Detection**:
   ```javascript
   function getPatternSentiment(patternName)
   ```
   - Categorizes patterns as bullish, bearish, or neutral
   - Used for color coding:
     - Bullish: Green (#26a69a)
     - Bearish: Red (#ef5350)
     - Neutral: Purple (#9933FF)

5. **Enhanced Pattern Display**:
   ```javascript
   async function getPattern(patternName, patternTitle)
   ```
   - Updated to use abbreviations instead of full names
   - Positions markers based on sentiment (above/below bars)
   - Sets up tooltip hover listeners

6. **Crosshair Tooltip Integration**:
   ```javascript
   function setupMarkerTooltips(patterns, patternName, patternTitle)
   ```
   - Subscribes to chart crosshair move events
   - Detects when user hovers over pattern markers
   - Shows/hides tooltip accordingly

## Usage

### Starting the Application

1. **Start MongoDB** (if not running):
   ```bash
   mongod
   ```

2. **Start Backend Service**:
   ```bash
   cd stock-pattern-detect-system/alert-service
   mvn spring-boot:run
   ```
   - Pattern definitions will be automatically initialized on first run
   - Check console for: "Pattern definitions initialized successfully. Total: 70+"

3. **Open Frontend**:
   - Open `client-service/main.html` in a web browser
   - Or serve via a web server

### Using the Feature

1. **Select a Stock**: Choose from the stock selector dropdown
2. **Load Chart**: Click "Tải dữ liệu" button
3. **Select Pattern**: Choose a pattern from the pattern selector dropdown
4. **View Indicators**: Pattern markers appear on the chart with abbreviations
5. **Hover for Details**: Move mouse over any pattern marker to see the full definition in a tooltip

### Pattern Marker Display

- **Abbreviation**: Short code (e.g., "BE" for Bullish Engulfing)
- **Position**: 
  - Bullish patterns: Below the bar
  - Bearish patterns: Above the bar
- **Color**:
  - Green circle: Bullish patterns
  - Red circle: Bearish patterns
  - Purple circle: Neutral patterns

### Tooltip Information

When hovering over a pattern marker, the tooltip displays:
- **Title**: Full pattern name (e.g., "Bullish Engulfing")
- **Definition**: Complete explanation of the pattern, including:
  - Formation details
  - Market psychology
  - Trading implications
  - Reversal/continuation indication

## Technical Details

### Pattern Definition Structure

```java
@Document(collection = "pattern_definition")
public class PatternDefinition {
    private String id;
    private String patternName;      // Human-readable name
    private String patternType;      // Matches CandleNames constants
    private String patternDefinition; // Detailed explanation
}
```

### API Response Flow

```
Frontend → GET /alert/pattern-definitions
         ↓
PatternDefinitionController
         ↓
PatternDefinitionService.getMapPatternDefinition()
         ↓
PatternDefinitionRepository.findAll()
         ↓
MongoDB: pattern_definition collection
         ↓
Response: Map<String, String> (pattern_type → definition)
```

### Frontend Data Flow

```
App Initialization
         ↓
loadPatternDefinitions()
         ↓
Store in patternDefinitions cache
         ↓
User selects pattern
         ↓
getPattern() fetches pattern occurrences
         ↓
Creates markers with abbreviations
         ↓
setupMarkerTooltips() enables hover
         ↓
User hovers over marker
         ↓
showPatternTooltip() displays definition
```

## Benefits

1. **Better User Experience**: 
   - Clean chart with abbreviations (not cluttered with full names)
   - Detailed information available on demand via hover
   - Professional appearance similar to TradingView

2. **Educational Value**:
   - Users can learn about patterns while analyzing charts
   - Comprehensive definitions help understand pattern implications
   - No need to reference external documentation

3. **Maintainability**:
   - Pattern definitions stored in database (easy to update)
   - Centralized definition management
   - No hardcoded definitions in frontend

4. **Performance**:
   - Definitions loaded once on initialization
   - Cached in memory for instant tooltip display
   - No additional API calls during pattern display

5. **Scalability**:
   - Easy to add new patterns (just add to initializer)
   - Supports internationalization (can store multiple languages)
   - Definition versioning possible through database

## Future Enhancements

1. **Multi-language Support**: Store definitions in multiple languages
2. **User Customization**: Allow users to customize abbreviations
3. **Pattern Categories**: Color-code by pattern type (reversal/continuation)
4. **Pattern Strength**: Show confidence scores in tooltips
5. **Educational Links**: Add links to detailed articles/videos
6. **Pattern Statistics**: Show success rates and probability data
7. **Custom Definitions**: Allow users to edit/add their own definitions
8. **Export Feature**: Export pattern occurrences with definitions

## Testing Checklist

- [ ] Pattern definitions initialized on first startup
- [ ] All 70+ patterns have definitions in database
- [ ] API endpoint returns all definitions correctly
- [ ] Frontend loads definitions on chart initialization
- [ ] Pattern markers display with correct abbreviations
- [ ] Marker colors match pattern sentiment (bullish/bearish)
- [ ] Tooltip appears on hover over markers
- [ ] Tooltip contains correct pattern name and definition
- [ ] Tooltip positions correctly (doesn't go off-screen)
- [ ] Tooltip hides when moving away from marker
- [ ] Theme toggle affects tooltip styling
- [ ] Works on mobile/tablet (responsive)

## Troubleshooting

### Issue: Pattern definitions not loading
**Solution**: Check MongoDB connection and ensure service started successfully

### Issue: Tooltip not appearing
**Solution**: Check browser console for errors, verify pattern definitions loaded

### Issue: Abbreviations showing as "undefined"
**Solution**: Check that pattern type matches keys in `getPatternAbbreviation()` map

### Issue: Incorrect pattern colors
**Solution**: Verify pattern name exists in `getPatternSentiment()` bullish/bearish arrays

### Issue: Tooltip going off-screen
**Solution**: Tooltip automatically adjusts position, check CSS max-width for mobile

## Conclusion

This implementation provides a professional, TradingView-style pattern indicator system with comprehensive educational tooltips. The feature enhances user experience by combining clean visual representation with detailed, on-demand information about each candlestick pattern.

The modular architecture (database → API → frontend) ensures maintainability and allows for easy future enhancements.
