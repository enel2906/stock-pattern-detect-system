import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <div className="about-header">
        <div className="brand-logo">
          <div className="logo-icon">📡</div>
          <h1 className="brand-name">SignalScope</h1>
        </div>
        <p className="tagline">Intelligent Stock Pattern Detection & Technical Analysis Platform</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>🎯 About Us</h2>
          <p>
            SignalScope is an advanced stock market analysis platform that leverages cutting-edge pattern recognition 
            algorithms and real-time data processing to help traders and investors make informed decisions in the 
            Vietnamese stock market.
          </p>
        </section>

        <section className="about-section">
          <h2>🔍 Problem We Solve</h2>
          <p>
            In the fast-paced world of stock trading, identifying profitable patterns and trends can be overwhelming. 
            Traditional manual chart analysis is time-consuming and prone to human error. Traders often miss critical 
            signals that could lead to profitable opportunities.
          </p>
          <p>
            <strong>SignalScope addresses these challenges by:</strong>
          </p>
          <ul>
            <li>Automating the detection of complex candlestick patterns and chart formations</li>
            <li>Providing real-time market data and price monitoring across multiple stocks</li>
            <li>Eliminating emotional bias through algorithmic pattern recognition</li>
            <li>Offering instant alerts for identified trading opportunities</li>
            <li>Reducing analysis time from hours to seconds</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>✨ Key Features</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Real-Time Chart Analysis</h3>
              <p>Interactive candlestick charts powered by LightweightCharts with advanced technical indicators including Moving Averages, RSI, MACD, Bollinger Bands, and more.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔮</div>
              <h3>Pattern Detection Engine</h3>
              <p>Automatic identification of 20+ candlestick and chart patterns including:</p>
              <ul>
                <li><strong>Single Candle Patterns:</strong> Hammer, Hanging Man, Doji, Shooting Star, Inverted Hammer</li>
                <li><strong>Multi-Candle Patterns:</strong> Engulfing, Harami, Morning/Evening Star, Three White Soldiers, Three Black Crows</li>
                <li><strong>Chart Patterns:</strong> Head & Shoulders, Double Top/Bottom, Triangle Patterns, Flag & Pennant, Cup with Handle</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Live Watchlist</h3>
              <p>Monitor 60 stocks simultaneously with real-time price updates every 30 seconds. Track bid/ask prices, volume, price changes, and key metrics in a comprehensive dashboard.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-Time Alerts</h3>
              <p>Instant notifications via RabbitMQ message queue when patterns are detected, ensuring you never miss a trading opportunity.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Customizable Interface</h3>
              <p>Toggle between dark and light themes, select specific patterns to monitor, and customize technical indicators based on your trading strategy.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Authentication</h3>
              <p>OAuth 2.0 integration with Google for secure user authentication and personalized settings management.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>� Market Coverage</h2>
          <div className="market-coverage">
            <div className="market-item">
              <h4>🇻🇳 HOSE</h4>
              <p>40 blue-chip stocks from Ho Chi Minh Stock Exchange</p>
              <span className="stock-count">Banking, Real Estate, Securities, Retail & Industrial</span>
            </div>
            <div className="market-item">
              <h4>🇻🇳 HNX</h4>
              <p>10 major stocks from Hanoi Stock Exchange</p>
              <span className="stock-count">Energy, Construction, Investment & Services</span>
            </div>
            <div className="market-item">
              <h4>🇻🇳 UPCOM</h4>
              <p>10 stocks from Unlisted Public Company Market</p>
              <span className="stock-count">Oil & Gas, Technology, Transportation & Consumer</span>
            </div>
            <div className="market-item">
              <h4>🌍 International</h4>
              <p>6 major US tech stocks</p>
              <span className="stock-count">AMZN, TSLA, MSFT, AAPL, GOOG, NVDA</span>
            </div>
          </div>
        </section>

        <section className="about-section cta-section">
          <h2>🚀 Get Started</h2>
          <p>Experience the power of automated pattern detection and make smarter trading decisions today!</p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={() => navigate('/')}>
              📈 View Charts
            </button>
            <button className="cta-secondary" onClick={() => navigate('/watchlist')}>
              📊 Open Watchlist
            </button>
          </div>
        </section>

        <footer className="about-footer">
          <p>© 2025 SignalScope. All rights reserved.</p>
          <p className="disclaimer">
            Disclaimer: This platform is for educational and informational purposes only. 
            Always conduct your own research before making investment decisions.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AboutPage;
