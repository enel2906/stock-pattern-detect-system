import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { PATTERN_DEFINITIONS } from '../constants/patternDefinitions';
import { getPatternAbbreviation, getPatternSentiment, isValidData } from '../utils/patternUtils';
import { stockApi } from '../services/api';
import { getIndicatorConfig } from '../constants/indicatorOptions';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands 
} from '../services/technicalIndicators';
import './StockChart.css';

const RIGHT_OFFSET = 20;

const StockChart = ({ stockSymbol, selectedPatterns, selectedIndicators, onStatusChange, isLight }) => {
  const chartContainerRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const chartRef = useRef(null);
  const volChartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const originalDataRef = useRef([]);
  const volumeMapRef = useRef(new Map()); // Map for O(1) volume lookup
  const patternLinesRef = useRef([]);
  const indicatorSeriesRef = useRef([]); // Store indicator line series
  const tooltipRef = useRef(null);
  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  
  const [isChartReady, setIsChartReady] = useState(false);
  const [dataLoadCounter, setDataLoadCounter] = useState(0); // Track when new data is loaded
  const [ohlcvInfo, setOhlcvInfo] = useState(null); // Current OHLCV info

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
      priceScaleId: 'right', // Main price scale
    });
    
    // Configure main price scale to leave room for indicators
    candleSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.1, // 10% padding at top
        bottom: 0.2, // 20% space at bottom for indicators
      },
    });
    
    candleSeriesRef.current = candleSeries;
    
    console.log('Candlestick series added:', candleSeries); // Debug log

    // Create volume chart
    const volContainer = volumeContainerRef.current;
    if (volContainer) {
      const volWidth = volContainer.offsetWidth || window.innerWidth - 20;
      const volHeight = volContainer.offsetHeight || 150;
      
      const volChart = createChart(volContainer, {
        width: volWidth,
        height: volHeight,
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
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      });
      
      volChartRef.current = volChart;
      
      const volumeSeries = volChart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        base: 0,
      });
      
      volumeSeriesRef.current = volumeSeries;
      
      console.log('Volume chart created:', volChart);
      
      // Sync time scales between charts
      const syncScales = (master, slave) => {
        let syncing = false;
        master.timeScale().subscribeVisibleLogicalRangeChange(() => {
          if (syncing) return;
          const lr = master.timeScale().getVisibleLogicalRange();
          if (!lr) return;
          syncing = true;
          slave.timeScale().setVisibleLogicalRange(lr);
          syncing = false;
        });
      };
      
      syncScales(chart, volChart);
      syncScales(volChart, chart);
    }

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'pattern-tooltip';
    document.body.appendChild(tooltip);
    tooltipRef.current = tooltip;

    // Subscribe to crosshair move to update OHLCV info (Optimized with Map O(1))
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData || param.seriesData.size === 0) {
        setOhlcvInfo(null);
        return;
      }

      const candleData = param.seriesData.get(candleSeries);
      if (candleData) {
        // O(1) lookup using Map instead of O(N) find
        const volume = volumeMapRef.current.get(param.time) || 0;
        setOhlcvInfo({
          time: param.time,
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volume
        });
      }
    });

    setIsChartReady(true);
    console.log('Chart ready!'); // Debug log

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.offsetWidth,
            height: chartContainerRef.current.offsetHeight,
          });
        }
        if (volumeContainerRef.current && volChartRef.current) {
          volChartRef.current.applyOptions({
            width: volumeContainerRef.current.offsetWidth,
            height: volumeContainerRef.current.offsetHeight,
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
        if (chartRef.current) {
          chartRef.current.remove();
        }
        if (volChartRef.current) {
          volChartRef.current.remove();
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
    
    if (volChartRef.current) {
      volChartRef.current.applyOptions({
        layout: { background: { type: 'solid', color: colors.bg }, textColor: colors.text },
        grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
        rightPriceScale: { borderColor: colors.border },
        timeScale: { borderColor: colors.border }
      });
    }
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
        
        // Populate volume Map for O(1) lookup
        volumeMapRef.current.clear();
        const volumeData = [];
        data.forEach(item => {
          volumeMapRef.current.set(item.time, item.volume);
          volumeData.push({
            time: item.time,
            value: item.volume,
            color: (item.close >= item.open) ? '#26a69a' : '#ef5350'
          });
        });
        
        candleSeriesRef.current.setData(originalDataRef.current);
        
        // Set volume data
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(volumeData);
          console.log('Volume data set successfully:', volumeData.length);
        }
        
        console.log('Data set successfully'); // Debug log

        // Scroll to the most recent candles (like TradingView)
        // Optimal range: 80-120 candles for good balance between detail and overview
        const VISIBLE_BARS = 150; // Show last 100 candles (default comfortable zoom)
        const totalBars = originalDataRef.current.length;
        const from = Math.max(0, totalBars - VISIBLE_BARS);
        const to = totalBars - 1;
        
        // Use setTimeout to ensure data is rendered before scrolling
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.timeScale().setVisibleLogicalRange({ from, to });
          }
          if (volChartRef.current) {
            volChartRef.current.timeScale().setVisibleLogicalRange({ from, to });
          }
          console.log('Scrolled to most recent candles:', { from, to, total: totalBars }); // Debug log
        }, 50);

        // Trigger reload of patterns and indicators
        setDataLoadCounter(prev => prev + 1);

        onStatusChange(`Sẵn sàng. Đã tải ${data.length} phiên cho ${stockSymbol}.`);
      } else {
        originalDataRef.current = [];
        volumeMapRef.current.clear();
        onStatusChange('Không có dữ liệu để hiển thị.');
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
      onStatusChange('Lỗi: ' + error.message);
    }
  }, [stockSymbol, isChartReady, onStatusChange]);

  // Load multiple pattern data
  const loadPatternsData = useCallback(async (patternNames) => {
    if (!isChartReady || !candleSeriesRef.current || !originalDataRef.current.length) {
      console.warn('Chart not ready or no data:', { isChartReady, hasCandleSeries: !!candleSeriesRef.current, dataLength: originalDataRef.current.length });
      return;
    }

    // If no patterns selected, just reset
    if (!patternNames || patternNames.length === 0) {
      resetPatterns();
      onStatusChange('Sẵn sàng.');
      return;
    }

    try {
      onStatusChange(`Đang tìm ${patternNames.length} mô hình...`);
      resetPatterns();

      // Collect all markers and lines from all patterns
      const allMarkers = [];
      const allPatternLines = [];
      let totalPatternsFound = 0;

      // Process each pattern
      for (const patternName of patternNames) {
        try {
          console.log(`Processing pattern: ${patternName}`);
          
          // Pass cached stock data to avoid refetching
          const patterns = await stockApi.getPatternData(stockSymbol, patternName, originalDataRef.current);

          console.log(`Pattern ${patternName} returned:`, patterns.length, 'patterns');

          if (patterns && patterns.length > 0) {
            totalPatternsFound += patterns.length;

            // Check if this is a complex pattern or simple pattern
            const isComplexPattern = patterns[0].candleIndex !== undefined && 
              (patterns[0].pivotIndices || patterns[0].flagHighs || 
               patterns[0].headIndex !== undefined || patterns[0].pennantHighs ||
               patterns[0].triangleType || patterns[0].upperTrendIndices ||
               patterns[0].cupBoundaryPoints);

            if (isComplexPattern) {
              const { markers, lines } = collectComplexPatternData(patterns, patternName);
              allMarkers.push(...markers);
              allPatternLines.push(...lines);
            } else {
              const markers = collectSimplePatternData(patterns, patternName);
              allMarkers.push(...markers);
            }
          }
        } catch (error) {
          console.error(`Error processing pattern ${patternName}:`, error);
        }
      }

      console.log(`Total markers collected: ${allMarkers.length}`);
      console.log(`Total lines collected: ${allPatternLines.length}`);

      // Sort markers by time (required by LightweightCharts)
      // Convert time string to timestamp for sorting
      allMarkers.sort((a, b) => {
        const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() / 1000 : a.time;
        const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() / 1000 : b.time;
        return timeA - timeB;
      });

      console.log(`Markers sorted, first time: ${allMarkers[0]?.time}, last time: ${allMarkers[allMarkers.length - 1]?.time}`);

      // Apply all markers at once
      if (allMarkers.length > 0) {
        candleSeriesRef.current.setMarkers(allMarkers);
        // Store markers for tooltip lookup
        allPatternMarkersRef.current = allMarkers;
      }

      // Apply all pattern lines
      allPatternLines.forEach(lineData => {
        try {
          // Check if this is an area series
          if (lineData.options.type === 'area' && lineData.options.bottomData) {
            // Create area series for filled regions
            const areaSeries = chartRef.current.addAreaSeries({
              topColor: lineData.options.topColor || 'rgba(38, 198, 218, 0.28)',
              bottomColor: lineData.options.bottomColor || 'rgba(38, 198, 218, 0.05)',
              lineColor: lineData.options.lineColor || 'rgba(38, 198, 218, 1)',
              lineWidth: lineData.options.lineWidth || 2,
              crosshairMarkerVisible: false,
              lastValueVisible: false,
              priceLineVisible: false,
            });
            // Area series uses simple value data
            areaSeries.setData(lineData.data);
            patternLinesRef.current.push(areaSeries);
          } else {
            // Regular line series
            const line = chartRef.current.addLineSeries(lineData.options);
            line.setData(lineData.data);
            patternLinesRef.current.push(line);
          }
        } catch (error) {
          console.error('Error adding line/area series:', error);
        }
      });

      // Setup tooltips for all patterns
      setupMultiPatternTooltips(patternNames);

      onStatusChange(`Tìm thấy ${totalPatternsFound} mô hình từ ${patternNames.length} loại.`);
    } catch (error) {
      console.error('Error loading patterns:', error);
      onStatusChange('Lỗi: ' + error.message);
    }
  }, [stockSymbol, isChartReady, onStatusChange]);

  // Collect simple pattern markers (don't render yet)
  const collectSimplePatternData = (patterns, patternName) => {
    const markers = [];
    const abbreviation = getPatternAbbreviation(patternName);
    const sentiment = getPatternSentiment(patternName);
    
    // TradingView style: Bright neon colors with arrow shapes
    let markerConfig = {
      color: '#FEB019', // Default yellow/orange for neutral
      shape: 'circle',
      position: 'aboveBar'
    };

    if (sentiment === 'bullish') {
      markerConfig = {
        color: '#00E396', // Bright green/neon
        shape: 'arrowUp',
        position: 'belowBar'
      };
    } else if (sentiment === 'bearish') {
      markerConfig = {
        color: '#FF4560', // Bright red/neon
        shape: 'arrowDown',
        position: 'aboveBar'
      };
    }

    patterns.forEach((pattern) => {
      markers.push({
        time: pattern.time,
        position: markerConfig.position,
        color: markerConfig.color,
        shape: markerConfig.shape,
        text: abbreviation,
        size: 2, // Larger for better visibility
        patternName: patternName // Store for tooltip
      });
    });

    return markers;
  };

  // Process simple patterns (single/two/three candle patterns) - DEPRECATED, use collectSimplePatternData
  const processSimplePattern = (patterns, patternName) => {
    const allMarkers = collectSimplePatternData(patterns, patternName);
    candleSeriesRef.current.setMarkers(allMarkers);
    setupMarkerTooltips(patterns, patternName);
  };

  // Collect Cup with Handle data
  const collectCupWithHandleData = (pattern, abbreviation, patternName) => {
    const {
      leftHighIndex, rightHighIndex, handleEndIndex,
      cupBoundaryPoints, leftHighValue, rightHighValue, handleLowValue
    } = pattern;
    const markers = [];
    const lines = [];

    if (!cupBoundaryPoints || cupBoundaryPoints.length === 0) {
      console.warn('No cup boundary points available');
      return { markers, lines };
    }

    // Draw the cup shape using boundary points
    // Top boundary line
    const topBoundaryData = cupBoundaryPoints
      .filter(point => point && point.topValue != null)
      .map(point => ({ time: point.time, value: point.topValue }));

    if (topBoundaryData.length > 1) {
      lines.push({
        data: topBoundaryData,
        options: {
          color: 'rgba(255, 193, 7, 0.8)', // Golden yellow for top
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        }
      });
    }

    // Bottom boundary line
    const bottomBoundaryData = cupBoundaryPoints
      .filter(point => point && point.bottomValue != null)
      .map(point => ({ time: point.time, value: point.bottomValue }));

    if (bottomBoundaryData.length > 1) {
      lines.push({
        data: bottomBoundaryData,
        options: {
          color: 'rgba(255, 193, 7, 0.8)', // Golden yellow for bottom
          lineWidth: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        }
      });
    }

    // Create area series data to fill the cup region
    // We'll create two area series that fill between boundaries
    const cupAreaTopData = cupBoundaryPoints.map(point => ({
      time: point.time,
      value: point.topValue
    }));

    const cupAreaBottomData = cupBoundaryPoints.map(point => ({
      time: point.time,
      value: point.bottomValue
    }));

    // Add area series as special line type for rendering
    if (cupAreaTopData.length > 1 && cupAreaBottomData.length > 1) {
      lines.push({
        data: cupAreaTopData,
        options: {
          type: 'area', // Special marker for area series
          bottomData: cupAreaBottomData,
          topColor: 'rgba(255, 193, 7, 0.15)',
          bottomColor: 'rgba(255, 193, 7, 0.05)',
          lineColor: 'rgba(255, 193, 7, 0)',
          lineWidth: 0,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        }
      });
    }

    // Draw handle area box (right high to handle end)
    // Right high horizontal line (handle top)
    if (rightHighIndex >= 0 && handleEndIndex >= 0 && rightHighIndex < originalDataRef.current.length && handleEndIndex < originalDataRef.current.length) {
      lines.push({
        data: [
          { time: originalDataRef.current[rightHighIndex].time, value: rightHighValue },
          { time: originalDataRef.current[handleEndIndex].time, value: rightHighValue }
        ],
        options: {
          color: 'rgba(255, 152, 0, 0.6)', // Orange for handle top
          lineWidth: 2,
          lineStyle: 2, // Dashed
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        }
      });

      // Handle bottom line (handle low)
      if (handleLowValue) {
        lines.push({
          data: [
            { time: originalDataRef.current[rightHighIndex].time, value: handleLowValue },
            { time: originalDataRef.current[handleEndIndex].time, value: handleLowValue }
          ],
          options: {
            color: 'rgba(255, 152, 0, 0.6)', // Orange for handle bottom
            lineWidth: 2,
            lineStyle: 2, // Dashed
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          }
        });

        // Fill handle area
        const handleAreaData = [
          { time: originalDataRef.current[rightHighIndex].time, value: rightHighValue },
          { time: originalDataRef.current[handleEndIndex].time, value: rightHighValue }
        ];
        lines.push({
          data: handleAreaData,
          options: {
            type: 'area',
            bottomData: [
              { time: originalDataRef.current[rightHighIndex].time, value: handleLowValue },
              { time: originalDataRef.current[handleEndIndex].time, value: handleLowValue }
            ],
            topColor: 'rgba(255, 152, 0, 0.2)',
            bottomColor: 'rgba(255, 152, 0, 0.1)',
            lineColor: 'rgba(255, 152, 0, 0)',
            lineWidth: 0,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          }
        });
      }
    }

    // Add small markers for key points
    // Left high point
    if (leftHighIndex >= 0 && leftHighIndex < originalDataRef.current.length) {
      const leftCandle = originalDataRef.current[leftHighIndex];
      if (leftCandle) {
        markers.push({
          time: leftCandle.time,
          position: 'aboveBar',
          color: 'rgba(255, 193, 7, 0.7)',
          shape: 'circle',
          text: 'L',
          size: 0.8,
          patternName: patternName
        });
      }
    }

    // Right high point
    if (rightHighIndex >= 0 && rightHighIndex < originalDataRef.current.length) {
      const rightCandle = originalDataRef.current[rightHighIndex];
      if (rightCandle) {
        markers.push({
          time: rightCandle.time,
          position: 'aboveBar',
          color: 'rgba(255, 193, 7, 0.7)',
          shape: 'circle',
          text: 'R',
          size: 0.8,
          patternName: patternName
        });
      }
    }

    // Main marker at right high (where cup pattern is confirmed)
    // This is more consistent with other patterns that show marker at confirmation point
    if (rightHighIndex >= 0 && rightHighIndex < originalDataRef.current.length) {
      const rightCandle = originalDataRef.current[rightHighIndex + 1]; // Marker at next candle after right high
      if (rightCandle) {
        markers.push({
          time: rightCandle.time,
          position: 'belowBar',
          color: '#00E396',
          shape: 'arrowUp',
          text: abbreviation,
          size: 3,
          patternName: patternName
        });
      }
    }

    return { markers, lines };
  };

  // Collect complex pattern data (markers and lines) without rendering
  const collectComplexPatternData = (patterns, patternName) => {
    console.log('Collecting complex patterns data:', patterns.length, 'patterns');
    
    const allMarkers = [];
    const allLines = [];
    const abbreviation = getPatternAbbreviation(patternName);

    patterns.forEach((pattern, index) => {
      console.log(`Collecting pattern ${index + 1}:`, pattern);
      
      // Cup with Handle Pattern
      if (pattern.cupBoundaryPoints && pattern.leftHighIndex !== undefined) {
        const result = collectCupWithHandleData(pattern, abbreviation, patternName);
        allMarkers.push(...result.markers);
        allLines.push(...result.lines);
      }
      // Double Pattern
      else if (pattern.pivotIndices && pattern.pivotPoints) {
        const result = collectDoublePatternData(pattern, abbreviation, patternName);
        allMarkers.push(...result.markers);
        if (result.line) allLines.push(result.line);
      }
      // Flag Pattern
      else if (pattern.flagHighs && pattern.flagLows) {
        const result = collectFlagPatternData(pattern, abbreviation, patternName);
        allMarkers.push(...result.markers);
        allLines.push(...result.lines);
      }
      // Head and Shoulders
      else if (pattern.headIndex !== undefined) {
        const result = collectHeadAndShouldersData(pattern, abbreviation, patternName);
        allMarkers.push(...result.markers);
        if (result.line) allLines.push(result.line);
      }
      // Pennant
      else if (pattern.pennantHighs && pattern.pennantLows) {
        const result = collectPennantData(pattern, abbreviation, patternName);
        allMarkers.push(...result.markers);
        allLines.push(...result.lines);
      }
      // Triangle
      else if (pattern.triangleType || pattern.upperTrendIndices) {
        const result = collectTriangleData(pattern, abbreviation, patternName);
        allMarkers.push(...result.markers);
        allLines.push(...result.lines);
      }
      // Generic pattern
      else if (pattern.candleIndex !== undefined) {
        const result = collectGenericPatternData(pattern, patternName);
        allMarkers.push(...result.markers);
      }
    });

    console.log('Collected markers:', allMarkers.length, 'lines:', allLines.length);
    
    return { markers: allMarkers, lines: allLines };
  };

  // Process complex patterns (chart patterns with pivot points) - DEPRECATED, use collectComplexPatternData
  const processComplexPattern = (patterns, patternName) => {
    const { markers, lines } = collectComplexPatternData(patterns, patternName);
    
    if (markers.length > 0) {
      candleSeriesRef.current.setMarkers(markers);
    }
    
    lines.forEach(lineData => {
      const line = chartRef.current.addLineSeries(lineData.options);
      line.setData(lineData.data);
      patternLinesRef.current.push(line);
    });
    
    setupMarkerTooltips(patterns, patternName);
  };

  // Helper functions for processing different pattern types
  // Collect double pattern data
  const collectDoublePatternData = (pattern, abbreviation, patternName) => {
    const { candleIndex, pivotIndices, pivotPoints, pivotPointsData, doubleType } = pattern;
    const markers = [];
    let line = null;

    // Prepare line data using time-based pivot points (more accurate than index-based)
    let lineData = [];
    
    if (pivotPointsData && pivotPointsData.length > 0) {
      // Use time-based data if available (preferred method)
      lineData = pivotPointsData
        .filter(point => point && point.time && point.value != null)
        .map(point => ({ time: point.time, value: point.value }));
    } else {
      // Fallback to index-based method (legacy)
      lineData = pivotIndices
        .map((pivotIdx, i) => {
          if (pivotIdx >= 0 && pivotIdx < originalDataRef.current.length && pivotPoints[i]) {
            const candleData = originalDataRef.current[pivotIdx];
            return candleData ? { time: candleData.time, value: pivotPoints[i] } : null;
          }
          return null;
        })
        .filter(point => point !== null);
    }

    if (lineData.length > 1) {
      const lineColor = doubleType === 'tops' ? 'rgba(255, 107, 157, 0.8)' : 'rgba(0, 217, 255, 0.8)';
      line = {
        data: lineData,
        options: {
          color: lineColor,
          lineWidth: 2, // Thicker line
          lineStyle: 0, // Solid line (0 = solid, 1 = dotted, 2 = dashed)
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        }
      };
    }

    // Main marker - should be at the LAST pivot point (index 4), not at candleIndex
    // The last pivot is where the pattern is confirmed
    let markerTime = null;
    
    if (pivotPointsData && pivotPointsData.length > 0) {
      // Use the last pivot point's time (index 4 - the 5th pivot)
      markerTime = pivotPointsData[pivotPointsData.length - 1].time;
    } else if (pivotIndices && pivotIndices.length > 0) {
      // Fallback to index-based
      const lastPivotIdx = pivotIndices[pivotIndices.length - 1];
      if (lastPivotIdx >= 0 && lastPivotIdx < originalDataRef.current.length) {
        markerTime = originalDataRef.current[lastPivotIdx].time;
      }
    }
    
    if (markerTime) {
      markers.push({
        time: markerTime,
        position: doubleType === 'tops' ? 'aboveBar' : 'belowBar',
        color: doubleType === 'tops' ? '#FF4560' : '#00E396',
        shape: doubleType === 'tops' ? 'arrowDown' : 'arrowUp',
        text: abbreviation,
        size: 1.5,
        patternName: patternName
      });
    }

    return { markers, line };
  };

  // Legacy function - kept for compatibility
  const processDoublePattern = (pattern, allMarkers, abbreviation) => {
    const result = collectDoublePatternData(pattern, abbreviation, 'double_pattern');
    allMarkers.push(...result.markers);
    if (result.line) {
      const patternLine = chartRef.current.addLineSeries(result.line.options);
      patternLine.setData(result.line.data);
      patternLinesRef.current.push(patternLine);
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

    // Don't add flag high markers - only draw trendline
    if (flagHighsIdx && flagHighs) {
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
          color: 'rgba(255, 167, 38, 0.5)',
          lineWidth: 1.5,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        upperLine.setData(upperLineData);
        patternLinesRef.current.push(upperLine);
        console.log('Added upper trendline'); // Debug log
      }
    }

    // Don't add flag low markers - only draw trendline
    if (flagLowsIdx && flagLows) {
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
          color: 'rgba(38, 198, 218, 0.5)',
          lineWidth: 1.5,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        lowerLine.setData(lowerLineData);
        patternLinesRef.current.push(lowerLine);
        console.log('Added lower trendline'); // Debug log
      }
    }

    // Main marker - prominent flag marker
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        const mainMarker = {
          time: mainCandle.time,
          position: direction === 'bullish' ? 'belowBar' : 'aboveBar',
          color: direction === 'bullish' ? '#00E396' : '#FF4560',
          shape: direction === 'bullish' ? 'arrowUp' : 'arrowDown',
          text: abbreviation,
          size: 1.5
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

    // Don't add key point markers - they clutter the chart
    // Just draw the neckline and main marker

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

    // Main marker - prominent
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        allMarkers.push({
          time: mainCandle.time,
          position: patternType === 'inverse' ? 'belowBar' : 'aboveBar',
          color: patternType === 'inverse' ? '#00E396' : '#FF4560',
          shape: patternType === 'inverse' ? 'arrowUp' : 'arrowDown',
          text: abbreviation,
          size: 1.5
        });
      }
    }
  };

  const processPennantPattern = (pattern, allMarkers, abbreviation) => {
    const { candleIndex, pennantHighsIdx, pennantLowsIdx, pennantHighs, pennantLows, direction } = pattern;

    // Don't add pennant high markers - only draw trendline
    if (pennantHighsIdx && pennantHighs) {
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
          color: 'rgba(255, 112, 67, 0.5)',
          lineWidth: 1.5,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        upperLine.setData(upperLineData);
        patternLinesRef.current.push(upperLine);
      }
    }

    // Don't add pennant low markers - only draw trendline
    if (pennantLowsIdx && pennantLows) {
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
          color: 'rgba(77, 208, 225, 0.5)',
          lineWidth: 1.5,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        lowerLine.setData(lowerLineData);
        patternLinesRef.current.push(lowerLine);
      }
    }

    // Main marker - prominent
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        allMarkers.push({
          time: mainCandle.time,
          position: direction === 'bullish' ? 'belowBar' : 'aboveBar',
          color: direction === 'bullish' ? '#00E396' : '#FF4560',
          shape: direction === 'bullish' ? 'arrowUp' : 'arrowDown',
          text: abbreviation,
          size: 1.5
        });
      }
    }
  };

  const processTrianglePattern = (pattern, allMarkers, abbreviation) => {
    const { 
      candleIndex, triangleType, upperTrendIndices, lowerTrendIndices,
      upperTrendValues, lowerTrendValues 
    } = pattern;

    // Color scheme based on triangle type - softer colors
    const colors = {
      'ascending': { upper: '#66BB6A', lower: '#66BB6A', main: '#4CAF50' },
      'descending': { upper: '#EF5350', lower: '#EF5350', main: '#F44336' },
      'symmetrical': { upper: '#FFCA28', lower: '#FFCA28', main: '#FFC107' }
    };
    const color = colors[triangleType] || colors['symmetrical'];

    // Don't add upper trend markers - only draw trendline
    if (upperTrendIndices && upperTrendValues) {
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
          color: color.upper + '60',
          lineWidth: 1.5,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        upperLine.setData(upperLineData);
        patternLinesRef.current.push(upperLine);
      }
    }

    // Don't add lower trend markers - only draw trendline
    if (lowerTrendIndices && lowerTrendValues) {
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
          color: color.lower + '60',
          lineWidth: 1.5,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        lowerLine.setData(lowerLineData);
        patternLinesRef.current.push(lowerLine);
      }
    }

    // Main marker - prominent
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        const triSentiment = triangleType === 'ascending' ? 'bullish' :
                           triangleType === 'descending' ? 'bearish' : 'neutral';
        allMarkers.push({
          time: mainCandle.time,
          position: triSentiment === 'bearish' ? 'aboveBar' : 'belowBar',
          color: triSentiment === 'bullish' ? '#00E396' :
                 triSentiment === 'bearish' ? '#FF4560' : '#AB47BC',
          shape: triSentiment === 'bearish' ? 'arrowDown' : triSentiment === 'bullish' ? 'arrowUp' : 'circle',
          text: abbreviation,
          size: 1.5
        });
      }
    }
  };

  const processGenericPattern = (pattern, allMarkers, patternName) => {
    const result = collectGenericPatternData(pattern, patternName);
    allMarkers.push(...result.markers);
  };

  // Collect generic pattern data
  const collectGenericPatternData = (pattern, patternName) => {
    const markers = [];
    if (pattern.candleIndex >= 0 && pattern.candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[pattern.candleIndex];
      if (mainCandle) {
        const sentiment = getPatternSentiment(patternName);
        markers.push({
          time: mainCandle.time,
          position: sentiment === 'bearish' ? 'aboveBar' : 'belowBar',
          color: sentiment === 'bullish' ? '#26a69a' : sentiment === 'bearish' ? '#ef5350' : '#9933FF',
          shape: sentiment === 'bearish' ? 'arrowDown' : sentiment === 'bullish' ? 'arrowUp' : 'circle',
          text: getPatternAbbreviation(patternName),
          size: 2,
          patternName: patternName
        });
      }
    }
    return { markers };
  };

  // Collect flag pattern data
  const collectFlagPatternData = (pattern, abbreviation, patternName) => {
    const { candleIndex, flagHighsIdx, flagLowsIdx, flagHighs, flagLows, direction } = pattern;
    const markers = [];
    const lines = [];

    // Don't add flag high markers - only show the trendline
    if (flagHighsIdx && flagHighs) {
      const upperLineData = flagHighsIdx
        .map((idx, i) => (idx >= 0 && idx < originalDataRef.current.length && flagHighs[i])
          ? { time: originalDataRef.current[idx].time, value: flagHighs[i] } : null)
        .filter(point => point !== null);

      if (upperLineData.length > 1) {
        lines.push({
          data: upperLineData,
          options: {
            color: 'rgba(255, 167, 38, 0.5)',
            lineWidth: 1.5,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          }
        });
      }
    }

    // Don't add flag low markers - only show the trendline
    if (flagLowsIdx && flagLows) {
      const lowerLineData = flagLowsIdx
        .map((idx, i) => (idx >= 0 && idx < originalDataRef.current.length && flagLows[i])
          ? { time: originalDataRef.current[idx].time, value: flagLows[i] } : null)
        .filter(point => point !== null);

      if (lowerLineData.length > 1) {
        lines.push({
          data: lowerLineData,
          options: {
            color: 'rgba(38, 198, 218, 0.5)',
            lineWidth: 1.5,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          }
        });
      }
    }

    // Main marker - prominent
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        markers.push({
          time: mainCandle.time,
          position: direction === 'bullish' ? 'belowBar' : 'aboveBar',
          color: direction === 'bullish' ? '#00E396' : '#FF4560',
          shape: direction === 'bullish' ? 'arrowUp' : 'arrowDown',
          text: abbreviation,
          size: 1.5,
          patternName: patternName
        });
      }
    }

    return { markers, lines };
  };

  // Collect Head and Shoulders data
  const collectHeadAndShouldersData = (pattern, abbreviation, patternName) => {
    const { 
      candleIndex, headIndex, leftShoulderIndex, rightShoulderIndex,
      headPrice, leftShoulderPrice, rightShoulderPrice, necklinePrice, patternType 
    } = pattern;
    const markers = [];
    let line = null;

    // Don't add key point markers - they clutter the chart
    // Just show the neckline and main marker

    // Prepare neckline
    if (necklinePrice && leftShoulderIndex >= 0 && rightShoulderIndex >= 0) {
      line = {
        data: [
          { time: originalDataRef.current[leftShoulderIndex].time, value: necklinePrice },
          { time: originalDataRef.current[rightShoulderIndex].time, value: necklinePrice }
        ],
        options: {
          color: 'rgba(255, 235, 59, 0.5)',
          lineWidth: 1.5,
          lineStyle: 2,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        }
      };
    }

    // Main marker - prominent
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        markers.push({
          time: mainCandle.time,
          position: patternType === 'inverse' ? 'belowBar' : 'aboveBar',
          color: patternType === 'inverse' ? '#00E396' : '#FF4560',
          shape: patternType === 'inverse' ? 'arrowUp' : 'arrowDown',
          text: abbreviation,
          size: 1.5,
          patternName: patternName
        });
      }
    }

    return { markers, line };
  };

  // Collect Pennant data
  const collectPennantData = (pattern, abbreviation, patternName) => {
    const { candleIndex, pennantHighsIdx, pennantLowsIdx, pennantHighs, pennantLows, direction } = pattern;
    const markers = [];
    const lines = [];

    // Don't add pennant high markers - only show the trendline
    if (pennantHighsIdx && pennantHighs) {
      const upperLineData = pennantHighsIdx
        .map((idx, i) => (idx >= 0 && idx < originalDataRef.current.length && pennantHighs[i])
          ? { time: originalDataRef.current[idx].time, value: pennantHighs[i] } : null)
        .filter(point => point !== null);

      if (upperLineData.length > 1) {
        lines.push({
          data: upperLineData,
          options: {
            color: 'rgba(255, 112, 67, 0.5)',
            lineWidth: 1.5,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          }
        });
      }
    }

    // Don't add pennant low markers - only show the trendline
    if (pennantLowsIdx && pennantLows) {
      const lowerLineData = pennantLowsIdx
        .map((idx, i) => (idx >= 0 && idx < originalDataRef.current.length && pennantLows[i])
          ? { time: originalDataRef.current[idx].time, value: pennantLows[i] } : null)
        .filter(point => point !== null);

      if (lowerLineData.length > 1) {
        lines.push({
          data: lowerLineData,
          options: {
            color: 'rgba(77, 208, 225, 0.5)',
            lineWidth: 1.5,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          }
        });
      }
    }

    // Main marker - prominent
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        markers.push({
          time: mainCandle.time,
          position: direction === 'bullish' ? 'belowBar' : 'aboveBar',
          color: direction === 'bullish' ? '#00E396' : '#FF4560',
          shape: direction === 'bullish' ? 'arrowUp' : 'arrowDown',
          text: abbreviation,
          size: 1.5,
          patternName: patternName
        });
      }
    }

    return { markers, lines };
  };

  // Collect Triangle data
  const collectTriangleData = (pattern, abbreviation, patternName) => {
    const { 
      candleIndex, triangleType, upperTrendIndices, lowerTrendIndices,
      upperTrendValues, lowerTrendValues 
    } = pattern;
    const markers = [];
    const lines = [];

    // Color scheme based on triangle type - softer colors
    const colors = {
      'ascending': { upper: '#66BB6A', lower: '#66BB6A', main: '#4CAF50' },
      'descending': { upper: '#EF5350', lower: '#EF5350', main: '#F44336' },
      'symmetrical': { upper: '#FFCA28', lower: '#FFCA28', main: '#FFC107' }
    };
    const color = colors[triangleType] || colors['symmetrical'];

    // Don't add upper trend markers - only show the trendline
    if (upperTrendIndices && upperTrendValues) {
      const upperLineData = upperTrendIndices
        .map((idx, i) => (idx >= 0 && idx < originalDataRef.current.length && upperTrendValues[i])
          ? { time: originalDataRef.current[idx].time, value: upperTrendValues[i] } : null)
        .filter(point => point !== null);

      if (upperLineData.length > 1) {
        lines.push({
          data: upperLineData,
          options: {
            color: color.upper + '60',
            lineWidth: 1.5,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          }
        });
      }
    }

    // Don't add lower trend markers - only show the trendline
    if (lowerTrendIndices && lowerTrendValues) {
      const lowerLineData = lowerTrendIndices
        .map((idx, i) => (idx >= 0 && idx < originalDataRef.current.length && lowerTrendValues[i])
          ? { time: originalDataRef.current[idx].time, value: lowerTrendValues[i] } : null)
        .filter(point => point !== null);

      if (lowerLineData.length > 1) {
        lines.push({
          data: lowerLineData,
          options: {
            color: color.lower + '60',
            lineWidth: 1.5,
            crosshairMarkerVisible: false,
            lastValueVisible: false,
            priceLineVisible: false,
          }
        });
      }
    }

    // Main marker - prominent
    if (candleIndex >= 0 && candleIndex < originalDataRef.current.length) {
      const mainCandle = originalDataRef.current[candleIndex];
      if (mainCandle) {
        const triSentiment = triangleType === 'ascending' ? 'bullish' :
                           triangleType === 'descending' ? 'bearish' : 'neutral';
        markers.push({
          time: mainCandle.time,
          position: triSentiment === 'bearish' ? 'aboveBar' : 'belowBar',
          color: triSentiment === 'bullish' ? '#00E396' :
                 triSentiment === 'bearish' ? '#FF4560' : '#AB47BC',
          shape: triSentiment === 'bearish' ? 'arrowDown' : triSentiment === 'bullish' ? 'arrowUp' : 'circle',
          text: abbreviation,
          size: 1.5,
          patternName: patternName
        });
      }
    }

    return { markers, lines };
  };

  // Store all pattern markers for tooltip lookup
  const allPatternMarkersRef = useRef([]);

  // Setup tooltip for multiple patterns
  const setupMultiPatternTooltips = (patternNames) => {
    if (!chartRef.current || !tooltipRef.current) return;

    chartRef.current.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.point) {
        hideTooltip();
        return;
      }

      // Find marker at this time from stored markers
      const hoveredMarker = allPatternMarkersRef.current.find(marker => marker.time === param.time);

      if (hoveredMarker && hoveredMarker.patternName) {
        // Get the marker position using chart's coordinate system
        const markerPrice = hoveredMarker.position === 'aboveBar' 
          ? param.seriesData.get(candleSeriesRef.current)?.high 
          : param.seriesData.get(candleSeriesRef.current)?.low;
        
        if (markerPrice) {
          const markerY = candleSeriesRef.current.priceToCoordinate(markerPrice);
          
          // Only show tooltip if mouse is near the marker (within 30px vertically)
          const verticalDistance = Math.abs(param.point.y - markerY);
          
          if (verticalDistance <= 30) {
            showTooltip(hoveredMarker.patternName, param.point.x, param.point.y);
            return;
          }
        }
      }
      
      hideTooltip();
    });
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
        // Get candle data at this time
        const candleData = param.seriesData.get(candleSeriesRef.current);
        if (candleData) {
          // Determine marker position based on pattern sentiment
          const isBullish = ['bullish_engulfing', 'hammer', 'inverted_hammer', 'morning_star', 
                            'piercing_line', 'three_white_soldiers', 'bullish_harami',
                            'tweezer_bottom', 'dragonfly_doji'].includes(patternName);
          const markerPrice = isBullish ? candleData.low : candleData.high;
          const markerY = candleSeriesRef.current.priceToCoordinate(markerPrice);
          
          // Only show tooltip if mouse is near the marker (within 30px vertically)
          const verticalDistance = Math.abs(param.point.y - markerY);
          
          if (verticalDistance <= 30) {
            showTooltip(patternName, param.point.x, param.point.y);
            return;
          }
        }
      }
      
      hideTooltip();
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

  // Reset patterns only (without touching indicators or candle data)
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

    // Clear markers only (don't touch candle data - it's already correct)
    candleSeriesRef.current.setMarkers([]);
  }, []);

  // Load indicators
  const loadIndicators = useCallback(async (indicatorsList) => {
    if (!isChartReady || !chartRef.current || !originalDataRef.current.length) {
      console.warn('Chart not ready or no data for indicators');
      return;
    }

    // Remove existing indicator series
    indicatorSeriesRef.current.forEach(series => {
      try {
        chartRef.current.removeSeries(series);
      } catch (e) {
        console.warn('Could not remove indicator series:', e);
      }
    });
    indicatorSeriesRef.current = [];

    if (!indicatorsList || indicatorsList.length === 0) {
      return;
    }

    console.log('Loading indicators:', indicatorsList);

    indicatorsList.forEach(indicatorValue => {
      const config = getIndicatorConfig(indicatorValue);
      if (!config) {
        console.warn(`No config found for indicator: ${indicatorValue}`);
        return;
      }

      try {
        switch (config.type) {
          case 'sma': {
            const smaData = calculateSMA(originalDataRef.current, config.period);
            if (smaData.length > 0) {
              const smaSeries = chartRef.current.addLineSeries({
                color: config.color,
                lineWidth: 2,
                title: `SMA(${config.period})`,
                lastValueVisible: true,
                priceLineVisible: false,
              });
              smaSeries.setData(smaData);
              indicatorSeriesRef.current.push(smaSeries);
              console.log(`Added SMA(${config.period}) with ${smaData.length} points`);
            }
            break;
          }

          case 'ema': {
            const emaData = calculateEMA(originalDataRef.current, config.period);
            if (emaData.length > 0) {
              const emaSeries = chartRef.current.addLineSeries({
                color: config.color,
                lineWidth: 2,
                title: `EMA(${config.period})`,
                lastValueVisible: true,
                priceLineVisible: false,
              });
              emaSeries.setData(emaData);
              indicatorSeriesRef.current.push(emaSeries);
              console.log(`Added EMA(${config.period}) with ${emaData.length} points`);
            }
            break;
          }

          case 'rsi': {
            const rsiData = calculateRSI(originalDataRef.current, config.period);
            if (rsiData.length > 0) {
              // RSI uses separate price scale (0-100 range)
              const rsiSeries = chartRef.current.addLineSeries({
                color: config.color,
                lineWidth: 2,
                title: `RSI(${config.period})`,
                lastValueVisible: true,
                priceLineVisible: false,
                priceScaleId: 'rsi', // Use separate price scale
              });
              
              // Configure RSI price scale (0-100)
              rsiSeries.priceScale().applyOptions({
                scaleMargins: {
                  top: 0.8, // Position RSI in bottom 20% of chart
                  bottom: 0,
                },
                borderVisible: false,
              });
              
              rsiSeries.setData(rsiData);
              indicatorSeriesRef.current.push(rsiSeries);
              console.log(`Added RSI(${config.period}) with ${rsiData.length} points on separate scale`);
            }
            break;
          }

          case 'macd': {
            const macdData = calculateMACD(
              originalDataRef.current,
              config.fastPeriod,
              config.slowPeriod,
              config.signalPeriod
            );
            if (macdData.macd.length > 0) {
              // MACD uses separate price scale
              const macdSeries = chartRef.current.addLineSeries({
                color: '#2196F3',
                lineWidth: 2,
                title: 'MACD',
                lastValueVisible: true,
                priceLineVisible: false,
                priceScaleId: 'macd', // Use separate price scale
              });
              
              // Configure MACD price scale
              macdSeries.priceScale().applyOptions({
                scaleMargins: {
                  top: 0.85, // Position MACD in bottom 15% of chart
                  bottom: 0,
                },
                borderVisible: false,
              });
              
              macdSeries.setData(macdData.macd);
              indicatorSeriesRef.current.push(macdSeries);

              const signalSeries = chartRef.current.addLineSeries({
                color: '#FF9800',
                lineWidth: 2,
                title: 'Signal',
                lastValueVisible: true,
                priceLineVisible: false,
                priceScaleId: 'macd', // Same scale as MACD
              });
              signalSeries.setData(macdData.signal);
              indicatorSeriesRef.current.push(signalSeries);

              console.log(`Added MACD with ${macdData.macd.length} points on separate scale`);
            }
            break;
          }

          case 'bollinger_bands': {
            const bbData = calculateBollingerBands(
              originalDataRef.current,
              config.period,
              config.stdDev
            );
            if (bbData.upper.length > 0) {
              // Upper band
              const upperSeries = chartRef.current.addLineSeries({
                color: config.colors.upper,
                lineWidth: 1,
                title: `BB Upper(${config.period})`,
                lastValueVisible: false,
                priceLineVisible: false,
              });
              upperSeries.setData(bbData.upper);
              indicatorSeriesRef.current.push(upperSeries);

              // Middle band
              const middleSeries = chartRef.current.addLineSeries({
                color: config.colors.middle,
                lineWidth: 2,
                title: `BB Middle(${config.period})`,
                lastValueVisible: true,
                priceLineVisible: false,
              });
              middleSeries.setData(bbData.middle);
              indicatorSeriesRef.current.push(middleSeries);

              // Lower band
              const lowerSeries = chartRef.current.addLineSeries({
                color: config.colors.lower,
                lineWidth: 1,
                title: `BB Lower(${config.period})`,
                lastValueVisible: false,
                priceLineVisible: false,
              });
              lowerSeries.setData(bbData.lower);
              indicatorSeriesRef.current.push(lowerSeries);

              console.log(`Added Bollinger Bands(${config.period}) with ${bbData.upper.length} points`);
            }
            break;
          }

          default:
            console.warn(`Unknown indicator type: ${config.type}`);
        }
      } catch (error) {
        console.error(`Error adding indicator ${indicatorValue}:`, error);
      }
    });

    console.log(`Total indicators loaded: ${indicatorSeriesRef.current.length} series`);
  }, [isChartReady]);

  // WebSocket connection and subscription
  useEffect(() => {
    if (!stockSymbol || !isChartReady) return;

    const connectWebSocket = () => {
      try {
        const client = new Client({
          webSocketFactory: () => new SockJS('http://localhost:60/ws'),
          debug: (str) => {
            console.log('STOMP Debug:', str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
          console.log('WebSocket connected for symbol:', stockSymbol);

          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
          }

          subscriptionRef.current = client.subscribe(
            `/topic/stock-updates/${stockSymbol}`,
            (message) => {
              try {
                const stockUpdate = JSON.parse(message.body);
                console.log('Received stock update:', stockUpdate);

                // Convert dateStr (yyyyMMdd) to yyyy-MM-dd format
                const newTime = stockUpdate.dateStr 
                  ? `${stockUpdate.dateStr.substring(0, 4)}-${stockUpdate.dateStr.substring(4, 6)}-${stockUpdate.dateStr.substring(6, 8)}`
                  : stockUpdate.timestamp; // Fallback to timestamp if dateStr not available
                
                const newCandle = {
                  time: newTime,
                  open: stockUpdate.open,
                  high: stockUpdate.high,
                  low: stockUpdate.low,
                  close: stockUpdate.close,
                };

                // Track if this is a new candle (new day)
                let isNewCandle = false;

                // Get the last candle
                const lastCandle = originalDataRef.current.length > 0 
                  ? originalDataRef.current[originalDataRef.current.length - 1]
                  : null;

                if (lastCandle) {
                  const lastTime = lastCandle.time;

                  console.log('Last candle time:', lastTime, 'New time:', newTime);

                  // Compare dates (both should be in yyyy-MM-dd format)
                  const lastDate = typeof lastTime === 'string' ? lastTime : lastTime;
                  const newDate = newTime;

                  if (lastDate === newDate) {
                    // Update existing candle (same day) - intraday update
                    const updatedCandle = {
                      ...lastCandle,
                      time: newTime, // Keep same date format yyyy-MM-dd
                      high: stockUpdate.high, // Accumulate high
                      low: stockUpdate.low, // Accumulate low
                      open: stockUpdate.open, // Keep original open
                      close: stockUpdate.close, // Update close
                      volume: stockUpdate.volume,
                    };
                    
                    originalDataRef.current[originalDataRef.current.length - 1] = updatedCandle;
                    
                    if (candleSeriesRef.current) {
                      candleSeriesRef.current.update({
                        time: updatedCandle.time,
                        open: updatedCandle.open,
                        high: updatedCandle.high,
                        low: updatedCandle.low,
                        close: updatedCandle.close,
                      });
                      console.log('Updated existing candle (same day):', updatedCandle);
                    }

                    // Update volume
                    volumeMapRef.current.set(updatedCandle.time, stockUpdate.volume);
                    if (volumeSeriesRef.current) {
                      volumeSeriesRef.current.update({
                        time: updatedCandle.time,
                        value: stockUpdate.volume,
                        color: updatedCandle.close >= updatedCandle.open ? '#26a69a' : '#ef5350',
                      });
                    }
                  } else if (newTime > lastTime) {
                    // New candle (different day)
                    isNewCandle = true; // Mark as new candle
                    const newCandleData = {
                      ...newCandle,
                      volume: stockUpdate.volume,
                    };
                    
                    originalDataRef.current.push(newCandleData);
                    
                    if (candleSeriesRef.current) {
                      candleSeriesRef.current.update(newCandle);
                      console.log('Added new candle (new day):', newCandleData);
                    }

                    // Update volume
                    volumeMapRef.current.set(newTime, stockUpdate.volume);
                    if (volumeSeriesRef.current) {
                      volumeSeriesRef.current.update({
                        time: newTime,
                        value: stockUpdate.volume,
                        color: newCandle.close >= newCandle.open ? '#26a69a' : '#ef5350',
                      });
                    }
                  } else {
                    console.warn('Received old data, ignoring. Last:', lastTime, 'New:', newTime);
                    return;
                  }
                } else {
                  // First candle
                  const newCandleData = {
                    ...newCandle,
                    volume: stockUpdate.volume,
                  };
                  
                  originalDataRef.current.push(newCandleData);
                  
                  if (candleSeriesRef.current) {
                    candleSeriesRef.current.update(newCandle);
                    console.log('Added first candle:', newCandleData);
                  }

                  volumeMapRef.current.set(newTime, stockUpdate.volume);
                  if (volumeSeriesRef.current) {
                    volumeSeriesRef.current.update({
                      time: newTime,
                      value: stockUpdate.volume,
                      color: newCandle.close >= newCandle.open ? '#26a69a' : '#ef5350',
                    });
                  }
                }

                // Always reload patterns to detect newly formed patterns
                // Indicators are NOT reloaded to prevent crosshair crash
                if (selectedPatterns && selectedPatterns.length > 0) {
                  loadPatternsData(selectedPatterns);
                  console.log('Reloaded patterns after candle update');
                }

                onStatusChange(`Cập nhật: ${stockSymbol} - ${newCandle.close}`);
              } catch (error) {
                console.error('Error processing stock update:', error);
              }
            }
          );
        };

        client.onStompError = (frame) => {
          console.error('STOMP error:', frame);
        };

        client.onWebSocketError = (error) => {
          console.error('WebSocket error:', error);
        };

        client.activate();
        stompClientRef.current = client;
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [stockSymbol, isChartReady, selectedIndicators, selectedPatterns, loadIndicators, loadPatternsData, onStatusChange]);

  // Handle stock symbol change
  useEffect(() => {
    if (isChartReady && stockSymbol) {
      loadStockData();
    }
  }, [stockSymbol, isChartReady, loadStockData]);

  // Handle selected patterns change
  useEffect(() => {
    if (!isChartReady || !originalDataRef.current.length) return;

    if (selectedPatterns && selectedPatterns.length > 0) {
      loadPatternsData(selectedPatterns);
    } else {
      // Clear patterns if none selected
      resetPatterns();
    }
  }, [selectedPatterns, isChartReady, loadPatternsData, resetPatterns, dataLoadCounter]);

  // Handle selected indicators change
  useEffect(() => {
    if (!isChartReady || !originalDataRef.current.length) {
      return;
    }

    if (selectedIndicators && selectedIndicators.length > 0) {
      loadIndicators(selectedIndicators);
    } else {
      // Clear indicators if none selected
      indicatorSeriesRef.current.forEach(series => {
        try {
          chartRef.current.removeSeries(series);
        } catch (e) {
          console.warn('Could not remove indicator series:', e);
        }
      });
      indicatorSeriesRef.current = [];
    }
  }, [selectedIndicators, isChartReady, loadIndicators, dataLoadCounter]);

  // Format number with comma separator
  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Format volume with K/M suffix
  const formatVolume = (vol) => {
    if (!vol) return '0';
    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
    if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
    return vol.toFixed(0);
  };

  // Format date
  // Helper function to convert dateStr (yyyyMMdd) to yyyy-MM-dd
  const convertDateStrToFormat = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && dateStr.length === 8) {
      return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }
    return dateStr; // Already in correct format
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="chart-wrapper">
      <div className="chart-container">
        {ohlcvInfo && (
          <div className="ohlcv-info">
            <span className="ohlcv-label">{stockSymbol}</span>
            <span className="ohlcv-time">{formatDate(ohlcvInfo.time)}</span>
            <span className="ohlcv-item">O <span className="ohlcv-value">{formatNumber(ohlcvInfo.open)}</span></span>
            <span className="ohlcv-item">H <span className="ohlcv-value">{formatNumber(ohlcvInfo.high)}</span></span>
            <span className="ohlcv-item">L <span className="ohlcv-value">{formatNumber(ohlcvInfo.low)}</span></span>
            <span className={`ohlcv-item ${ohlcvInfo.close >= ohlcvInfo.open ? 'up' : 'down'}`}>
              C <span className="ohlcv-value">{formatNumber(ohlcvInfo.close)}</span>
            </span>
            <span className="ohlcv-item">Vol <span className="ohlcv-value">{formatVolume(ohlcvInfo.volume)}</span></span>
          </div>
        )}
        <div ref={chartContainerRef} className="chart" />
      </div>
      <div className="volume-container">
        <div ref={volumeContainerRef} className="volume-chart" />
      </div>
    </div>
  );
};

export default StockChart;
