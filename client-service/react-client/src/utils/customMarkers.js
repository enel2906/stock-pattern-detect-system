// Custom marker rendering for TradingView-style pattern labels

export const createPatternMarkerOverlay = (container, chart, candleSeries) => {
  const markerContainer = document.createElement('div');
  markerContainer.className = 'pattern-markers-overlay';
  markerContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  `;
  
  container.appendChild(markerContainer);
  
  return {
    container: markerContainer,
    
    updateMarkers: (markers) => {
      // Clear existing markers
      markerContainer.innerHTML = '';
      
      if (!markers || markers.length === 0) return;
      
      // Get time scale and price scale
      const timeScale = chart.timeScale();
      const priceScale = candleSeries.priceScale();
      
      markers.forEach(marker => {
        try {
          // Get coordinates for this marker
          const coordinate = timeScale.timeToCoordinate(marker.time);
          const price = marker.position === 'aboveBar' 
            ? marker.high || marker.value 
            : marker.low || marker.value;
          const yCoordinate = priceScale.priceToCoordinate(price);
          
          if (coordinate === null || yCoordinate === null) return;
          
          // Create marker element
          const markerEl = document.createElement('div');
          markerEl.className = `pattern-marker pattern-marker-${marker.position === 'aboveBar' ? 'above' : 'below'}`;
          markerEl.style.cssText = `
            position: absolute;
            left: ${coordinate}px;
            top: ${yCoordinate}px;
            transform: translate(-50%, ${marker.position === 'aboveBar' ? '-130%' : '30%'});
            background: ${marker.color};
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            pointer-events: auto;
            cursor: pointer;
          `;
          markerEl.textContent = marker.text;
          markerEl.dataset.patternName = marker.patternName;
          markerEl.dataset.time = marker.time;
          
          markerContainer.appendChild(markerEl);
        } catch (error) {
          console.warn('Error creating marker:', error);
        }
      });
    },
    
    clear: () => {
      markerContainer.innerHTML = '';
    },
    
    remove: () => {
      if (markerContainer.parentNode) {
        markerContainer.parentNode.removeChild(markerContainer);
      }
    }
  };
};
