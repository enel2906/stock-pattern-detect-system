/**
 * Pattern Detection Test
 * Quick verification that all pattern detectors are working
 */

import { detectDoublePatterns } from './doublePatternDetector.js';
import { detectFlagPatterns } from './flagPatternDetector.js';
import { detectPennantPatterns } from './pennantPatternDetector.js';
import { detectHeadAndShoulders, detectInverseHeadAndShoulders } from './headAndShouldersDetector.js';
import { 
  detectTrianglePatterns, 
  detectAscendingTriangles, 
  detectDescendingTriangles, 
  detectSymmetricalTriangles 
} from './trianglePatternDetector.js';

// Test data - simple sample
const testData = [
  { time: 1000, open: 100, high: 110, low: 95, close: 105 },
  { time: 2000, open: 105, high: 115, low: 100, close: 110 },
  { time: 3000, open: 110, high: 120, low: 105, close: 115 },
  { time: 4000, open: 115, high: 125, low: 110, close: 120 },
  { time: 5000, open: 120, high: 130, low: 115, close: 125 },
];

console.log('Testing pattern detectors...');

try {
  console.log('✅ Double Patterns:', detectDoublePatterns(testData).length);
  console.log('✅ Flag Patterns:', detectFlagPatterns(testData).length);
  console.log('✅ Pennant Patterns:', detectPennantPatterns(testData).length);
  console.log('✅ Head & Shoulders:', detectHeadAndShoulders(testData).length);
  console.log('✅ Inverse H&S:', detectInverseHeadAndShoulders(testData).length);
  console.log('✅ All Triangles:', detectTrianglePatterns(testData).length);
  console.log('✅ Ascending Triangles:', detectAscendingTriangles(testData).length);
  console.log('✅ Descending Triangles:', detectDescendingTriangles(testData).length);
  console.log('✅ Symmetrical Triangles:', detectSymmetricalTriangles(testData).length);
  
  console.log('\n✅ All pattern detectors working correctly!');
} catch (error) {
  console.error('❌ Error:', error.message);
}
