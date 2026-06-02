package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PricePredictionResponse {

    @JsonProperty("predicted_price_manwon")
    private double predictedPriceManwon;

    @JsonProperty("predicted_price_krw")
    private long predictedPriceKrw;

    @JsonProperty("expected_auction_price_krw")
    private long expectedAuctionPriceKrw;

    @JsonProperty("liquidation_rate")
    private double liquidationRate;

    @JsonProperty("model_loaded")
    private boolean modelLoaded;

    public double getPredictedPriceManwon() {
        return predictedPriceManwon;
    }

    public void setPredictedPriceManwon(double predictedPriceManwon) {
        this.predictedPriceManwon = predictedPriceManwon;
    }

    public long getPredictedPriceKrw() {
        return predictedPriceKrw;
    }

    public void setPredictedPriceKrw(long predictedPriceKrw) {
        this.predictedPriceKrw = predictedPriceKrw;
    }

    public long getExpectedAuctionPriceKrw() {
        return expectedAuctionPriceKrw;
    }

    public void setExpectedAuctionPriceKrw(long expectedAuctionPriceKrw) {
        this.expectedAuctionPriceKrw = expectedAuctionPriceKrw;
    }

    public double getLiquidationRate() {
        return liquidationRate;
    }

    public void setLiquidationRate(double liquidationRate) {
        this.liquidationRate = liquidationRate;
    }

    public boolean isModelLoaded() {
        return modelLoaded;
    }

    public void setModelLoaded(boolean modelLoaded) {
        this.modelLoaded = modelLoaded;
    }
}
