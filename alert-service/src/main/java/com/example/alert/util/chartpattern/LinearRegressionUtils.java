package com.example.alert.util.chartpattern;

import java.util.List;

/**
 * Utility class để tính linear regression
 * Tương đương với scipy.stats.linregress trong Python
 */
public class LinearRegressionUtils {
    
    public static class RegressionResult {
        private double slope;
        private double intercept;
        private double rValue;
        private double pValue;
        private double stdErr;
        
        public RegressionResult(double slope, double intercept, double rValue, 
                              double pValue, double stdErr) {
            this.slope = slope;
            this.intercept = intercept;
            this.rValue = rValue;
            this.pValue = pValue;
            this.stdErr = stdErr;
        }
        
        // Getters
        public double getSlope() { return slope; }
        public double getIntercept() { return intercept; }
        public double getRValue() { return rValue; }
        public double getPValue() { return pValue; }
        public double getStdErr() { return stdErr; }
    }
    
    /**
     * Tính linear regression cho hai mảng x và y
     * @param x mảng giá trị x (thường là indices)
     * @param y mảng giá trị y (thường là giá)
     * @return RegressionResult chứa slope, intercept, r-value, etc.
     * @throws IllegalArgumentException nếu x và y không cùng size hoặc có ít hơn 2 phần tử
     */
    public static RegressionResult linregress(List<Integer> x, List<Double> y) {
        if (x == null || y == null) {
            throw new IllegalArgumentException("Input arrays cannot be null");
        }
        if (x.size() != y.size()) {
            throw new IllegalArgumentException("Input arrays must have the same size. x.size=" + x.size() + ", y.size=" + y.size());
        }
        if (x.size() < 2) {
            throw new IllegalArgumentException("Input arrays must have at least 2 elements. Size=" + x.size());
        }
        
        int n = x.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        
        for (int i = 0; i < n; i++) {
            double xi = x.get(i);
            double yi = y.get(i);
            sumX += xi;
            sumY += yi;
            sumXY += xi * yi;
            sumX2 += xi * xi;
            sumY2 += yi * yi;
        }
        
        // Tính slope
        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        
        // Tính intercept
        double intercept = (sumY - slope * sumX) / n;
        
        // Tính correlation coefficient (r-value)
        double numerator = n * sumXY - sumX * sumY;
        double denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        double rValue = (denominator == 0) ? 0 : numerator / denominator;
        
        // Tính standard error (simplified version)
        double ss_res = 0;
        for (int i = 0; i < n; i++) {
            double predicted = slope * x.get(i) + intercept;
            double actual = y.get(i);
            ss_res += Math.pow(actual - predicted, 2);
        }
        
        double stdErr = Math.sqrt(ss_res / (n - 2));
        double pValue = 0; // Simplified, không tính p-value chi tiết
        
        return new RegressionResult(slope, intercept, rValue, pValue, stdErr);
    }
    
    /**
     * Overload method với arrays của double cho x
     */
    public static RegressionResult linregress(double[] x, double[] y) {
        if (x.length != y.length || x.length < 2) {
            throw new IllegalArgumentException("Arrays must have the same size and at least 2 elements");
        }
        
        int n = x.length;
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        
        for (int i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }
        
        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        double intercept = (sumY - slope * sumX) / n;
        
        double numerator = n * sumXY - sumX * sumY;
        double denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        double rValue = (denominator == 0) ? 0 : numerator / denominator;
        
        double ss_res = 0;
        for (int i = 0; i < n; i++) {
            double predicted = slope * x[i] + intercept;
            double actual = y[i];
            ss_res += Math.pow(actual - predicted, 2);
        }
        
        double stdErr = Math.sqrt(ss_res / (n - 2));
        double pValue = 0;
        
        return new RegressionResult(slope, intercept, rValue, pValue, stdErr);
    }
}