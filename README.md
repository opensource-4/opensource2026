# 용인 전월세 보증금 회수 위험 분석 서비스

용인시 전월세 실거래 데이터와 AI 가격 예측 모델을 활용해 임차인의 보증금 회수 가능성을 분석하는 웹 서비스입니다.

프론트엔드는 React/Vite, 백엔드는 Spring Boot, AI 예측 API는 FastAPI로 구성되어 있습니다. 배포는 프론트엔드와 AI API를 Render, Spring Boot 백엔드를 Railway에서 운영하는 구성을 기준으로 합니다.

## 주요 기능

- 주소, 주택 유형, 면적, 보증금, 근저당, 선순위 임차인 정보를 입력해 보증금 회수 위험 분석
- AI 모델 예측 가격을 기반으로 예상 경매가 산정
- 소액임차인 및 최우선변제 기준을 반영한 회수 가능 금액 계산
- 용인시 구/동 단위 전월세 거래 통계, 연도별 추이, 면적대별 보증금 분석

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React 18, Vite, React Router, Recharts, Tailwind CSS |
| Backend | Java 17, Spring Boot, JDBC, MySQL |
| AI API | FastAPI, Uvicorn, scikit-learn, XGBoost, joblib |
| Model | XGBoost ensemble model |
| Deployment | Render, Railway |

## 프로젝트 구조

```text
.
├── frontend_react/        # React/Vite 프론트엔드
├── demo/                  # Spring Boot 백엔드 API
├── ai_api/                # FastAPI AI 예측 API
│   └── models/            # 배포용 joblib 모델
├── ai_training/           # 모델 학습 스크립트
├── app.py                 # Render 루트 배포용 FastAPI 엔트리
├── requirements.txt       # 루트 FastAPI 배포 의존성
└── README.md
```

## 서비스 흐름

```text
React Frontend
  └─ /api 요청
      └─ Spring Boot Backend
          ├─ MySQL 거래 데이터 조회
          └─ FastAPI AI API /predict 호출
              └─ joblib 모델로 주택 가격 예측
```

## 로컬 실행

### 1. AI API 실행

```bash
cd ai_api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

확인:

```bash
curl http://localhost:8000/health
```

### 2. Spring Boot 백엔드 실행

MySQL을 먼저 실행하고 `demo/src/main/resources/application.properties` 또는 환경변수로 DB 접속 정보를 설정합니다.

```bash
cd demo
.\gradlew.bat bootRun
```

기본 포트는 `8080`입니다.

필요 환경변수:

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `AI_API_URL` | `http://localhost:8000` | FastAPI 예측 API 주소 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | 프론트엔드 허용 Origin |
| `DB_URL` | `jdbc:mysql://localhost:3306/yongin_trade_db?serverTimezone=Asia/Seoul&characterEncoding=UTF-8` | MySQL JDBC URL |
| `DB_USERNAME` | `root` | DB 사용자 |
| `DB_PASSWORD` | `your_mysql_password` | DB 비밀번호 |

### 3. 프론트엔드 실행

```bash
cd frontend_react
npm install
npm run dev
```

기본 주소는 `http://localhost:5173`입니다.

프론트엔드 환경변수:

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Spring Boot API base URL |

## API

### Spring Boot Backend

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/api/analyze` | 보증금 회수 위험 분석 |
| `GET` | `/api/trades` | 거래 데이터 목록 조회 |
| `GET` | `/api/trades/summary` | 구 단위 거래 요약 |
| `GET` | `/api/trades/trend` | 연도별 평균 보증금 추이 |
| `GET` | `/api/trades/regional-analysis` | 동 단위 지역 분석 |

### FastAPI AI API

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/health` | 모델 로드 상태 확인 |
| `POST` | `/predict` | 주택 가격 예측 |
| `GET` | `/docs` | Swagger UI |

## 배포

### Render - Frontend

| 항목 | 값 |
| --- | --- |
| Root Directory | `frontend_react` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

환경변수:

```text
VITE_API_BASE_URL=https://<railway-backend-domain>/api
```

SPA 라우팅을 사용하는 경우 Render Rewrite 설정에서 모든 경로를 `/index.html`로 연결합니다.

### Render - AI API

`ai_api` 디렉터리 기준 배포:

| 항목 | 값 |
| --- | --- |
| Root Directory | `ai_api` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

루트 디렉터리 기준 배포를 사용할 경우:

| 항목 | 값 |
| --- | --- |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app:app --host 0.0.0.0 --port $PORT` |

모델 파일은 아래 경로에 포함되어 있어야 합니다.

```text
ai_api/models/xgb_price_unit_ensemble_model.joblib
```

### Railway - Spring Boot Backend

| 항목 | 값 |
| --- | --- |
| Root Directory | `demo` |
| Build Command | `./gradlew bootJar` |
| Start Command | `java -jar build/libs/demo-0.0.1-SNAPSHOT.jar` |

Railway 환경변수:

```text
AI_API_URL=https://<render-ai-api-domain>
CORS_ALLOWED_ORIGINS=https://<render-frontend-domain>
DB_URL=jdbc:mysql://<host>:<port>/<database>?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_USERNAME=<username>
DB_PASSWORD=<password>
```

Railway에서 MySQL 플러그인 또는 외부 MySQL을 사용하는 경우 해당 연결 정보를 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`에 맞춰 설정합니다.

## 모델 학습 및 교체

학습 코드는 `ai_training/train_model.py`에 유지되어 있으며, 배포 시에는 모델을 재학습하지 않고 저장된 joblib 파일만 로드합니다.

새 모델을 배포하려면 학습 결과물 중 `.joblib` 파일을 아래 위치로 교체한 뒤 AI API를 재배포합니다.

```text
ai_api/models/xgb_price_unit_ensemble_model.joblib
```

## 주의사항

- 현재 배포 구조는 프론트엔드, Spring Boot 백엔드, AI API가 서로 다른 서비스로 동작하는 것을 전제로 합니다.
- 프론트엔드의 `VITE_API_BASE_URL`, 백엔드의 `AI_API_URL`, `CORS_ALLOWED_ORIGINS` 값이 실제 배포 도메인과 일치해야 합니다.
- MySQL 테이블과 컬럼명은 백엔드 조회 SQL과 일치해야 합니다.
