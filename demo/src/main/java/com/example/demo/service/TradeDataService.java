package com.example.demo.service;

import com.example.demo.dto.PriceTrendPoint;
import com.example.demo.dto.RegionSummary;
import com.example.demo.dto.TradeData;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TradeDataService {

    private final JdbcTemplate jdbcTemplate;

    public TradeDataService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TradeData> getAllTrades() {
        String sql = """
                SELECT '처인구' AS gu,
                       `시군구`,
                       `주택유형`,
                       `계약년월`,
                       `보증금(만원)`,
                       `계약면적(㎡)`
                FROM cheoin_data

                UNION ALL

                SELECT '기흥구' AS gu,
                       `시군구`,
                       `주택유형`,
                       `계약년월`,
                       `보증금(만원)`,
                       `계약면적(㎡)`
                FROM giheung_data

                UNION ALL

                SELECT '수지구' AS gu,
                       `시군구`,
                       `주택유형`,
                       `계약년월`,
                       `보증금(만원)`,
                       `계약면적(㎡)`
                FROM suji_data
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            TradeData tradeData = new TradeData();

            String address = rs.getString("시군구");
            String dealYearMonth = rs.getString("계약년월");
            String deposit = rs.getString("보증금(만원)");
            String area = rs.getString("계약면적(㎡)");

            tradeData.setGu(rs.getString("gu"));
            tradeData.setDong(getDongFromAddress(address));
            tradeData.setHouseType(rs.getString("주택유형"));
            tradeData.setDealYear(getYearFromDealYearMonth(dealYearMonth));
            tradeData.setPrice(getMoneyToLong(deposit));
            tradeData.setTotalArea(getAreaToDouble(area));
            tradeData.setLandArea(0.0);

            return tradeData;
        });
    }

    public List<RegionSummary> getRegionSummary() {
        List<TradeData> trades = getAllTrades();
        List<RegionSummary> result = new ArrayList<>();

        result.add(makeSummary("수지구", trades));
        result.add(makeSummary("기흥구", trades));
        result.add(makeSummary("처인구", trades));

        return result;
    }

    public List<PriceTrendPoint> getYearlyTrend() {
        List<TradeData> trades = getAllTrades();

        Map<Integer, List<TradeData>> groupedByYear = trades.stream()
                .collect(Collectors.groupingBy(
                        TradeData::getDealYear,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return groupedByYear.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<TradeData> yearlyTrades = entry.getValue();

                    long totalPrice = 0;
                    long count = yearlyTrades.size();

                    for (TradeData trade : yearlyTrades) {
                        totalPrice += trade.getPrice();
                    }

                    long averagePrice = 0;

                    if (count > 0) {
                        averagePrice = totalPrice / count;
                    }

                    return new PriceTrendPoint(
                            String.valueOf(entry.getKey()),
                            averagePrice,
                            count
                    );
                })
                .collect(Collectors.toList());
    }

    private RegionSummary makeSummary(String gu, List<TradeData> trades) {
        int count = 0;
        long totalPrice = 0;
        long minPrice = 0;
        long maxPrice = 0;

        for (TradeData trade : trades) {
            if (trade.getGu().equals(gu)) {
                count++;
                totalPrice += trade.getPrice();

                if (minPrice == 0 || trade.getPrice() < minPrice) {
                    minPrice = trade.getPrice();
                }

                if (trade.getPrice() > maxPrice) {
                    maxPrice = trade.getPrice();
                }
            }
        }

        long averagePrice = 0;

        if (count > 0) {
            averagePrice = totalPrice / count;
        }

        return new RegionSummary(
                gu,
                count,
                averagePrice,
                minPrice,
                maxPrice
        );
    }

    private String getDongFromAddress(String address) {
        if (address == null || address.isBlank()) {
            return "";
        }

        String[] addressParts = address.split(" ");

        return addressParts[addressParts.length - 1];
    }

    private int getYearFromDealYearMonth(String dealYearMonth) {
        if (dealYearMonth == null || dealYearMonth.length() < 4) {
            return 0;
        }

        String year = dealYearMonth.substring(0, 4);

        return Integer.parseInt(year);
    }

    private long getMoneyToLong(String money) {
        if (money == null || money.isBlank()) {
            return 0L;
        }

        String cleanMoney = money.replace(",", "").trim();

        return Long.parseLong(cleanMoney);
    }

    private double getAreaToDouble(String area) {
        if (area == null || area.isBlank()) {
            return 0.0;
        }

        return Double.parseDouble(area.trim());
    }
}