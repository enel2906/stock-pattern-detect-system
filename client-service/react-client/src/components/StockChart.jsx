import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import { PATTERN_DEFINITIONS } from '../constants/patternDefinitions';
import { getPatternAbbreviation, getPatternSentiment, isValidData } from '../utils/patternUtils';
import { stockApi } from '../services/api';
import './StockChart.css';

const RIGHT_OFFSET = 20;

const StockChart = ({ stockSymbol, patternType, onStatusChange, isLight }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const originalDataRef = useRef([]);
  const patternLinesRef = useRef([]);
  const tooltipRef = useRef(null);
  
  const [isChartReady, setIsChartReady] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Add small delay to ensure container is fully rendered
    const initChart = () => {
      const container = chartContainerRef.current;
      if (!container) return;

      // Calculate dimensions, fallback to window height minus header and padding
      const width = container.offsetWidth || window.innerWidth - 20;
      const height = container.offsetHeight || window.innerHeight - 200;
      
      console.log('Initializing chart with dimensions:', { width, height, container }); // Debug log
      
      const chartProperties = {
        width: width,
        height: height,
        layout: { 
          background: { type: 'solid', color: 'transparent' }, 
          textColor: isLight ? '#1f2937' : '#c7d2e0' 
        },
        rightPriceScale: { borderColor: isLight ? '#e5e7eb' : '#2b3240' },
        timeScale: {
          borderColor: isLight ? '#e5e7eb' : '#2b3240',
          timeVisible: true,
          rightOffset: RIGHT_OFFSET,
          secondsVisible: false
        },
        grid: {
          vertLines: { color: isLight ? '#e5e7eb' : '#1f242d' },
          horzLines: { color: isLight ? '#e5e7eb' : '#1f242d' }
        },
        crosshair: { mode: 0 },
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      };

      console.log('Chart properties:', chartProperties); // Debug log

      const chart = createChart(container, chartProperties);
      chartRef.current = chart;
    
    console.log('Chart created:', chart); // Debug log

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candleSeriesRef.current = candleSeries;
    
    console.log('Candlestick series added:', candleSeries); // Debug log

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'pattern-tooltip';
    document.body.appendChild(tooltip);
    tooltipRef.current = tooltip;

    setIsChartReady(true);
    console.log('Chart ready!'); // Debug log

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.offsetWidth,
            height: chartContainerRef.current.offsetHeight,
          });
        }
      };
      
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (tooltip && tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
        if (chart) {
          chart.remove();
        }
      };
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(initChart);
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Update chart theme
  useEffect(() => {
    if (!chartRef.current) return;

    const colors = isLight
      ? { bg: 'transparent', text: '#1f2937', grid: '#e5e7eb', border: '#e5e7eb' }
      : { bg: 'transparent', text: '#c7d2e0', grid: '#1f242d', border: '#2b3240' };

    chartRef.current.applyOptions({
      layout: { background: { type: 'solid', color: colors.bg }, textColor: colors.text },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border }
    });
  }, [isLight]);

  // Load stock data
  const loadStockData = useCallback(async () => {
    if (!isChartReady || !candleSeriesRef.current) return;

    try {
      onStatusChange('Đang tải dữ liệu...');
      
      // Clear markers and lines first (but don't try to restore data yet)
      patternLinesRef.current.forEach(line => {
        try {
          chartRef.current.removeSeries(line);
        } catch (e) {
          console.warn('Could not remove line series:', e);
        }
      });
      patternLinesRef.current = [];
      candleSeriesRef.current.setMarkers([]);

      const data = await stockApi.getStockData(stockSymbol);
      
      console.log('Fetched data:', data); // Debug log

      if (isValidData(data)) {
        console.log('Setting data to chart, count:', data.length); // Debug log
        originalDataRef.current = [...data];
        candleSeriesRef.current.setData(originalDataRef.current);
        console.log('Data set successfully'); // Debug log

        // Show first 300 candles
        const INIT_BARS = 300;
        const last = Math.min(INIT_BARS - 1, originalDataRef.current.length - 1);
        chartRef.current.timeScale().setVisibleLogicalRange({ from: 0, to: last });
        console.log('Visible range set:', { from: 0, to: last }); // Debug log

        onStatusChange(`Sẵn sàng. Đã tải ${data.length} phiên cho ${stockSymbol}.`);
      } else {
        originalDataRef.current = [];
        onStatusChange('Không có dữ liệu để hiển thị.');
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
      onStatusChange('Lỗi: ' + error.message);
    }
  }, [stockSymbol, isChartReady, onStatusChange]);

  // Load pattern data
  const loadPatternData = useCallback(async (patternName) => {
    if (!isChartReady || !candleSeriesRef.current || !originalDataRef.current.length) {
      console.warn('Chart not ready or no data:', { isChartReady, hasCandleSeries: !!candleSeriesRef.current, dataLength: originalDataRef.current.length });
      return;
    }

    try {
      onStatusChange(`Đang tìm mô hình ${patternName}...`);
      resetPatterns();

      // Pass cached stock data to avoid refetching
      const patterns = await stockApi.getPatternData(stockSymbol, patternName, originalDataRef.current);

      console.log('Pattern data received:', patterns); // Debug log

      if (patterns && patterns.length > 0) {
        // Check if this is a complex pattern or simple pattern
        const isComplexPattern = patterns[0].candleIndex !== undefined && 
          (patterns[0].pivotIndices || patterns[0].flagHighs || 
           patterns[0].headIndex !== undefined || patterns[0].pennantHighs ||
           patterns[0].triangleType || patterns[0].upperTrendIndices);

        console.log('Is complex pattern:', isComplexPattern, 'Pattern sample:', patterns[0]); // Debug log

        if (isComplexPattern) {
          processComplexPattern(patterns, patternName);
        } else {
          processSimplePattern(patterns, patternName);
        }

        onStatusChange(`Tìm thấy ${patterns.length} mô hình ${patternName}.`);
      } else {
        console.log('No patterns found for:', patternName); // Debug log
        onStatusChange(`Không tìm thấy mô hình ${patternName}.`);
      }
    } catch (error) {
      console.error('Error loading pattern:', error);
      onStatusChange('Lỗi: ' + error.message);
    }
  }, [stockSymbol, isChartReady, onStatusChange]);

  // Process simple patterns (single/two/three candle patterns)
  const processSimplePattern = (patterns, patternName) => {
    const allMarkers = [];
    const abbreviation = getPatternAbbreviation(patternName);
    const sentiment = getPatternSentiment(patternName);

    patterns.forEach((pattern) => {
      allMarkers.push({
        time: pattern.time,
        position: sentiment === 'bearish' ? 'aboveBar' : 'belowBar',
        color: sentiment === 'bullish' ? '#26a69a' : sentiment === 'bearish' ? '#ef5350' : '#9933FF',
        shape: sentiment === 'bearish' ? 'arrowDown' : 'arrowUp',
        text: abbreviation,
        size: 2
      });
    });

    candleSeriesRef.current.setMarkers(allMarkers);
    setupMarkerTooltips(patterns, patternName);
  };

  // Process complex patterns (chart patterns with pivot points)
  const processComplexPattern = (patterns, patternName) => {
    console.log('Processing complex patterns:', patterns.length, 'patterns'); // Debug log
    
    const allMarkers = [];
    const abbreviation = getPatternAbbreviation(patternName);
    const sentiment = getPatternSentiment(patternName);

    patterns.forEach((pattern, index) => {
      console.log(`Processing pattern ${index + 1}:`, pattern); // Debug log
      
      // Double Pattern
      if (pattern.pivotIndices && pattern.pivotPoints) {
        console.log('Detected double pattern'); // Debug log
        processDoublePattern(pattern, allMarkers, abbreviation);
      }
      // Flag Pattern
      else if (pattern.flagHighs && pattern.flagLows) {
        console.log('Detected flag pattern'); // Debug log
        processFlagPattern(pattern, allMarkers, abbreviation);
      }
      // Head and Shoulders
      else if (pattern.headIndex !== undefined) {
        console.log('Detected head and shoulders pattern'); // Debug log
        processHeadAndShouldersPattern(pattern, allMarkers, abbreviation);
      }
      // Pennant
      else if (pattern.pennantHighs && pattern.pennantLows) {
        console.log('Detected pennant pattern'); // Debug log
        processPennantPattern(pattern, allMarkers, abbreviation);
      }
      // Triangle
      else if (pattern.triangleType || pattern.upperTrendIndices) {
        console.log('Detected triangle pattern'); // Debug log
        processTrianglePattern(pattern, allMarkers, abbreviation);
      }
      // Generic pattern
      else if (pattern.candleIndex !== undefined) {
        console.log('Detected generic complex pattern'); // Debug log
        processGenericPattern(pattern, allMarkers, patternName);
      } else {
        console.warn('Unknown pattern structure:', pattern); // Debug log
      }
    });

    console.log('Total markers created:', allMarkers.length); // Debug log
    
    if (allMarkers.length > 0) {
      candleSeriesRef.current.setMarkers(allMarkers);
      setupMarkerTooltips(patterns, patternName);
    } else {
      console.warn('No markers were created for complex patterns'); // Debug log
    }
  };

  // Helper functions for processing different pattern types
  const processDoublePattern = (pattern, allMarkers, abbreviation) => {
    const { candleIndex, pivotIndices, pivotPoints, doubleType } = pattern;

    console.log('Processing double pattern:', { 
      candleIndex, 
      pivotIndices, 
      pivotPoints, 
      doubleType,
      originalDataLength: originalDataRef.current.length 
    }); // Debug log

    // Add markers for pivot points
    pivotIndices.forEach((pivotIdx, i) => {
      if (pivotIdx >= 0 && pivotIdx < originalDataRef.current.length && pivotPoints[i]) {
        const candleData = originalDataRef.current[pivotIdx];
        if (candleData) {
          const isTop = doubleType === 'tops' || doubleType === 'both';
          const marker = {
            time: candleData.time,
            position: isTop ? 'aboveBar' : 'belowBar',
            color: doubleType === 'tops' ? '#FF4444' : '#44FF44',
            shape: 'circle',
            text: `P${i + 1}: ${pivotPoints[i].toFixed(2)}`,
            size: 1.5
          };
          allMarkers.push(marker);
          console.log('Added pivot marker:', marker); // Debug log
        } else {
          console.warn('Candle data not found at index:', pivotIdx); // Debug log
        }
      } else {
        console.warn('Invalid pivot index:', pivotIdx, 'for data length:', originalDataRef.current.length); // Debug log
      }
    });

    // Draw line connecting pivot points
    const lineData = pivotIndices
      .map((pivotIdx, i) => {
        if (pivotIdx >= 0 && pivotIdx < originalDataRef.current.length && pivotPoints[i]) {
          const candleData = originalDataRef.current[pivotIdx];
          return candleData ? { time: candleData.time, value: pivotPoints[i] } : null;
        }
        return null;
      })
      .filter(point => point !== null);

    console.log('Line data points:', lineData.length); // Debug log

    if (lineData.length > 1) {
      const lineColor = doubleType === 'tops' ? 'rgba(255, 68, 68, 0.8)' : 'rgba(68, 255, 68, 0.8)';
      const patternLine = chartRef.current.addLineSeries({
        color: lineColor,
        lineWidth: 2,
        lineStyle: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      patternLine.setData(lineData);
      patternLinesRef.current.push(patternLine);
      console.log('Added pattern line with color:', lineColor); // Debug log
    }

    // Main marker
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        const mainMarker = {
          time: mainCandle.time,
          position: doubleType === 'tops' ? 'aboveBar' : 'belowBar',
          color: doubleType === 'tops' ? '#ef5350' : '#26a69a',
          shape: doubleType === 'tops' ? 'arrowDown' : 'arrowUp',
          text: abbreviation,
          size: 2
        };
        allMarkers.push(mainMarker);
        console.log('Added main marker:', mainMarker); // Debug log
      } else {
        console.warn('Main candle data not found at index:', candleIndex); // Debug log
      }
    } else {
      console.warn('Invalid main candle index:', candleIndex); // Debug log
    }
  };

  const processFlagPattern = (pattern, allMarkers, abbreviation) => {
    const { candleIndex, flagHighsIdx, flagLowsIdx, flagHighs, flagLows, direction } = pattern;

    console.log('Processing flag pattern:', { 
      candleIndex, 
      flagHighsIdx, 
      flagLowsIdx, 
      flagHighs, 
      flagLows, 
      direction,
      originalDataLength: originalDataRef.current.length 
    }); // Debug log

    // Process flag highs
    if (flagHighsIdx && flagHighs) {
      flagHighsIdx.forEach((idx, i) => {
        if (idx >= 0 && idx < originalDataRef.current.length && flagHighs[i]) {
          const candleData = originalDataRef.current[idx];
          if (candleData) {
            const marker = {
              time: candleData.time,
              position: 'aboveBar',
              color: '#FFA500',
              shape: 'circle',
              text: `H${i + 1}: ${flagHighs[i].toFixed(2)}`,
              size: 1
            };
            allMarkers.push(marker);
            console.log('Added flag high marker:', marker); // Debug log
          }
        }
      });

      // Draw upper trendline
      const upperLineData = flagHighsIdx
        .map((idx, i) => {
          if (idx >= 0 && idx < originalDataRef.current.length && flagHighs[i]) {
            return { time: originalDataRef.current[idx].time, value: flagHighs[i] };
          }
          return null;
        })
        .filter(point => point !== null);

      console.log('Upper line data points:', upperLineData.length); // Debug log

      if (upperLineData.length > 1) {
        const upperLine = chartRef.current.addLineSeries({
          color: 'rgba(255, 165, 0, 0.8)',
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        upperLine.setData(upperLineData);
        patternLinesRef.current.push(upperLine);
        console.log('Added upper trendline'); // Debug log
      }
    }

    // Process flag lows
    if (flagLowsIdx && flagLows) {
      flagLowsIdx.forEach((idx, i) => {
        if (idx >= 0 && idx < originalDataRef.current.length && flagLows[i]) {
          const candleData = originalDataRef.current[idx];
          if (candleData) {
            const marker = {
              time: candleData.time,
              position: 'belowBar',
              color: '#00CED1',
              shape: 'circle',
              text: `L${i + 1}: ${flagLows[i].toFixed(2)}`,
              size: 1
            };
            allMarkers.push(marker);
            console.log('Added flag low marker:', marker); // Debug log
          }
        }
      });

      // Draw lower trendline
      const lowerLineData = flagLowsIdx
        .map((idx, i) => {
          if (idx >= 0 && idx < originalDataRef.current.length && flagLows[i]) {
            return { time: originalDataRef.current[idx].time, value: flagLows[i] };
          }
          return null;
        })
        .filter(point => point !== null);

      console.log('Lower line data points:', lowerLineData.length); // Debug log

      if (lowerLineData.length > 1) {
        const lowerLine = chartRef.current.addLineSeries({
          color: 'rgba(0, 206, 209, 0.8)',
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        lowerLine.setData(lowerLineData);
        patternLinesRef.current.push(lowerLine);
        console.log('Added lower trendline'); // Debug log
      }
    }

    // Main marker
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        const mainMarker = {
          time: mainCandle.time,
          position: direction === 'bullish' ? 'belowBar' : 'aboveBar',
          color: direction === 'bullish' ? '#26a69a' : '#ef5350',
          shape: direction === 'bullish' ? 'arrowUp' : 'arrowDown',
          text: abbreviation,
          size: 2
        };
        allMarkers.push(mainMarker);
        console.log('Added flag main marker:', mainMarker); // Debug log
      }
    }
  };

  const processHeadAndShouldersPattern = (pattern, allMarkers, abbreviation) => {
    const { 
      candleIndex, headIndex, leftShoulderIndex, rightShoulderIndex,
      headPrice, leftShoulderPrice, rightShoulderPrice, necklinePrice, patternType 
    } = pattern;

    // Add markers for key points
    const points = [
      { index: headIndex, price: headPrice, label: 'Head', color: '#FF4444' },
      { index: leftShoulderIndex, price: leftShoulderPrice, label: 'L.Shoulder', color: '#FFA500' },
      { index: rightShoulderIndex, price: rightShoulderPrice, label: 'R.Shoulder', color: '#FFA500' }
    ];

    points.forEach(point => {
      if (point.index >= 0 && point.index < originalDataRef.current.length) {
        const candleData = originalDataRef.current[point.index];
        if (candleData) {
          allMarkers.push({
            time: candleData.time,
            position: patternType === 'inverse' ? 'belowBar' : 'aboveBar',
            color: point.color,
            shape: 'circle',
            text: `${point.label}: ${point.price.toFixed(2)}`,
            size: 1.5
          });
        }
      }
    });

    // Draw neckline
    if (necklinePrice && leftShoulderIndex >= 0 && rightShoulderIndex >= 0) {
      const necklineData = [
        { time: originalDataRef.current[leftShoulderIndex].time, value: necklinePrice },
        { time: originalDataRef.current[rightShoulderIndex].time, value: necklinePrice }
      ];

      const neckline = chartRef.current.addLineSeries({
        color: 'rgba(255, 255, 0, 0.8)',
        lineWidth: 2,
        lineStyle: 1,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      neckline.setData(necklineData);
      patternLinesRef.current.push(neckline);
    }

    // Main marker
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        allMarkers.push({
          time: mainCandle.time,
          position: patternType === 'inverse' ? 'belowBar' : 'aboveBar',
          color: patternType === 'inverse' ? '#26a69a' : '#ef5350',
          shape: patternType === 'inverse' ? 'arrowUp' : 'arrowDown',
          text: abbreviation,
          size: 2
        });
      }
    }
  };

  const processPennantPattern = (pattern, allMarkers, abbreviation) => {
    const { candleIndex, pennantHighsIdx, pennantLowsIdx, pennantHighs, pennantLows, direction } = pattern;

    // Process pennant highs
    if (pennantHighsIdx && pennantHighs) {
      pennantHighsIdx.forEach((idx, i) => {
        if (idx >= 0 && idx < originalDataRef.current.length && pennantHighs[i]) {
          const candleData = originalDataRef.current[idx];
          if (candleData) {
            allMarkers.push({
              time: candleData.time,
              position: 'aboveBar',
              color: '#FF6B35',
              shape: 'circle',
              text: `PH${i + 1}: ${pennantHighs[i].toFixed(2)}`,
              size: 1
            });
          }
        }
      });

      // Draw upper trendline
      const upperLineData = pennantHighsIdx
        .map((idx, i) => {
          if (idx >= 0 && idx < originalDataRef.current.length && pennantHighs[i]) {
            return { time: originalDataRef.current[idx].time, value: pennantHighs[i] };
          }
          return null;
        })
        .filter(point => point !== null);

      if (upperLineData.length > 1) {
        const upperLine = chartRef.current.addLineSeries({
          color: 'rgba(255, 107, 53, 0.8)',
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        upperLine.setData(upperLineData);
        patternLinesRef.current.push(upperLine);
      }
    }

    // Process pennant lows
    if (pennantLowsIdx && pennantLows) {
      pennantLowsIdx.forEach((idx, i) => {
        if (idx >= 0 && idx < originalDataRef.current.length && pennantLows[i]) {
          const candleData = originalDataRef.current[idx];
          if (candleData) {
            allMarkers.push({
              time: candleData.time,
              position: 'belowBar',
              color: '#4ECDC4',
              shape: 'circle',
              text: `PL${i + 1}: ${pennantLows[i].toFixed(2)}`,
              size: 1
            });
          }
        }
      });

      // Draw lower trendline
      const lowerLineData = pennantLowsIdx
        .map((idx, i) => {
          if (idx >= 0 && idx < originalDataRef.current.length && pennantLows[i]) {
            return { time: originalDataRef.current[idx].time, value: pennantLows[i] };
          }
          return null;
        })
        .filter(point => point !== null);

      if (lowerLineData.length > 1) {
        const lowerLine = chartRef.current.addLineSeries({
          color: 'rgba(78, 205, 196, 0.8)',
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        lowerLine.setData(lowerLineData);
        patternLinesRef.current.push(lowerLine);
      }
    }

    // Main marker
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        allMarkers.push({
          time: mainCandle.time,
          position: direction === 'bullish' ? 'belowBar' : 'aboveBar',
          color: direction === 'bullish' ? '#26a69a' : '#ef5350',
          shape: direction === 'bullish' ? 'arrowUp' : 'arrowDown',
          text: abbreviation,
          size: 2
        });
      }
    }
  };

  const processTrianglePattern = (pattern, allMarkers, abbreviation) => {
    const { 
      candleIndex, triangleType, upperTrendIndices, lowerTrendIndices,
      upperTrendValues, lowerTrendValues 
    } = pattern;

    // Color scheme based on triangle type
    const colors = {
      'ascending': { upper: '#32CD32', lower: '#32CD32', main: '#00FF00' },
      'descending': { upper: '#FF6347', lower: '#FF6347', main: '#FF0000' },
      'symmetrical': { upper: '#FFD700', lower: '#FFD700', main: '#FFA500' }
    };
    const color = colors[triangleType] || colors['symmetrical'];

    // Process upper trend
    if (upperTrendIndices && upperTrendValues) {
      upperTrendIndices.forEach((idx, i) => {
        if (idx >= 0 && idx < originalDataRef.current.length && upperTrendValues[i]) {
          const candleData = originalDataRef.current[idx];
          if (candleData) {
            allMarkers.push({
              time: candleData.time,
              position: 'aboveBar',
              color: color.upper,
              shape: 'circle',
              text: `U${i + 1}: ${upperTrendValues[i].toFixed(2)}`,
              size: 1
            });
          }
        }
      });

      // Draw upper trendline
      const upperLineData = upperTrendIndices
        .map((idx, i) => {
          if (idx >= 0 && idx < originalDataRef.current.length && upperTrendValues[i]) {
            return { time: originalDataRef.current[idx].time, value: upperTrendValues[i] };
          }
          return null;
        })
        .filter(point => point !== null);

      if (upperLineData.length > 1) {
        const upperLine = chartRef.current.addLineSeries({
          color: color.upper + '80',
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        upperLine.setData(upperLineData);
        patternLinesRef.current.push(upperLine);
      }
    }

    // Process lower trend
    if (lowerTrendIndices && lowerTrendValues) {
      lowerTrendIndices.forEach((idx, i) => {
        if (idx >= 0 && idx < originalDataRef.current.length && lowerTrendValues[i]) {
          const candleData = originalDataRef.current[idx];
          if (candleData) {
            allMarkers.push({
              time: candleData.time,
              position: 'belowBar',
              color: color.lower,
              shape: 'circle',
              text: `L${i + 1}: ${lowerTrendValues[i].toFixed(2)}`,
              size: 1
            });
          }
        }
      });

      // Draw lower trendline
      const lowerLineData = lowerTrendIndices
        .map((idx, i) => {
          if (idx >= 0 && idx < originalDataRef.current.length && lowerTrendValues[i]) {
            return { time: originalDataRef.current[idx].time, value: lowerTrendValues[i] };
          }
          return null;
        })
        .filter(point => point !== null);

      if (lowerLineData.length > 1) {
        const lowerLine = chartRef.current.addLineSeries({
          color: color.lower + '80',
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        lowerLine.setData(lowerLineData);
        patternLinesRef.current.push(lowerLine);
      }
    }

    // Main marker
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        const triSentiment = triangleType === 'ascending' ? 'bullish' :
                           triangleType === 'descending' ? 'bearish' : 'neutral';
        allMarkers.push({
          time: mainCandle.time,
          position: triSentiment === 'bearish' ? 'aboveBar' : 'belowBar',
          color: triSentiment === 'bullish' ? '#26a69a' :
                 triSentiment === 'bearish' ? '#ef5350' : '#9933FF',
          shape: triSentiment === 'bearish' ? 'arrowDown' : triSentiment === 'bullish' ? 'arrowUp' : 'circle',
          text: abbreviation,
          size: 2
        });
      }
    }
  };

  const processGenericPattern = (pattern, allMarkers, patternName) => {
    if (pattern.candleIndex >= 0 && pattern.candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[pattern.candleIndex];
      if (mainCandle) {
        const sentiment = getPatternSentiment(patternName);
        allMarkers.push({
          time: mainCandle.time,
          position: sentiment === 'bearish' ? 'aboveBar' : 'belowBar',
          color: sentiment === 'bullish' ? '#26a69a' : sentiment === 'bearish' ? '#ef5350' : '#9933FF',
          shape: sentiment === 'bearish' ? 'arrowDown' : sentiment === 'bullish' ? 'arrowUp' : 'circle',
          text: getPatternAbbreviation(patternName),
          size: 2
        });
      }
    }
  };

  // Setup tooltip listeners
  const setupMarkerTooltips = (patterns, patternName) => {
    if (!chartRef.current || !tooltipRef.current) return;

    chartRef.current.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.point) {
        hideTooltip();
        return;
      }

      const hoveredPattern = patterns.find(p => {
        if (p.candleIndex !== undefined && p.candleIndex >= 0 && p.candleIndex < originalDataRef.current.length) {
          return originalDataRef.current[p.candleIndex].time === param.time;
        }
        return p.time === param.time;
      });

      if (hoveredPattern) {
        showTooltip(patternName, param.point.x, param.point.y);
      } else {
        hideTooltip();
      }
    });
  };

  // Show tooltip
  const showTooltip = (patternName, x, y) => {
    if (!tooltipRef.current) return;

    const definition = PATTERN_DEFINITIONS[patternName];
    if (!definition) return;

    tooltipRef.current.innerHTML = `
      <div class="pattern-tooltip-title">${patternName.replace(/_/g, ' ').toUpperCase()}</div>
      <div class="pattern-tooltip-content">${definition}</div>
    `;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let left = x + 10;
    let top = y + 10;

    if (left + tooltipRect.width > window.innerWidth) {
      left = x - tooltipRect.width - 10;
    }
    if (top + tooltipRect.height > window.innerHeight) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    tooltipRef.current.style.left = left + 'px';
    tooltipRef.current.style.top = top + 'px';
    tooltipRef.current.classList.add('visible');
  };

  // Hide tooltip
  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.classList.remove('visible');
    }
  };

  // Reset patterns
  const resetPatterns = useCallback(() => {
    if (!candleSeriesRef.current) return;

    // Remove all pattern lines
    patternLinesRef.current.forEach(line => {
      try {
        chartRef.current.removeSeries(line);
      } catch (e) {
        console.warn('Could not remove line series:', e);
      }
    });
    patternLinesRef.current = [];

    // Clear markers
    candleSeriesRef.current.setMarkers([]);

    // Restore original data
    if (isValidData(originalDataRef.current)) {
      candleSeriesRef.current.setData([...originalDataRef.current]);
    }
  }, []);

  // Handle stock symbol change
  useEffect(() => {
    if (isChartReady && stockSymbol) {
      loadStockData();
    }
  }, [stockSymbol, isChartReady, loadStockData]);

  // Handle pattern type change
  useEffect(() => {
    if (!isChartReady || !patternType || patternType === 'reset') {
      if (patternType === 'reset') {
        resetPatterns();
        onStatusChange('Sẵn sàng.');
      }
      return;
    }

    loadPatternData(patternType);
  }, [patternType, isChartReady, loadPatternData, resetPatterns, onStatusChange]);

  return (
    <div className="chart-container">
      <div ref={chartContainerRef} className="chart" />
    </div>
  );
};

export default StockChart;
