# opensource2026

# 용인시 단독·다가구 보증금 회수 안전도 분석 백엔드

대학생 원룸 세입자를 위한 보증금 회수 가능 여부 분석 서비스의 Spring Boot 백엔드입니다.

---

## 프로젝트 개요

월세 원룸과 단독·다가구 주택은 아파트처럼 시세를 확인하기 어렵고, 근저당이나 선순위 임차보증금이 있는 경우 경매 상황에서 보증금을 돌려받을 수 있는지 판단하기 어렵습니다.

이 백엔드는 사용자가 입력한 보증금, 근저당 설정액, 선순위 임차보증금, 건물 정보를 바탕으로 외부 AI 시세 예측 API와 연동해 예상 경매가를 계산하고, 보증금 회수 가능 금액과 위험 등급을 반환합니다. 또한 용인시 거래 데이터를 기반으로 지역별 요약, 연도별 추세, 지역 상세 분석 API를 제공합니다.

---

## 현재 구현 기능

- 보증금 안전도 분석 API 제공
- 외부 AI 시세 예측 API(`/predict`) 호출
- AI 예측 실패 시 기본 예상 경매가로 대체 계산
- 근저당 설정액, 선순위 임차보증금, 경매 비용 반영
- 소액임차인 및 최우선변제 기준 반영
- 회수 가능 금액, 회수율, 위험 등급 반환
- 용인시 거래 데이터 조회 및 통계 API 제공
- 애플리케이션 시작 시 `transactions.csv` 데이터 적재 로직 포함

---

## 안전도 분석 기준

현재 코드에 반영된 기준은 다음과 같습니다.

| 항목 | 값 |
|------|------|
| AI 예측 실패 시 기본 예상 경매가 | 650,000,000원 |
| 예상 경매가 산정 | AI 추정 시세 × 85% |
| 경매 비용 | 13,000,000원 |
| 소액임차인 보증금 기준 | 140,000,000원 이하 |
| 최우선변제금 기준 | 48,000,000원 이하 |
| 안전 | 회수율 90% 이상 |
| 주의 | 회수율 60% 이상 90% 미만 |
| 위험 | 회수율 60% 미만 |

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Language | Java 17 |
| Framework | Spring Boot |
| Build | Gradle |
| Database | MySQL |
| Data Access | JdbcTemplate, Repository |
| External AI API | `AI_API_URL` 기반 REST 호출 |
| Data Resource | CSV, JSON |

---

## API 명세

### 보증금 안전도 분석

```http
POST /api/analyze
```

요청 예시:

```json
{
  "address": "경기도 용인시 수지구 죽전동",
  "buildingType": "다가구",
  "area": "120.5",
  "landArea": "80.3",
  "buildingAge": "2018",
  "deposit": "50000000",
  "mortgage": "300000000",
  "priorTenants": "100000000"
}
```

응답 필드:

| 필드 | 설명 |
|------|------|
| `riskLevel` | 안전, 주의, 위험 |
| `recoveryRate` | 보증금 회수율 |
| `depositAmount` | 입력 보증금 |
| `recoverableAmount` | 예상 회수 가능 금액 |
| `expectedAuctionPrice` | 예상 경매가 |
| `mortgageAmount` | 근저당 설정액 |
| `priorTenantsAmount` | 선순위 임차보증금 |
| `auctionCost` | 경매 비용 |
| `smallTenantApplied` | 소액임차인 기준 적용 여부 |
| `priorityRepaymentApplied` | 최우선변제 기준 적용 여부 |
| `recoveryRuleMessage` | 적용된 회수 기준 설명 |

### 거래 데이터 API

```http
GET /api/trades
```

전체 거래 데이터를 조회합니다.

```http
GET /api/trades/summary
```

구별 거래 건수, 평균 보증금, 최소·최대 보증금을 조회합니다.

```http
GET /api/trades/trend
```

연도별 평균 보증금 추세를 조회합니다.

```http
GET /api/trades/regional-analysis
```

읍면동 단위 거래 통계, 면적대별 통계, 월별 추세를 조회합니다.

---

## 외부 AI 예측 API 연동

백엔드는 `AI_API_URL` 환경 변수에 설정된 서버로 시세 예측 요청을 보냅니다.

기본값:

```text
http://localhost:8000
```

호출 경로:

```http
POST /predict
```

AI API 응답은 다음 필드를 사용합니다.

| 필드 | 설명 |
|------|------|
| `predicted_price_manwon` | 예측 가격, 단위 만원 |
| `predicted_price_text` | 예측 가격 문자열 |

---

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `AI_API_URL` | `http://localhost:8000` | 외부 AI 시세 예측 API 주소 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | 허용할 프론트엔드 Origin |
| `DB_URL` | `jdbc:mysql://localhost:3306/yongin_trade_db?serverTimezone=Asia/Seoul&characterEncoding=UTF-8` | MySQL 연결 URL |
| `DB_USERNAME` | `root` | DB 사용자명 |
| `DB_PASSWORD` | `your_mysql_password` | DB 비밀번호 |

---

## 프로젝트 구조

현재 저장소 기준 구조입니다.

```text
opensource2026-backend
├── README.md
└── demo
    ├── build.gradle
    ├── Dockerfile
    ├── gradlew
    ├── gradlew.bat
    ├── settings.gradle
    ├── gradle
    │   └── wrapper
    └── src
        ├── main
        │   ├── java/com/example/demo
        │   │   ├── DemoApplication.java
        │   │   ├── CorsConfig.java
        │   │   ├── controller
        │   │   │   ├── AnalysisController.java
        │   │   │   └── TradeDataController.java
        │   │   ├── dto
        │   │   ├── entity
        │   │   ├── repository
        │   │   └── service
        │   │       ├── CsvImportService.java
        │   │       ├── PricePredictionClient.java
        │   │       └── TradeDataService.java
        │   └── resources
        │       ├── application.properties
        │       ├── transactions.csv
        │       └── data
        │           └── yongin_trade_sample.json
        └── test
            ├── java/com/example/demo
            └── resources
```

---

## 실행 방법

### 1. 백엔드 실행

Windows:

```powershell
cd demo
.\gradlew.bat bootRun
```

macOS/Linux:

```bash
cd demo
./gradlew bootRun
```

서버 기본 주소:

```text
http://localhost:8080
```

### 2. AI 예측 서버 연동

AI 예측 서버가 별도로 실행 중이어야 실제 예측 가격을 사용할 수 있습니다.

```text
AI_API_URL=http://localhost:8000
```

AI 예측 API 호출에 실패하면 백엔드는 기본 예상 경매가인 `650,000,000원`을 사용해 분석을 계속합니다.

---

## 데이터

현재 백엔드에는 다음 리소스 파일이 포함되어 있습니다.

| 파일 | 설명 |
|------|------|
| `demo/src/main/resources/transactions.csv` | 애플리케이션 시작 시 적재하는 거래 데이터 |
| `demo/src/main/resources/data/yongin_trade_sample.json` | 거래 데이터 샘플 JSON |

거래 통계 API는 MySQL의 `cheoin_data`, `giheung_data`, `suji_data` 테이블을 조회하도록 구현되어 있습니다.

---

## 팀원

이정우, 안시영, 김준환

---

## 참고

- [국토교통부 실거래가 공개시스템](https://rt.molit.go.kr)
- [국가법령정보센터](https://www.law.go.kr)
