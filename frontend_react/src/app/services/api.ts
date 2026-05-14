// 백엔드 API 주소 설정
const API_BASE_URL = 'http://localhost:8080/api';

// 분석 요청 데이터 타입
export interface AnalysisRequest {
  address: string;           // 주소
  buildingType: string;      // 건물 유형 (단독/다가구)
  area: string;              // 전용면적
  landArea: string;          // 대지면적
  deposit: string;           // 전세 보증금
  mortgage: string;          // 근저당 설정액
  priorTenants: string;      // 선순위 세입자 보증금
  buildingAge: string;       // 건축년도
}

// 분석 결과 데이터 타입
export interface AnalysisResult {
  riskLevel: string;              // 위험도 (안전/주의/위험)
  recoveryRate: number;           // 회수 가능 비율 (%)
  depositAmount: number;          // 보증금
  recoverableAmount: number;      // 회수 가능 금액
  expectedAuctionPrice: number;   // 예상 경매가
  mortgageAmount: number;         // 근저당액
  priorTenantsAmount: number;     // 선순위 보증금
  auctionCost: number;            // 경매 비용
}

// 지역 데이터 타입
export interface RegionData {
  region: string;        // 지역명
  avgPrice: number;      // 평균 전세가
  change: number;        // 변동률
  riskScore: number;     // 안전도 점수
  transactions: number;  // 거래량
}

/**
 * 전세 보증금 위험도 분석 API 호출
 * @param data 분석 요청 데이터
 * @returns 분석 결과
 */
export async function analyzeRisk(data: AnalysisRequest): Promise<AnalysisResult> {
  try {
    // Spring Boot 백엔드로 POST 요청
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data), // 폼 데이터를 JSON으로 변환
    });

    // 응답 실패 처리
    if (!response.ok) {
      throw new Error('분석 요청에 실패했습니다.');
    }

    // JSON 응답 받기
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API 호출 오류:', error);
    throw error;
  }
}

/**
 * 지역별 거래 데이터 조회 API 호출
 * @returns 지역 데이터 목록
 */
export async function getRegionData(): Promise<RegionData[]> {
  try {
    // Spring Boot 백엔드로 GET 요청
    const response = await fetch(`${API_BASE_URL}/regions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 응답 실패 처리
    if (!response.ok) {
      throw new Error('지역 데이터 조회에 실패했습니다.');
    }

    // JSON 응답 받기
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API 호출 오류:', error);
    throw error;
  }
}