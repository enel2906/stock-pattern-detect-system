package com.example.alert.constant;

import java.util.HashMap;
import java.util.Map;

public class CandlePatternColor {

    public static final Map<String, String> CANDLE_COLOR_MAP = new HashMap<>();

    static {
        // One candle patterns
        CANDLE_COLOR_MAP.put(CandleNames.HAMMER, "#FF8000");
        CANDLE_COLOR_MAP.put(CandleNames.LONG_LEGGED_DOJI, "#BEBEBE");
        CANDLE_COLOR_MAP.put(CandleNames.GRAVESTONE_DOJI, "#A9A9A9");
        CANDLE_COLOR_MAP.put(CandleNames.DRAGONFLY_DOJI, "#FFD700");
        CANDLE_COLOR_MAP.put(CandleNames.INVERTED_HAMMER, "#FF6347");
        CANDLE_COLOR_MAP.put(CandleNames.HANGING_MAN, "#8B0000");
        CANDLE_COLOR_MAP.put(CandleNames.SHOOTING_STAR, "#FF4500");
        CANDLE_COLOR_MAP.put(CandleNames.BEARISH_MARUBOZU, "#000000");
        CANDLE_COLOR_MAP.put(CandleNames.BULLISH_MARUBOZU, "#32CD32");
        CANDLE_COLOR_MAP.put(CandleNames.BEARISH_BELT_HOLD, "#800000");
        CANDLE_COLOR_MAP.put(CandleNames.BULLISH_BELT_HOLD, "#228B22");

        // Two candle patterns
        CANDLE_COLOR_MAP.put(CandleNames.BULLISH_ENGULFING, "#00FF00");
        CANDLE_COLOR_MAP.put(CandleNames.BEARISH_ENGULFING, "#FF0000");
        CANDLE_COLOR_MAP.put(CandleNames.BEARISH_KICKER, "#8B0000");
        CANDLE_COLOR_MAP.put(CandleNames.BULLISH_KICKER, "#006400");
        CANDLE_COLOR_MAP.put(CandleNames.PIERCING_LINE, "#00CED1");
        CANDLE_COLOR_MAP.put(CandleNames.TWEEZER_BOTTOM, "#4682B4");
        CANDLE_COLOR_MAP.put(CandleNames.TWEEZER_TOP, "#4682B4");
        CANDLE_COLOR_MAP.put(CandleNames.HARAMI, "#D2691E");
        CANDLE_COLOR_MAP.put(CandleNames.DARK_CLOUD_COVER, "#2F4F4F");
        CANDLE_COLOR_MAP.put(CandleNames.MATCHING_LOW, "#4B0082");
        CANDLE_COLOR_MAP.put(CandleNames.MATCHING_HIGH, "#4B0082");
        CANDLE_COLOR_MAP.put(CandleNames.BEARISH_HARAMI_CROSS, "#B22222");
        CANDLE_COLOR_MAP.put(CandleNames.BULLISH_HARAMI_CROSS, "#ADFF2F");
        CANDLE_COLOR_MAP.put(CandleNames.BEARISH_COUNTERATTACK, "#DC143C");
        CANDLE_COLOR_MAP.put(CandleNames.BULLISH_COUNTERATTACK, "#7FFF00");

        // Three candle patterns
        CANDLE_COLOR_MAP.put(CandleNames.THREE_WHITE_SOLDIERS, "#FFFFFF");
        CANDLE_COLOR_MAP.put(CandleNames.THREE_BLACK_CROWS, "#000000");
        CANDLE_COLOR_MAP.put(CandleNames.EVENING_STAR, "#FF1493");
        CANDLE_COLOR_MAP.put(CandleNames.MORNING_STAR, "#FFD700");
        CANDLE_COLOR_MAP.put(CandleNames.THREE_OUTSIDE_UP, "#3CB371");
        CANDLE_COLOR_MAP.put(CandleNames.THREE_INSIDE_UP, "#4682B4");
        CANDLE_COLOR_MAP.put(CandleNames.BEARISH_ABANDONED_BABY, "#8B0000");
        CANDLE_COLOR_MAP.put(CandleNames.DOWNSIDE_TASUKI_GAP, "#DC143C");
        CANDLE_COLOR_MAP.put(CandleNames.UPSIDE_TASUKI_GAP, "#7CFC00");
        CANDLE_COLOR_MAP.put(CandleNames.EVENING_STAR_DOJI, "#FF6347");
        CANDLE_COLOR_MAP.put(CandleNames.MORNING_STAR_DOJI, "#FFD700");
        CANDLE_COLOR_MAP.put(CandleNames.BEARISH_TRI_STAR, "#8B0000");
        CANDLE_COLOR_MAP.put(CandleNames.BULLISH_TRI_STAR, "#32CD32");
        CANDLE_COLOR_MAP.put(CandleNames.THRUSTING, "#FFA07A");
        CANDLE_COLOR_MAP.put(CandleNames.UPSIDE_GAP_TWO_CROWS, "#2E8B57");
        CANDLE_COLOR_MAP.put(CandleNames.THREE_STAR_IN_THE_SOUTH, "#1E90FF");
        CANDLE_COLOR_MAP.put(CandleNames.ADVANCE_BLOCK, "#FF8C00");
        CANDLE_COLOR_MAP.put(CandleNames.DESCENDING_HAWK, "#FF4500");
        CANDLE_COLOR_MAP.put(CandleNames.DELIBERATION, "#00FA9A");

        // Many candle patterns
        CANDLE_COLOR_MAP.put(CandleNames.FALLING_THREE, "#FF4500");
        CANDLE_COLOR_MAP.put(CandleNames.RISING_THREE, "#00FF7F");
        CANDLE_COLOR_MAP.put(CandleNames.BEARISH_THREE_LINE_STRIKE, "#8B0000");
        CANDLE_COLOR_MAP.put(CandleNames.BULLISH_THREE_LINE_STRIKE, "#006400");
        CANDLE_COLOR_MAP.put(CandleNames.LADDER_TOP, "#4682B4");

        // Complex candle patterns
        CANDLE_COLOR_MAP.put(CandleNames.CUP_WITH_HANDLE, "#FF4500");
    }

    public static String getColor(String candleName) {
        return CANDLE_COLOR_MAP.getOrDefault(candleName, "#000000"); // Default to black if not found
    }
}

