# Experiment Log

## Pre-merge Modeling History

이 섹션은 현재 통합 브랜치에서 진행한 실험 이전에 수행된 모델링 기록이다. 기존 실험 번호를 보존한다.

### 1차 - 기본 XGBoost 적용

- 변경 내용:
  - RandomForest에서 XGBoost로 변경
  - TimeSeriesSplit 유지
  - `dong_avg_price` target encoding 사용
  - 기본 feature engineering 적용

- 최적 파라미터:

```python
{
    "n_estimators": 500,
    "max_depth": 5,
    "learning_rate": 0.03,
    "subsample": 0.9,
    "colsample_bytree": 0.9,
    "reg_lambda": 2.0,
}
```

- 결과:
  - R2: 0.7300
  - MAE: 17,592 만원
  - RMSE: 25,552 만원
  - MAPE: 27.64%

### 2차 - Log Target 적용

- 변경 내용:
  - `price` 대신 `log1p(price)`를 학습
  - 예측 후 `expm1()`로 원 가격 복원

- 목적:
  - 큰 가격 이상치 영향 감소
  - MAPE 안정화

- 결과:
  - R2: 0.7273
  - MAE: 17,490 만원
  - RMSE: 25,682 만원
  - MAPE: 25.36%

- 분석:
  - MAE/MAPE는 개선
  - R2는 하락

### 3차 - Raw + Log Ensemble

- 변경 내용:
  - 원가격 모델과 로그가격 모델 앙상블
  - alpha weight 탐색

- 최적 alpha:

```python
0.5
```

- 결과:
  - R2: 0.7381
  - MAE: 17,248 만원
  - RMSE: 25,169 만원
  - MAPE: 26.15%

- 분석:
  - Raw 모델의 R2 장점과 Log 모델의 안정성을 결합해 성능이 향상됐다.

### 4차 - Multi Target Encoding 추가

- 변경 내용:
  - target encoding 확장
  - 추가 컬럼:
    - `gu`
    - `dong`
    - `house_type`
    - `gu_house_type`
    - `dong_house_type`
    - `dong_road`

- 추가 feature:

```python
land_to_total_ratio
total_to_land_ratio
```

- 결과:
  - R2: 0.7416
  - MAE: 17,193 만원
  - RMSE: 24,998 만원
  - MAPE: 25.99%

- 분석:
  - 위치와 주택유형 조합 효과를 확인했다.
  - 당시 기준 최고 성능을 갱신했다.

### 5차 - Smoothing Search

- 변경 내용:
  - target encoding smoothing 탐색

```python
[5, 10, 20, 50]
```

- 최적 CV:

```python
smoothing = 5
alpha = 0.6
```

- 결과:
  - R2: 0.7347
  - MAE: 17,413 만원
  - RMSE: 25,333 만원

- 분석:
  - CV는 좋아졌지만 실제 test 성능은 하락했다.
  - overfitting 가능성이 있다.

- 결론:
  - `smoothing=20` 고정 버전이 더 안정적이다.

### 6차 - Price Per Area Ensemble 추가

- 변경 내용:
  - `price_per_total_area` 모델 추가
  - 최종 앙상블:
    - raw price model
    - log price model
    - unit price model

- 최적 weight:

```python
(0.4, 0.4, 0.2)
```

- 결과:
  - R2: 0.7532
  - MAE: 16,808 만원
  - RMSE: 24,431 만원
  - MAPE: 25.70%
  - WMAPE: 21.64%

- 분석:
  - 현재까지 가장 강한 기존 baseline이다.
  - unit price 모델이 일반 가격 예측 보정에 효과적이었다.
  - 목표 R2 0.80에는 아직 부족하지만 상승 추세를 확인했다.

## Baseline - Original Notebook Ensemble

- 상태: 완료
- 실행 위치: Colab
- 데이터:
  - 전체 행: 5,342
  - 학습 행: 4,273
  - 테스트 행: 1,069
  - 테스트 기간: 202312 ~ 202604

- 모델:
  - raw price XGBoost
  - log price XGBoost
  - unit price XGBoost
  - TimeSeriesSplit 기반 ensemble weight 탐색

- 파라미터:
  - raw: `n_estimators=600`, `max_depth=5`, `learning_rate=0.025`, `subsample=0.9`, `colsample_bytree=0.9`, `reg_lambda=2.0`
  - log: `n_estimators=600`, `max_depth=4`, `learning_rate=0.025`, `subsample=0.85`, `colsample_bytree=0.85`, `reg_lambda=2.0`
  - unit: `n_estimators=500`, `max_depth=4`, `learning_rate=0.03`, `subsample=0.85`, `colsample_bytree=0.85`, `reg_lambda=2.0`

- CV 결과:
  - `(0.5, 0.5, 0.0)`: MAE 14,818.7413
  - `(0.45, 0.45, 0.1)`: MAE 14,651.7984
  - `(0.4, 0.4, 0.2)`: MAE 14,543.3754
  - `(0.5, 0.35, 0.15)`: MAE 14,601.0003
  - `(0.6, 0.3, 0.1)`: MAE 14,671.6273
  - `(0.35, 0.5, 0.15)`: MAE 14,593.2198
  - best weights: `(0.4, 0.4, 0.2)`

- 최종 테스트 결과:
  - R2: 0.7532
  - MAE: 16,807.7966 만원
  - RMSE: 24,431.0120 만원
  - MAPE: 25.6977%
  - WMAPE: 21.6361%

- 판단:
  - 시간순 테스트 기준 R2 0.7532로, 목표 0.8~0.9까지는 추가 피처 개선이 필요하다.
  - CV MAE보다 최종 테스트 MAE가 높아 최근 구간 또는 2024~2026년 분포 변화가 반영된 것으로 보인다.
  - 다음 실험은 위치/면적/연식/계절 피처를 강화하고, GPU에서 더 큰 XGBoost 모델로 확인한다.

## 1차 실험 - Enhanced XGBoost Ensemble

- 상태: 완료
- 실행 위치: Colab GPU 권장
- 실행 명령:

```bash
pip install -r ai_training/requirements.txt
python ai_training/train_model.py --data "최종_용인_실거래가_통합_결측채움.csv" --mode full --device cuda --output-dir ai_training/outputs
```

- 변경 내용:
  - 기존 raw/log/unit price XGBoost ensemble 구조 유지
  - `area_bin`, `age_bin` target encoding 추가
  - 월 계절성 `month_sin`, `month_cos` 추가
  - `area_x_age`, `land_x_age` 상호작용 피처 추가
  - 이상치 제거 범위를 1~99%에서 0.5~99.5%로 완화
  - full mode에서 XGBoost tree 수와 depth를 증가
  - TimeSeriesSplit 기반 ensemble weight 탐색 유지

- 목적:
  - Baseline R2 0.7532 대비 위치/면적/연식/계절 피처를 강화해 R2를 최대한 올린다.

- 결과:
  - R2: 0.7356096881
  - MAE: 17,750.0560 만원
  - RMSE: 26,084.3910 만원
  - MAPE: 31.7047%
  - WMAPE: 22.6923%

- 판단:
  - Baseline R2 0.7532보다 낮아졌고 MAE/RMSE/MAPE/WMAPE도 모두 악화됐다.
  - 추가 피처와 더 큰 XGBoost capacity가 현재 5,342건 데이터에서는 과적합 또는 최근 테스트 구간 일반화 저하로 이어진 것으로 판단한다.
  - 다음 실험은 모델을 더 키우지 않고, 같은 split에서 RandomForest/ExtraTrees/규제 강화 XGBoost를 비교하는 안정성 중심 실험으로 전환한다.

## 2차 실험 - Stable Tree Model Comparison

- 상태: 완료
- 실행 위치: Colab GPU
- 실행 명령:

```bash
pip install -r ai_training/requirements.txt
python ai_training/train_model.py --data "최종_용인_실거래가_통합_결측채움.csv" --mode full --device cuda --output-dir ai_training/outputs
```

- 변경 내용:
  - 1차 실험처럼 XGBoost capacity를 키우지 않고, 얕은 트리와 강한 규제로 바꾼다.
  - `max_depth`: 5~6 중심에서 3으로 축소
  - `min_child_weight`: 2 수준에서 10으로 증가
  - `subsample`, `colsample_bytree`: 0.88~0.90에서 0.75로 감소
  - `reg_lambda`: 2.0에서 10.0으로 증가
  - `reg_alpha`: 0.8 추가
  - `gamma`: 0.3 추가
  - target encoding smoothing: 20에서 35로 증가
  - 작은 카테고리 one-hot 기준: 30에서 50으로 증가
  - unit price 모델 비중이 더 커질 수 있도록 ensemble 후보를 추가한다.

- 목적:
  - 데이터가 5천 건 수준인 상황에서 XGBoost 과적합을 줄이고 baseline R2 0.7532를 회복하거나 개선할 수 있는지 확인한다.

- 결과:
  - R2: 0.7042490215
  - MAE: 19,225.6620 만원
  - RMSE: 27,588.0515 만원
  - MAPE: 33.6647%
  - WMAPE: 24.5788%

- 판단:
  - Baseline R2 0.7532, 1차 R2 0.7356보다 더 낮아졌다.
  - XGBoost 규제를 강하게 주는 방향은 현재 데이터에서 underfit 또는 중요 패턴 손실로 이어진 것으로 보인다.
  - 다음 실험은 baseline 구조로 되돌리고 train/test 성능을 함께 출력해 과적합인지, underfit인지, 테스트 기간 분포 변화인지 먼저 판별한다.

- 다음 후보:
  - 2차도 baseline보다 낮으면 ExtraTrees를 같은 시간순 split으로 비교한다.
  - ExtraTrees는 RandomForest보다 더 랜덤하게 split을 잡아서 분산을 줄일 수 있지만, 데이터가 작고 위치 피처가 강하면 underfit/overfit 양쪽 가능성이 있어 실제 비교가 필요하다.

## 3차 실험 - Baseline XGBoost With Diagnostics

- 상태: 완료
- 실행 위치: Colab GPU
- 실험 성격: 성능 개선이 아니라 원인 진단

- 변경 내용:
  - 성능이 가장 좋았던 baseline XGBoost 파라미터와 피처셋으로 되돌린다.
  - train metrics, test metrics, train-test R2 gap을 함께 출력한다.
  - 목적은 모델 변경보다 진단이다.

- 목적:
  - 1차/2차 하락 원인이 과적합인지, underfit인지, 최근 테스트 구간 분포 변화인지 판단한다.
  - 이후 ExtraTrees, 유사지역 데이터 추가, 변동률 모델 중 어느 방향으로 갈지 결정하기 위한 기준값을 만든다.

- 실행 명령:

```bash
pip install -r ai_training/requirements.txt
python ai_training/train_model.py --data "최종_용인_실거래가_통합_결측채움.csv" --mode full --device cuda --output-dir ai_training/outputs
```

- 확인할 출력:
  - `===== Train Metrics =====`
  - `===== Test Metrics =====`
  - `R2 gap`

- 해석 기준:
  - train R2가 높고 test R2가 낮으면 과적합 가능성이 크다.
  - train R2와 test R2가 모두 낮으면 underfit 또는 피처 부족 가능성이 크다.
  - CV는 괜찮고 최근 test만 낮으면 2023~2026 테스트 구간의 분포 변화 가능성이 크다.

- 결과:
  - train R2: 0.8860439287
  - train MAE: 8,867.6057 만원
  - train RMSE: 13,007.4360 만원
  - train MAPE: 16.2831%
  - train WMAPE: 13.7820%
  - test R2: 0.7537841448
  - R2 gap: 0.132260
  - test MAE: 16,819.9100 만원
  - test RMSE: 24,403.3506 만원
  - test MAPE: 25.7539%
  - test WMAPE: 21.6516%

- 판단:
  - test R2 0.7538로 Baseline 0.7532와 거의 동일하다.
  - train R2 0.8860 대비 test R2 0.7538로 gap이 0.1323 존재하므로 약한 과적합 또는 테스트 기간 분포 변화가 있다.
  - 1차/2차 튜닝이 baseline을 넘지 못했으므로, XGBoost 파라미터 조정보다 데이터/타깃 설계 개선이 필요하다.
  - 다음 우선순위는 유사지역 데이터 추가 또는 최근 지역 기준가 대비 변동률/잔차 예측 모델 실험이다.

## 4차 실험 - Price Change Or Residual Target Design

- 상태: 완료
- 실험 성격: 타깃 개선
- 실행 위치: Colab GPU
- 실행 명령:

```bash
pip install -r ai_training/requirements.txt
python ai_training/train_model.py --data "최종_용인_실거래가_통합_결측채움.csv" --mode full --device cuda --output-dir ai_training/outputs
```

- 적용 방식: 기준가 대비 비율 예측
  - 같은 `dong + house_type + area_bin`의 과거 평균 단가를 기준가로 만든다.
  - 실제 코드에서는 누수 방지를 위해 현재 거래를 제외한 과거 누적 평균만 기준가로 사용한다.
  - 기준가 계층은 `dong+house_type` -> `gu+house_type` -> `house_type` -> global prior mean 순서로 fallback한다.
  - 모델은 절대 가격이 아니라 `실제 가격 / 기준 가격` 비율을 예측한다.
  - 최종 가격은 `기준 가격 * 예측 비율`로 복원한다.
  - 기준가만 썼을 때의 성능도 함께 출력한다.

- 목적:
  - 절대 가격을 직접 예측하는 baseline XGBoost보다 지역별 최근 가격 수준을 더 안정적으로 반영하는지 확인한다.
  - 교수님이 제안한 변동률/기준가 방식의 1차 검증으로 사용한다.

- 확인할 출력:
  - `===== Train Metrics =====`
  - `===== Test Metrics =====`
  - `===== Baseline Only Metrics =====`
  - `R2 gap`

- 결과:
  - train R2: 0.8727677829
  - train MAE: 9,130.0155 만원
  - train RMSE: 13,744.2647 만원
  - train MAPE: 16.3398%
  - train WMAPE: 14.1898%
  - test R2: 0.7386728526
  - baseline-only R2: 0.4084931951
  - R2 gap: 0.134095
  - test MAE: 17,376.8082 만원
  - test RMSE: 25,141.0676 만원
  - test MAPE: 27.4270%
  - test WMAPE: 22.3685%
  - baseline-only MAE: 23,347.2698 만원
  - baseline-only RMSE: 37,824.3370 만원
  - baseline-only MAPE: 37.1330%
  - baseline-only WMAPE: 30.0541%

- 판단:
  - 기준가만 사용한 baseline-only R2는 0.4085로 낮다.
  - 모델이 기준가를 크게 보정해 test R2 0.7387까지 올렸지만, 직접 가격 예측 baseline R2 0.7538보다 낮다.
  - 현재 기준가 설계는 단독으로 충분히 강하지 않고, 비율 타깃도 baseline을 넘지 못했다.
  - 다음은 비율보다 `실제 가격 - 기준 가격` 잔차 예측을 시도하거나, 기준가 피처를 baseline 직접 가격 예측 모델에 보조 피처로만 넣는 방향이 더 타당하다.

- 다음 후보:
  - 비율 예측이 실패하면 `실제 가격 - 기준 가격` 잔차 예측으로 바꿔 실험한다.
  - 기준가 자체 성능이 낮으면 유사지역 데이터 추가보다 기준가 피처 설계부터 보강한다.

## 5차 실험 - Direct Price With Historical Baseline Features

- 상태: 완료
- 실험 성격: 기준가 피처 보조 사용
- 실행 위치: Colab GPU
- 실행 명령:

```bash
pip install -r ai_training/requirements.txt
python ai_training/train_model.py --data "최종_용인_실거래가_통합_결측채움.csv" --mode full --device cuda --output-dir ai_training/outputs
```

- 변경 내용:
  - 타깃은 다시 직접 가격 예측으로 되돌린다.
  - 4차에서 만든 `baseline_unit_price`, `baseline_price`, `baseline_count`, `baseline_source_level`은 피처로만 사용한다.
  - 목적은 비율 타깃이 아니라, baseline XGBoost가 과거 기준가 정보를 참고할 수 있게 하는 것이다.

- 목적:
  - baseline R2 0.7538을 넘기는지 확인한다.
  - 4차 기준가가 타깃 변환에는 약했지만 보조 피처로는 도움이 되는지 검증한다.

- 결과:
  - train R2: 0.8903105417
  - train MAE: 8,696.8829 만원
  - train RMSE: 12,761.6083 만원
  - train MAPE: 15.9518%
  - train WMAPE: 13.5166%
  - test R2: 0.7591479794
  - baseline-only R2: 0.4084931951
  - R2 gap: 0.131163
  - test MAE: 16,764.0912 만원
  - test RMSE: 24,136.0723 만원
  - test MAPE: 26.1897%
  - test WMAPE: 21.5798%
  - baseline-only MAE: 23,347.2698 만원
  - baseline-only RMSE: 37,824.3370 만원
  - baseline-only MAPE: 37.1330%
  - baseline-only WMAPE: 30.0541%

- 판단:
  - 현재 최고 성능이다.
  - 기존 baseline test R2 0.7538에서 0.7591로 소폭 개선됐다.
  - MAE도 16,819.9100만원에서 16,764.0912만원으로 소폭 개선됐다.
  - 다만 MAPE는 25.7539%에서 26.1897%로 약간 악화됐다.
  - train/test R2 gap은 0.1312로 여전히 존재한다.
  - 과거 기준가 피처는 도움이 되지만, 기준가 단독 성능이 낮아 이 피처만으로 큰 개선은 어렵다.

## 6차 실험 - Baseline Features With Regularized Helper Baseline

- 상태: 완료
- 실험 성격: 5차 개선안 미세 조정
- 실행 위치: Colab GPU
- 실행 명령:

```bash
pip install -r ai_training/requirements.txt
python ai_training/train_model.py --data "최종_용인_실거래가_통합_결측채움.csv" --mode full --device cuda --output-dir ai_training/outputs
```

- 변경 내용:
  - 5차 구조를 유지한다.
  - `log_baseline_unit_price`, `log_baseline_price`, `log_baseline_count` 추가
  - `baseline_area_ratio`, `baseline_unit_x_area` 추가
  - XGBoost 복잡도는 크게 늘리지 않고 learning rate를 낮추고 tree 수를 소폭 증가
  - `reg_lambda=3.0`, `min_child_weight=2`로 규제를 소폭 추가
  - 목표는 5차 test R2 0.7591을 넘기되 MAPE 악화를 줄이는 것이다.

- 결과:
  - train R2: 0.8835358809
  - train MAE: 8,909.5610 만원
  - train RMSE: 13,149.7966 만원
  - train MAPE: 16.3237%
  - train WMAPE: 13.8472%
  - test R2: 0.7551819031
  - baseline-only R2: 0.4084931951
  - R2 gap: 0.128354
  - test MAE: 16,889.3984 만원
  - test RMSE: 24,333.9836 만원
  - test MAPE: 26.3455%
  - test WMAPE: 21.7411%
  - baseline-only MAE: 23,347.2698 만원
  - baseline-only RMSE: 37,824.3370 만원
  - baseline-only MAPE: 37.1330%
  - baseline-only WMAPE: 30.0541%

- 판단:
  - 5차 test R2 0.7591보다 낮아졌다.
  - train/test gap은 5차 0.1312에서 0.1284로 약간 줄었지만, test 성능도 같이 낮아져 실질 개선은 아니다.
  - 추가한 log baseline/helper interaction 피처와 소폭 규제는 도움이 되지 않았다.
  - 현재 최고 성능은 계속 5차다.

## 7차 실험 - Historical Baseline Change Rate Target

- 상태: 완료
- 실험 성격: 교수님 제안 변동률 타깃 직접 검증
- 실행 위치: Colab GPU
- 실행 명령:

```bash
pip install -r ai_training/requirements.txt
python ai_training/train_model.py --data "최종_용인_실거래가_통합_결측채움.csv" --mode full --device cuda --output-dir ai_training/outputs
```

- 변경 내용:
  - 기준가는 4차/5차와 동일하게 현재 거래를 제외한 과거 누적 평균으로 만든다.
  - 타깃을 직접 가격이 아니라 `(실제 가격 - 기준 가격) / 기준 가격` 변동률로 둔다.
  - 예측 가격은 `기준 가격 * (1 + 예측 변동률)`로 복원한다.
  - 변동률 예측값은 극단값 방지를 위해 `-0.9 ~ 4.0`으로 clipping한다.

- 목적:
  - 교수님이 제안한 변동률 학습 방식이 직접 가격 예측 baseline R2 0.7538 또는 현재 최고 5차 R2 0.7591을 넘는지 확인한다.

- 결과:
  - train R2: 0.8749274753
  - train MAE: 9,085.4186 만원
  - train RMSE: 13,627.1150 만원
  - train MAPE: 16.5547%
  - train WMAPE: 14.1205%
  - test R2: 0.7380032559
  - baseline-only R2: 0.4084931951
  - R2 gap: 0.136924
  - test MAE: 17,428.4240 만원
  - test RMSE: 25,173.2564 만원
  - test MAPE: 27.7674%
  - test WMAPE: 22.4350%
  - baseline-only MAE: 23,347.2698 만원
  - baseline-only RMSE: 37,824.3370 만원
  - baseline-only MAPE: 37.1330%
  - baseline-only WMAPE: 30.0541%

- 판단:
  - 교수님이 제안한 변동률 타깃 방식을 명시적으로 실험했다.
  - test R2 0.7380으로 직접 가격 예측 baseline 0.7538보다 낮고, 현재 최고 5차 0.7591보다도 낮다.
  - 기준가만 사용하는 것보다는 크게 개선됐지만, 변동률 타깃으로 바꾸는 것은 현재 기준가 설계와 5,342건 데이터에서는 최종 모델로 부적합하다.
  - 결론적으로 변동률은 타깃으로 직접 쓰기보다, 5차처럼 기준가 정보를 보조 피처로 사용하는 쪽이 더 낫다.

## Current Best

- 최고 성능 실험: 5차 - Direct Price With Historical Baseline Features
- Test R2: 0.7591479794
- Test MAE: 16,764.0912 만원
- Test RMSE: 24,136.0723 만원
- Test MAPE: 26.1897%
- Test WMAPE: 21.5798%

- 결론:
  - 현재 데이터만으로는 직접 가격 예측 + 과거 기준가 보조 피처 방식이 가장 좋다.
  - 변동률 타깃 실험은 수행했지만 baseline을 넘지 못했다.
  - R2 0.80 이상을 노리려면 유사지역 데이터 추가 또는 더 강한 외부 위치/시세 피처가 필요하다.

## 보류 후보 - 변동률 예측

  - 같은 지역/유형/면적대의 과거 기준 가격 대비 변동률을 타깃으로 둔다.
  - 절대 가격보다 시장 흐름을 학습하게 만들어 타지역 데이터 확장에 유리할 수 있다.

## 보류 후보 - 유사지역 데이터 추가

  - 용인과 가격 분포가 비슷한 지역 데이터를 추가한다.
  - 최종 평가는 반드시 용인 최근 거래 테스트셋으로 유지한다.
  - `region` 피처를 추가해 모델이 지역 차이를 구분하게 한다.
