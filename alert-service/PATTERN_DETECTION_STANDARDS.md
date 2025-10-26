# Candlestick Pattern Detection Standards

## 📐 Technical Specifications & Academic Standards

### Prepared by: Senior FinTech Developer
### Date: October 26, 2025

---

## 🎯 Overview

Tài liệu này mô tả chi tiết các tiêu chuẩn học thuật được áp dụng cho từng mẫu nến (candlestick pattern) trong hệ thống phát hiện pattern của chúng ta.

---

## 📊 Single Candlestick Patterns

### 1. **Hammer** 🔨
**Type**: Bullish Reversal  
**Context**: Appears after downtrend

**Academic Definition** (Steve Nison):
```
- Small real body at upper end of trading range
- Lower shadow ≥ 2× body length
- Little to no upper shadow (≤10% of range)
- Color of body not critical (can be red or green)
- Signals potential bullish reversal
```

**Implementation**:
```java
// Body Ratios
Body size: ≤ 30% of total range
Lower shadow: ≥ 200% of body size
Upper shadow: ≤ 10% of total range
Body position: Top 40% of range (lowerShadow ≥ 60% of range)

// Context
Downtrend validation: 3 candles lookback, ≥60% bearish
```

**Why This Works**:
- Nến xuất hiện sau khi giá giảm mạnh
- Bóng dưới dài cho thấy người mua đã đẩy giá lên từ đáy
- Thân nhỏ và bóng trên ngắn cho thấy áp lực bán yếu
- Tín hiệu đảo chiều tăng mạnh

---

### 2. **Inverted Hammer** 🔧
**Type**: Bullish Reversal (with confirmation)  
**Context**: Appears after downtrend

**Academic Definition**:
```
- Small real body at lower end of trading range
- Upper shadow ≥ 2× body length
- Little to no lower shadow (≤10% of range)
- Requires confirmation (next candle should be bullish)
- Less reliable than regular Hammer
```

**Implementation**:
```java
Body size: ≤ 30% of total range
Upper shadow: ≥ 200% of body size
Lower shadow: ≤ 10% of total range
Body position: Bottom 40% of range (upperShadow ≥ 60% of range)
Downtrend validation: 3 candles, ≥60% bearish
```

**Trading Psychology**:
- Bóng trên dài = Người mua thử đẩy giá nhưng bị đẩy xuống
- Xuất hiện sau downtrend = Có thể là đáy
- Cần xác nhận bởi nến tăng tiếp theo

---

### 3. **Hanging Man** 👤
**Type**: Bearish Reversal  
**Context**: Appears after uptrend

**Academic Definition**:
```
- IDENTICAL SHAPE to Hammer
- Context determines interpretation
- Appears after uptrend = Bearish signal
- Confirmation strengthens signal
```

**Implementation**:
```java
// Same shape as Hammer
Body size: ≤ 30% of total range
Lower shadow: ≥ 200% of body size
Upper shadow: ≤ 10% of total range

// Different context
Uptrend validation: 3 candles, ≥60% bullish
```

**Critical Note**:
> "The same pattern can have completely opposite meanings depending on where it appears in the trend" - Steve Nison

---

### 4. **Shooting Star** ⭐
**Type**: Bearish Reversal  
**Context**: Appears after uptrend

**Academic Definition**:
```
- IDENTICAL SHAPE to Inverted Hammer
- Appears after uptrend = Bearish signal
- Upper shadow ≥ 2× body
- Body preferably bearish (red)
```

**Implementation**:
```java
Body size: ≤ 30% of total range
Upper shadow: ≥ 200% of body size
Lower shadow: ≤ 10% of total range
Uptrend validation: 3 candles, ≥60% bullish
```

**Trading Signal**:
- Giá đạt đỉnh mới trong ngày nhưng bị đẩy xuống
- Áp lực bán mạnh ở vùng cao
- Tín hiệu đảo chiều giảm

---

### 5. **Marubozu** (Bullish & Bearish) 📏
**Type**: Continuation  
**Context**: Any trend

**Academic Definition** (Thomas Bulkowski):
```
Bullish Marubozu:
- Opens at low, closes at high
- Body ≥ 95% of total range
- No shadows or very tiny shadows (≤5% each)
- Strong bullish momentum

Bearish Marubozu:
- Opens at high, closes at low
- Body ≥ 95% of total range
- No shadows or very tiny shadows (≤5% each)
- Strong bearish momentum
```

**Implementation**:
```java
Body dominance: ≥ 95% of total range
Upper shadow: ≤ 10% of total range
Lower shadow: ≤ 10% of total range
Both shadows combined: ≤ 10% of range
```

**Statistical Performance** (Bulkowski):
- Win rate: ~57% for bullish
- Average gain: 5-8%
- Best in strong trends

---

### 6. **Doji Family** 十

#### 6.1 **Standard Doji**
**Type**: Indecision  
**Context**: Any

```
- Open ≈ Close (body ≤ 10% of range)
- Can have shadows of any length
- Signals indecision, potential reversal
```

#### 6.2 **Dragonfly Doji** 🐉
**Type**: Bullish Reversal (in downtrend)  

**Academic Definition**:
```
- Doji with long lower shadow
- No upper shadow (≤10% of range)
- Opens and closes at high
- T-shaped appearance
```

**Implementation**:
```java
Body: ≤ 10% of range (Doji)
Lower shadow: ≥ 60% of range (Long)
Upper shadow: ≤ 10% of range (Minimal)
```

**Interpretation**:
- Giá test đáy nhưng phục hồi mạnh
- Người mua kiểm soát phiên cuối
- Mạnh hơn Hammer vì body = 0

#### 6.3 **Gravestone Doji** 🪦
**Type**: Bearish Reversal (in uptrend)  

**Academic Definition**:
```
- Doji with long upper shadow
- No lower shadow (≤10% of range)
- Opens and closes at low
- Inverted T-shaped
```

**Implementation**:
```java
Body: ≤ 10% of range (Doji)
Upper shadow: ≥ 60% of range (Long)
Lower shadow: ≤ 10% of range (Minimal)
```

**Interpretation**:
- Giá test đỉnh nhưng bị đẩy xuống mạnh
- Người bán kiểm soát phiên cuối
- Mạnh hơn Shooting Star

#### 6.4 **Long-legged Doji** 🦵
**Type**: High Indecision  
**Context**: Major reversal potential

**Academic Definition**:
```
- Doji with long shadows both sides
- Each shadow ≥ 30% of range
- Shadows approximately equal
- Extreme indecision
```

**Implementation**:
```java
Body: ≤ 10% of range
Upper shadow: ≥ 30% of range
Lower shadow: ≥ 30% of range
Shadow balance: |upper - lower| ≤ 20% of range
```

---

## 🔄 Two Candlestick Patterns

### 7. **Bullish Engulfing** 🟢
**Type**: Bullish Reversal  
**Context**: After downtrend

**Academic Definition** (Steve Nison):
```
Strict criteria:
1. Previous candle: Bearish (red)
2. Current candle: Bullish (green)
3. Current body COMPLETELY engulfs previous body
4. curr.open ≤ prev.close AND curr.close ≥ prev.open
5. Larger the engulfing, stronger the signal
6. Should appear after clear downtrend
```

**Implementation**:
```java
isBearish(prev) == true
isBullish(curr) == true
curr.open <= prev.close
curr.close >= prev.open
// Optional: check body size ratio for strength
```

**Statistical Performance**:
- Win rate: 63% (Bulkowski)
- Average gain: 7.8%
- Better performance in strong trends

---

### 8. **Bearish Engulfing** 🔴
**Type**: Bearish Reversal  
**Context**: After uptrend

**Academic Definition**:
```
Mirror of Bullish Engulfing:
1. Previous candle: Bullish (green)
2. Current candle: Bearish (red)
3. Current body COMPLETELY engulfs previous body
4. curr.open ≥ prev.close AND curr.close ≤ prev.open
5. Should appear after clear uptrend
```

**Implementation**:
```java
isBullish(prev) == true
isBearish(curr) == true
curr.open >= prev.close
curr.close <= prev.open
```

---

### 9. **Piercing Line** ⚔️
**Type**: Bullish Reversal  
**Context**: After downtrend

**Academic Definition**:
```
Strict requirements:
1. First candle: Long bearish
2. Second candle: Opens below first's close (gap down)
3. Second candle: Bullish, closes ABOVE midpoint of first body
4. Second MUST close above 50% but below open of first
5. Not quite an engulfing, but strong signal
```

**Implementation**:
```java
isBearish(first) && isBullish(second)
second.open < first.close (gap down)
first_midpoint = (first.open + first.close) / 2
second.close > first_midpoint
second.close < first.open
```

**Why Midpoint Matters**:
- Nếu chỉ vượt ít = Yếu
- Vượt >50% = Người mua mạnh
- Vượt càng nhiều = Tín hiệu càng mạnh

---

### 10. **Dark Cloud Cover** ☁️
**Type**: Bearish Reversal  
**Context**: After uptrend

**Academic Definition**:
```
Mirror of Piercing Line:
1. First candle: Long bullish
2. Second candle: Opens above first's close (gap up)
3. Second candle: Bearish, closes BELOW midpoint of first body
4. Second MUST close below 50% but above open of first
```

**Implementation**:
```java
isBullish(first) && isBearish(second)
second.open > first.close (gap up)
first_midpoint = (first.open + first.close) / 2
second.close < first_midpoint
second.close > first.open
```

---

### 11. **Tweezer Top** / **Tweezer Bottom** 🔧🔧
**Type**: Reversal  
**Context**: At peaks/troughs

**Academic Definition**:
```
Tweezer Top (Bearish):
- Two candles with matching highs
- First: Bullish
- Second: Bearish or neutral
- Highs within 0.3% tolerance

Tweezer Bottom (Bullish):
- Two candles with matching lows
- First: Bearish
- Second: Bullish or neutral
- Lows within 0.3% tolerance
```

**Implementation**:
```java
// Tweezer Top
isBullish(first) && !isBullish(second)
pricesMatch(first.high, second.high, 0.003)

// Tweezer Bottom
isBearish(first) && !isBearish(second)
pricesMatch(first.low, second.low, 0.003)
```

**Key Point**: The "tweezers" represent price rejection at a level

---

## 🔮 Three Candlestick Patterns

### 12. **Morning Star** ⭐🌅
**Type**: Bullish Reversal  
**Context**: After downtrend

**Academic Definition** (Steve Nison - High Reliability):
```
Three-candle formation:
1. First: Long bearish candle
2. Second: Small body (star) - gaps down from first
3. Third: Long bullish candle - closes above midpoint of first

Critical elements:
- Star can be any color (indecision)
- Gap down before star (not mandatory but preferred)
- Third candle shows strong buying
- Closing above 50% of first body is crucial
```

**Implementation**:
```java
isBearish(first) && bodySize(first) > avg
smallBody(second) = body < 30% of first's range
isBullish(third) && bodySize(third) > avg
third.close > (first.open + first.close) / 2
// Optional: gap validation
```

**Statistical Performance** (Bulkowski):
- Win rate: 78% with confirmation
- Average gain: 11.2%
- One of the most reliable patterns

---

### 13. **Evening Star** ⭐🌆
**Type**: Bearish Reversal  
**Context**: After uptrend

**Academic Definition**:
```
Mirror of Morning Star:
1. First: Long bullish candle
2. Second: Small body (star) - gaps up from first
3. Third: Long bearish candle - closes below midpoint of first

Same reliability as Morning Star
```

**Implementation**:
```java
isBullish(first) && bodySize(first) > avg
smallBody(second) < 30% of first's range
isBearish(third) && bodySize(third) > avg
third.close < (first.open + first.close) / 2
```

---

### 14. **Morning Star Doji** / **Evening Star Doji** ⭐➕
**Type**: Enhanced Reversal  
**Context**: Same as regular Stars

**Academic Definition**:
```
IDENTICAL to Morning/Evening Star but:
- Middle candle MUST be a Doji (body ≤ 10% of range)
- More reliable than regular Star
- Shows extreme indecision before reversal
```

**Implementation**:
```java
// Same as Morning/Evening Star but:
isDoji(second) == true
// All other conditions same
```

**Why More Reliable**:
- Doji = Perfect indecision (open = close)
- Shows market equilibrium
- Reversal confirmation stronger

---

### 15. **Three White Soldiers** 👨‍✈️👨‍✈️👨‍✈️
**Type**: Bullish Continuation/Reversal  
**Context**: Preferably after downtrend or consolidation

**Academic Definition** (Thomas Bulkowski):
```
Strict criteria:
1. Three consecutive long bullish candles
2. Each opens within previous candle's body
3. Each closes progressively higher
4. Minimal upper shadows (< 20% of body)
5. Bodies should be similar size
6. Strong upward momentum signal
```

**Implementation**:
```java
isBullish(c1) && isBullish(c2) && isBullish(c3)
c2.open > c1.open && c2.open < c1.close
c2.close > c1.close
c3.open > c2.open && c3.open < c2.close
c3.close > c2.close
// Check upper shadows
```

**Trading Implications**:
- Very strong bullish signal
- Can signal start of sustained rally
- Best traded with confirmation

---

### 16. **Three Black Crows** 🐦‍⬛🐦‍⬛🐦‍⬛
**Type**: Bearish Continuation/Reversal  
**Context**: Preferably after uptrend or consolidation

**Academic Definition**:
```
Mirror of Three White Soldiers:
1. Three consecutive long bearish candles
2. Each opens within previous candle's body
3. Each closes progressively lower
4. Minimal lower shadows
5. Strong downward momentum
```

**Implementation**:
```java
isBearish(c1) && isBearish(c2) && isBearish(c3)
c2.open < c1.open && c2.open > c1.close
c2.close < c1.close
c3.open < c2.open && c3.open > c2.close
c3.close < c2.close
```

---

## 🎪 Complex Patterns

### 17. **Abandoned Baby** 👶
**Type**: Strong Reversal  
**Context**: Rare but highly reliable

**Academic Definition**:
```
Bullish Abandoned Baby:
1. First: Bearish candle
2. Second: Doji that gaps down (island)
3. Third: Bullish candle that gaps up
4. Second candle ISOLATED (gaps on both sides)

Bearish Abandoned Baby:
- Mirror pattern after uptrend
```

**Implementation**:
```java
// Bullish
isBearish(first)
isDoji(second)
hasGapDown(first, second) // second.high < first.low
isBullish(third)
hasGapUp(second, third) // third.low > second.high
```

**Rarity & Reliability**:
- Very rare in real markets
- When appears: 80%+ win rate
- "Island reversal" concept

---

### 18. **Kicker Pattern** 🦵
**Type**: Explosive Reversal  
**Context**: Gap + momentum

**Academic Definition**:
```
Bullish Kicker:
1. Strong bearish candle
2. GAP UP next day
3. Strong bullish candle
4. No overlap between bodies

Bearish Kicker:
- Mirror pattern
```

**Implementation**:
```java
// Bullish
isBearish(first) && isBullish(second)
second.open > first.close (true gap)
// Strong bodies preferred
```

**Psychological Impact**:
- Gap shows sudden sentiment shift
- No "regret zone" (gap)
- Very powerful signal

---

## 📈 Pattern Reliability Rankings

Based on Thomas Bulkowski's research:

| Pattern | Win Rate | Avg Gain | Reliability |
|---------|----------|----------|-------------|
| Morning Star | 78% | 11.2% | ⭐⭐⭐⭐⭐ |
| Evening Star | 72% | 10.1% | ⭐⭐⭐⭐⭐ |
| Abandoned Baby | 80% | 14.3% | ⭐⭐⭐⭐⭐ |
| Bullish Engulfing | 63% | 7.8% | ⭐⭐⭐⭐ |
| Bearish Engulfing | 61% | 7.5% | ⭐⭐⭐⭐ |
| Three White Soldiers | 66% | 9.2% | ⭐⭐⭐⭐ |
| Three Black Crows | 68% | 8.9% | ⭐⭐⭐⭐ |
| Hammer | 60% | 6.3% | ⭐⭐⭐ |
| Shooting Star | 58% | 5.9% | ⭐⭐⭐ |
| Marubozu | 57% | 5.4% | ⭐⭐⭐ |

---

## 🔬 Testing & Validation

### Recommended Validation Process:

1. **Backtesting**
   - Test on 5+ years historical data
   - Multiple markets/sectors
   - Include transaction costs

2. **False Positive Analysis**
   - Track failed signals
   - Identify false pattern characteristics
   - Adjust thresholds

3. **Context Validation**
   - Volume confirmation
   - Trend strength
   - Support/resistance levels

4. **Performance Metrics**
   - Win rate
   - Average gain/loss
   - Profit factor
   - Maximum drawdown

---

## 📚 References

1. **Nison, Steve** (1991). "Japanese Candlestick Charting Techniques"
2. **Bulkowski, Thomas** (2008). "Encyclopedia of Candlestick Charts"
3. **Murphy, John** (1999). "Technical Analysis of Financial Markets"
4. **Pring, Martin** (2002). "Technical Analysis Explained"
5. **TradingView** - Pattern Recognition Documentation
6. **Investopedia** - Candlestick Pattern Library

---

## 🎯 Key Takeaways

1. **Context is King**: Same pattern = different meaning in different contexts
2. **Confirmation Matters**: Wait for next candle to confirm
3. **Volume Validates**: High volume strengthens signals
4. **Risk Management**: Never trade patterns alone
5. **Backtesting Required**: Test before live trading

---

**Document Version**: 1.0  
**Last Updated**: October 26, 2025  
**Author**: Senior FinTech Developer Specialized in Technical Analysis
