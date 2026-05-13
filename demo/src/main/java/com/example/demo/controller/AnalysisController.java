package com.example.demo.controller;

import com.example.demo.dto.AnalysisRequest;
import com.example.demo.dto.AnalysisResult;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class AnalysisController {

    @PostMapping("/analyze")
    public AnalysisResult analyze(@RequestBody AnalysisRequest request) {

        System.out.println("주소: " + request.getAddress());
        System.out.println("건물유형: " + request.getBuildingType());
        System.out.println("전용면적: " + request.getArea());
        System.out.println("보증금: " + request.getDeposit());
        System.out.println("근저당: " + request.getMortgage());
        System.out.println("선순위 세입자: " + request.getPriorTenants());
        System.out.println("건축년도: " + request.getBuildingAge());

        long deposit = Long.parseLong(request.getDeposit().replace(",", ""));
        long mortgage = Long.parseLong(request.getMortgage().replace(",", ""));

        long priorTenants = 0;

        if (request.getPriorTenants() != null && !request.getPriorTenants().isEmpty()) {
            priorTenants = Long.parseLong(request.getPriorTenants().replace(",", ""));
        }

        long expectedAuctionPrice = 650000000;
        long auctionCost = 13000000;

        long recoverableAmount = expectedAuctionPrice - mortgage - priorTenants - auctionCost;

        int recoveryRate = (int) (recoverableAmount * 100 / deposit);

        String riskLevel = "주의";

        if (recoveryRate >= 90) {
            riskLevel = "안전";
        }

        if (recoveryRate < 60) {
            riskLevel = "위험";
        }

        return new AnalysisResult(
                riskLevel,
                recoveryRate,
                deposit,
                recoverableAmount,
                expectedAuctionPrice,
                mortgage,
                priorTenants,
                auctionCost
        );
    }
}