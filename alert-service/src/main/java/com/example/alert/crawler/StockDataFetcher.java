package com.example.alert.crawler;

import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import yahoofinance.Stock;
import yahoofinance.YahooFinance;
import yahoofinance.histquotes.HistoricalQuote;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

public class StockDataFetcher {

    // MongoDB settings
    private static final String MONGO_URI = "mongodb://localhost:27017";
    private static final String DB_NAME = "candlestick_db";

    public static void fetchAndStoreStockData(String symbol, String startDate, String endDate) {
        try (var mongoClient = MongoClients.create(MONGO_URI)) {
            MongoDatabase database = mongoClient.getDatabase(DB_NAME);
            MongoCollection<Document> stocksCollection = database.getCollection("stocks");
            MongoCollection<Document> candlesticksCollection = database.getCollection("candlesticks");

            // Fetch stock metadata
            Stock stock = YahooFinance.get(symbol);
            if (stock == null) {
                System.err.println("Stock symbol not found: " + symbol);
                return;
            }

            // Check if the stock exists
            Document existingStock = stocksCollection.find(new Document("symbol", symbol)).first();
            if (existingStock == null) {
                // Insert stock metadata into the "stocks" collection
                Document stockDocument = new Document()
                        .append("symbol", symbol)
                        .append("name", stock.getName())
                        .append("market", "Unknown") // Customize if YahooFinance provides market
                        .append("created_at", new Timestamp(System.currentTimeMillis()));
                stocksCollection.insertOne(stockDocument);
            }

            // Fetch historical candlestick data
            List<HistoricalQuote> history = stock.getHistory();

            // Convert historical data to MongoDB documents
            List<Document> candlestickDocuments = history.stream()
                    .map(quote -> new Document()
                            .append("stock_symbol", symbol)
                            .append("timestamp", new Timestamp(quote.getDate().getTimeInMillis()))
                            .append("open_price", quote.getOpen() != null ? quote.getOpen().doubleValue() : null)
                            .append("high_price", quote.getHigh() != null ? quote.getHigh().doubleValue() : null)
                            .append("low_price", quote.getLow() != null ? quote.getLow().doubleValue() : null)
                            .append("close_price", quote.getClose() != null ? quote.getClose().doubleValue() : null)
                            .append("volume", quote.getVolume())
                            .append("created_at", new Timestamp(System.currentTimeMillis())))
                    .collect(Collectors.toList());

            // Insert candlestick data into the "candlesticks" collection
            if (!candlestickDocuments.isEmpty()) {
                candlesticksCollection.insertMany(candlestickDocuments);
            }

            System.out.println("Data for " + symbol + " has been successfully stored.");
        } catch (IOException e) {
            System.err.println("Error fetching stock data: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        fetchAndStoreStockData("AAPL", "2023-01-01", "2023-12-31");
    }
}

