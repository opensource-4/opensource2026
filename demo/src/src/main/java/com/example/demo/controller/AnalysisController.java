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

        // 현재는 AI 모델 연동 전 단계이므로 임시 고정값 사용
        long expectedAuctionPrice = 650_000_000L;

        // 경매 비용
        long auctionCost = 13_000_000L;

        // 최우선변제 기준
        long smallDepositLimit = 140_000_000L; // 1억 4000만
        long priorityRepayment = 48_000_000L;  // 4800만

        // 경매 후 남은 금액
        long remainingAfterAuction =
                expectedAuctionPrice
                        - mortgage
                        - priorTenants
                        - auctionCost;

        long recoverableAmount;

        if (deposit >= smallDepositLimit) {

            // 보증금 1억 4000만 이상
            recoverableAmount = remainingAfterAuction;

        } else {

            // 보증금 1억 4000만 미만 → 최우선변제 적용

            if (deposit <= priorityRepayment) {

                // 보증금이 4800만 이하이면 전액 보호
                recoverableAmount = deposit;

            } else {

                // 4800만 초과분
                long excessDeposit = deposit - priorityRepayment;

                // 초과 보증금 중 실제 회수 가능한 금액
                long excessRecoverable =
                        Math.min(remainingAfterAuction, excessDeposit);

                // 최우선변제금 + 추가 회수 가능 금액
                recoverableAmount =
                        priorityRepayment + excessRecoverable;
            }
        }

        // 회수 가능 금액 보정
        recoverableAmount = Math.min(recoverableAmount, deposit);
        recoverableAmount = Math.max(recoverableAmount, 0);

        // 회수율 계산
        int recoveryRate =
                (int) (recoverableAmount * 100L / deposit);

        // 위험도 분류
        String riskLevel;

        if (recoveryRate >= 90) {
            riskLevel = "안전";
        } else if (recoveryRate >= 60) {
            riskLevel = "주의";
        } else {
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
