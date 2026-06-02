package com.example.demo.service;

import com.example.demo.dto.RegionSummary;
import com.example.demo.dto.PriceTrendPoint;
import com.example.demo.dto.TradeData;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TradeDataService {

    public List<TradeData> getAllTrades() {
        try {
            ObjectMapper objectMapper = new ObjectMapper();

            ClassPathResource resource =
                    new ClassPathResource("data/yongin_trade_sample.json");

            InputStream inputStream = resource.getInputStream();

            return objectMapper.readValue(
                    inputStream,
                    new TypeReference<List<TradeData>>() {}
            );

        } catch (Exception e) {
            throw new RuntimeException("거래 데이터 파일을 읽을 수 없습니다.");
        }
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
                    long totalPrice = yearlyTrades.stream().mapToLong(TradeData::getPrice).sum();
                    long count = yearlyTrades.size();
                    long averagePrice = count > 0 ? totalPrice / count : 0L;

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
}
