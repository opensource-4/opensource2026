package com.example.demo.dto;

public class AnalysisResult {

    private String riskLevel;
    private int recoveryRate;
    private long depositAmount;
    private long recoverableAmount;
    private long expectedAuctionPrice;
    private long mortgageAmount;
    private long priorTenantsAmount;
    private long auctionCost;

    public AnalysisResult(String riskLevel, int recoveryRate, long depositAmount,
                          long recoverableAmount, long expectedAuctionPrice,
                          long mortgageAmount, long priorTenantsAmount, long auctionCost) {

        this.riskLevel = riskLevel;
        this.recoveryRate = recoveryRate;
        this.depositAmount = depositAmount;
        this.recoverableAmount = recoverableAmount;
        this.expectedAuctionPrice = expectedAuctionPrice;
        this.mortgageAmount = mortgageAmount;
        this.priorTenantsAmount = priorTenantsAmount;
        this.auctionCost = auctionCost;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public int getRecoveryRate() {
        return recoveryRate;
    }

    public long getDepositAmount() {
        return depositAmount;
    }

    public long getRecoverableAmount() {
        return recoverableAmount;
    }

    public long getExpectedAuctionPrice() {
        return expectedAuctionPrice;
    }

    public long getMortgageAmount() {
        return mortgageAmount;
    }

    public long getPriorTenantsAmount() {
        return priorTenantsAmount;
    }

    public long getAuctionCost() {
        return auctionCost;
    }
}