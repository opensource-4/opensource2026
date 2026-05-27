from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor


RANDOM_STATE = 42
TEST_SIZE = 0.2
MIN_CATEGORY_COUNT = 50
SMOOTHING = 20
TARGET_MODE = "direct_price_with_historical_baseline_features"

COL_SIGUNGU = "시군구"
COL_AREA = "연면적(㎡)"
COL_LAND = "대지면적(㎡)"
COL_TYPE = "주택유형"
COL_YEAR = "건축년도"
COL_PRICE = "거래금액(만원)"
COL_TRADE_YM = "계약년월"
COL_TRADE_D = "계약일"
COL_ROAD_COND = "도로조건"

TARGET_ENCODE_COLS = [
    "gu",
    "dong",
    "house_type",
    "gu_house_type",
    "dong_house_type",
    "dong_road",
]

NUM_FEATURES = [
    "total_area",
    "land_area",
    "log_total_area",
    "log_land_area",
    "far",
    "land_to_total_ratio",
    "total_to_land_ratio",
    "building_age",
    "build_year",
    "trade_year",
    "trade_month",
    "trade_day",
    "baseline_unit_price",
    "baseline_price",
    "baseline_count",
    "baseline_source_level",
    "gu_target_avg",
    "dong_target_avg",
    "house_type_target_avg",
    "gu_house_type_target_avg",
    "dong_house_type_target_avg",
    "dong_road_target_avg",
]

CAT_FEATURES = [
    "gu",
    "dong",
    "road_condition",
    "house_type",
    "gu_house_type",
    "dong_house_type",
    "dong_road",
]

BASE_FEATURES = [
    "total_area",
    "land_area",
    "log_total_area",
    "log_land_area",
    "far",
    "land_to_total_ratio",
    "total_to_land_ratio",
    "building_age",
    "build_year",
    "trade_year",
    "trade_month",
    "trade_day",
    "baseline_unit_price",
    "baseline_price",
    "baseline_count",
    "baseline_source_level",
] + CAT_FEATURES


def normalize_money(value):
    text = str(value).replace(",", "").strip()
    return pd.to_numeric(text, errors="coerce")


def clean_category(value):
    text = str(value).strip()
    if text in {"", "-", "nan", "None"}:
        return "기타"
    return text


def extract_gu(addr):
    text = str(addr)
    for gu in ["수지구", "기흥구", "처인구"]:
        if gu in text:
            return gu
    return "기타"


def extract_eup_myeon_dong(addr):
    parts = str(addr).split()
    if not parts:
        return "기타"
    return clean_category(parts[-1])


def historical_group_mean(df, group_cols, value_col):
    grouped = df.groupby(group_cols, sort=False)[value_col]
    cumulative_sum = grouped.cumsum() - df[value_col]
    cumulative_count = grouped.cumcount()
    return cumulative_sum / cumulative_count.replace(0, np.nan)


def historical_group_count(df, group_cols):
    return df.groupby(group_cols, sort=False).cumcount()


def add_historical_baseline_features(df):
    out = df.copy()

    out["baseline_unit_specific"] = historical_group_mean(
        out, ["dong", "house_type"], "price_per_total_area"
    )
    out["baseline_count_specific"] = historical_group_count(out, ["dong", "house_type"])
    out["baseline_unit_medium"] = historical_group_mean(
        out, ["gu", "house_type"], "price_per_total_area"
    )
    out["baseline_count_medium"] = historical_group_count(out, ["gu", "house_type"])
    out["baseline_unit_broad"] = historical_group_mean(out, ["house_type"], "price_per_total_area")
    out["baseline_count_broad"] = historical_group_count(out, ["house_type"])
    out["baseline_unit_global"] = out["price_per_total_area"].expanding().mean().shift(1)
    out["baseline_count_global"] = np.arange(len(out), dtype=float)

    out["baseline_unit_price"] = out["baseline_unit_specific"]
    out["baseline_count"] = out["baseline_count_specific"].astype(float)
    out["baseline_source_level"] = 3.0

    medium_mask = out["baseline_unit_price"].isna() | (out["baseline_count"] < 3)
    out.loc[medium_mask, "baseline_unit_price"] = out.loc[medium_mask, "baseline_unit_medium"]
    out.loc[medium_mask, "baseline_count"] = out.loc[medium_mask, "baseline_count_medium"]
    out.loc[medium_mask, "baseline_source_level"] = 2.0

    broad_mask = out["baseline_unit_price"].isna() | (out["baseline_count"] < 5)
    out.loc[broad_mask, "baseline_unit_price"] = out.loc[broad_mask, "baseline_unit_broad"]
    out.loc[broad_mask, "baseline_count"] = out.loc[broad_mask, "baseline_count_broad"]
    out.loc[broad_mask, "baseline_source_level"] = 1.0

    global_mask = out["baseline_unit_price"].isna() | (out["baseline_count"] < 10)
    out.loc[global_mask, "baseline_unit_price"] = out.loc[global_mask, "baseline_unit_global"]
    out.loc[global_mask, "baseline_count"] = out.loc[global_mask, "baseline_count_global"]
    out.loc[global_mask, "baseline_source_level"] = 0.0

    fallback_unit = out["price_per_total_area"].median()
    out["baseline_unit_price"] = out["baseline_unit_price"].fillna(fallback_unit)
    out["baseline_count"] = out["baseline_count"].fillna(0).astype(float)
    out["baseline_price"] = out["baseline_unit_price"] * out["total_area"]

    return out.drop(
        columns=[
            "baseline_unit_specific",
            "baseline_count_specific",
            "baseline_unit_medium",
            "baseline_count_medium",
            "baseline_unit_broad",
            "baseline_count_broad",
            "baseline_unit_global",
            "baseline_count_global",
        ]
    )


def prepare_dataframe(df):
    out = df.copy()

    out["contract_ym"] = pd.to_numeric(out[COL_TRADE_YM], errors="coerce")
    out["trade_year"] = (out["contract_ym"] // 100).astype("Int64")
    out["trade_month"] = (out["contract_ym"] % 100).astype("Int64")
    out["trade_day"] = pd.to_numeric(out[COL_TRADE_D], errors="coerce")

    out["price"] = out[COL_PRICE].apply(normalize_money)
    out["total_area"] = pd.to_numeric(out[COL_AREA], errors="coerce")
    out["land_area"] = pd.to_numeric(out[COL_LAND], errors="coerce")
    out["build_year"] = pd.to_numeric(out[COL_YEAR], errors="coerce")

    out = out.dropna(
        subset=[
            "price",
            "total_area",
            "land_area",
            "build_year",
            "trade_year",
            "trade_month",
            "trade_day",
        ]
    )
    out = out[(out["price"] > 0) & (out["total_area"] > 0) & (out["land_area"] > 0)]

    out["trade_year"] = out["trade_year"].astype(int)
    out["trade_month"] = out["trade_month"].astype(int)
    out["trade_day"] = out["trade_day"].astype(int)
    out["build_year"] = out["build_year"].astype(int)

    out["building_age"] = out["trade_year"] - out["build_year"]
    out = out[(out["building_age"] >= 0) & (out["building_age"] <= 150)]

    out["far"] = out["total_area"] / out["land_area"]
    out = out.replace([np.inf, -np.inf], np.nan).dropna(subset=["far"])
    out = out[(out["far"] > 0) & (out["far"] < 20)]

    out["log_total_area"] = np.log1p(out["total_area"])
    out["log_land_area"] = np.log1p(out["land_area"])
    out["land_to_total_ratio"] = out["land_area"] / out["total_area"]
    out["total_to_land_ratio"] = out["total_area"] / out["land_area"]

    out["house_type"] = out[COL_TYPE].map(clean_category)
    out["gu"] = out[COL_SIGUNGU].apply(extract_gu)
    out["dong"] = out[COL_SIGUNGU].apply(extract_eup_myeon_dong)
    out["road_condition"] = out[COL_ROAD_COND].map(clean_category)

    out["gu_house_type"] = out["gu"] + "_" + out["house_type"]
    out["dong_house_type"] = out["dong"] + "_" + out["house_type"]
    out["dong_road"] = out["dong"] + "_" + out["road_condition"]

    out["contract_date_order"] = (
        out["trade_year"] * 10000 + out["trade_month"] * 100 + out["trade_day"]
    )
    price_lower = out["price"].quantile(0.01)
    price_upper = out["price"].quantile(0.99)
    out = out[(out["price"] >= price_lower) & (out["price"] <= price_upper)]
    out = out.sort_values("contract_date_order").reset_index(drop=True)
    out["price_per_total_area"] = out["price"] / out["total_area"]

    return add_historical_baseline_features(out)


def time_based_split(df, test_size=0.2):
    split_idx = int(len(df) * (1 - test_size))
    split_idx = min(max(split_idx, 1), len(df) - 1)
    return df.iloc[:split_idx].copy(), df.iloc[split_idx:].copy()


class MultiTargetEncoder(BaseEstimator, TransformerMixin):
    def __init__(self, columns, smoothing=20):
        self.columns = columns
        self.smoothing = smoothing

    def fit(self, X, y, sample_weight=None):
        self.global_mean_ = float(np.mean(y))
        self.mappings_ = {}
        x_temp = X.copy()
        x_temp["_target"] = np.asarray(y)

        for col in self.columns:
            stats = x_temp.groupby(col)["_target"].agg(["mean", "count"])
            mapping = (
                (stats["mean"] * stats["count"] + self.global_mean_ * self.smoothing)
                / (stats["count"] + self.smoothing)
            )
            self.mappings_[col] = mapping.to_dict()

        return self

    def transform(self, X):
        x_out = X.copy()
        for col in self.columns:
            mapping = self.mappings_.get(col, {})
            x_out[f"{col}_target_avg"] = x_out[col].map(mapping).fillna(self.global_mean_)
        return x_out


def build_pipeline(params, device):
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", SimpleImputer(strategy="median"), NUM_FEATURES),
            (
                "cat",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        (
                            "onehot",
                            OneHotEncoder(
                                handle_unknown="ignore",
                                min_frequency=MIN_CATEGORY_COUNT,
                                sparse_output=False,
                            ),
                        ),
                    ]
                ),
                CAT_FEATURES,
            ),
        ]
    )

    model = XGBRegressor(
        objective="reg:squarederror",
        random_state=RANDOM_STATE,
        n_jobs=-1,
        tree_method="hist",
        device=device,
        eval_metric="rmse",
        **params,
    )

    return Pipeline(
        steps=[
            ("target_encoder", MultiTargetEncoder(TARGET_ENCODE_COLS, smoothing=SMOOTHING)),
            ("preprocess", preprocessor),
            ("model", model),
        ]
    )


def evaluate(y_true, pred):
    mae = mean_absolute_error(y_true, pred)
    rmse = np.sqrt(mean_squared_error(y_true, pred))
    r2 = r2_score(y_true, pred)
    y_true_array = np.asarray(y_true, dtype=float)
    pred_array = np.asarray(pred, dtype=float)
    nonzero_mask = y_true_array != 0
    mape = (
        np.mean(
            np.abs(
                (y_true_array[nonzero_mask] - pred_array[nonzero_mask])
                / y_true_array[nonzero_mask]
            )
        )
        * 100
        if nonzero_mask.any()
        else np.nan
    )
    wmape = (
        np.sum(np.abs(y_true_array - pred_array)) / np.sum(np.abs(y_true_array)) * 100
        if np.sum(np.abs(y_true_array)) != 0
        else np.nan
    )
    return {
        "MAE_만원": float(mae),
        "RMSE_만원": float(rmse),
        "R2": float(r2),
        "MAPE_%": float(mape),
        "WMAPE_%": float(wmape),
    }


def get_param_sets(mode):
    if mode == "quick":
        return {
            "raw": {"n_estimators": 250, "max_depth": 5, "learning_rate": 0.04, "subsample": 0.9, "colsample_bytree": 0.9, "reg_lambda": 2.0},
            "log": {"n_estimators": 250, "max_depth": 4, "learning_rate": 0.04, "subsample": 0.85, "colsample_bytree": 0.85, "reg_lambda": 2.0},
            "unit": {"n_estimators": 220, "max_depth": 4, "learning_rate": 0.045, "subsample": 0.85, "colsample_bytree": 0.85, "reg_lambda": 2.0},
        }

    return {
        "raw": {"n_estimators": 600, "max_depth": 5, "learning_rate": 0.025, "subsample": 0.9, "colsample_bytree": 0.9, "reg_lambda": 2.0},
        "log": {"n_estimators": 600, "max_depth": 4, "learning_rate": 0.025, "subsample": 0.85, "colsample_bytree": 0.85, "reg_lambda": 2.0},
        "unit": {"n_estimators": 500, "max_depth": 4, "learning_rate": 0.03, "subsample": 0.85, "colsample_bytree": 0.85, "reg_lambda": 2.0},
    }


def train_ensemble(data, mode, device):
    train_df, test_df = time_based_split(data, test_size=TEST_SIZE)
    x_train = train_df[BASE_FEATURES]
    x_test = test_df[BASE_FEATURES]

    y_train_raw = train_df["price"]
    y_train_log = np.log1p(train_df["price"])
    y_train_unit = train_df["price_per_total_area"]
    y_test = test_df["price"]

    weight_base_year = train_df["trade_year"].min()
    sample_weight = 0.65 + 0.35 * (
        (train_df["trade_year"] - weight_base_year)
        / max(1, train_df["trade_year"].max() - weight_base_year)
    )

    params = get_param_sets(mode)
    weight_candidates = [
        (0.50, 0.50, 0.00),
        (0.45, 0.45, 0.10),
        (0.40, 0.40, 0.20),
        (0.50, 0.35, 0.15),
        (0.60, 0.30, 0.10),
        (0.35, 0.50, 0.15),
    ]

    cv = TimeSeriesSplit(n_splits=3 if mode == "quick" else 5)
    weight_scores = {w: [] for w in weight_candidates}

    for fold, (train_idx, valid_idx) in enumerate(cv.split(x_train), start=1):
        x_cv_train = x_train.iloc[train_idx]
        x_cv_valid = x_train.iloc[valid_idx]
        w_cv_train = sample_weight.iloc[train_idx]

        raw_pipeline = build_pipeline(params["raw"], device)
        log_pipeline = build_pipeline(params["log"], device)
        unit_pipeline = build_pipeline(params["unit"], device)

        raw_pipeline.fit(
            x_cv_train,
            y_train_raw.iloc[train_idx],
            target_encoder__sample_weight=w_cv_train,
            model__sample_weight=w_cv_train,
        )
        log_pipeline.fit(
            x_cv_train,
            y_train_log.iloc[train_idx],
            target_encoder__sample_weight=w_cv_train,
            model__sample_weight=w_cv_train,
        )
        unit_pipeline.fit(
            x_cv_train,
            y_train_unit.iloc[train_idx],
            target_encoder__sample_weight=w_cv_train,
            model__sample_weight=w_cv_train,
        )

        raw_pred = np.maximum(raw_pipeline.predict(x_cv_valid), 0)
        log_pred = np.maximum(np.expm1(log_pipeline.predict(x_cv_valid)), 0)
        unit_pred = unit_pipeline.predict(x_cv_valid)
        unit_price_pred = np.maximum(unit_pred * x_cv_valid["total_area"].values, 0)

        for weights in weight_candidates:
            a, b, c = weights
            price_pred = np.maximum(a * raw_pred + b * log_pred + c * unit_price_pred, 0)
            actual_price = train_df["price"].iloc[valid_idx]
            weight_scores[weights].append(mean_absolute_error(actual_price, price_pred))

        print(f"fold {fold} done")

    best_weights = min(weight_scores, key=lambda w: np.mean(weight_scores[w]))

    final_raw_pipeline = build_pipeline(params["raw"], device)
    final_log_pipeline = build_pipeline(params["log"], device)
    final_unit_pipeline = build_pipeline(params["unit"], device)

    final_raw_pipeline.fit(
        x_train,
        y_train_raw,
        target_encoder__sample_weight=sample_weight,
        model__sample_weight=sample_weight,
    )
    final_log_pipeline.fit(
        x_train,
        y_train_log,
        target_encoder__sample_weight=sample_weight,
        model__sample_weight=sample_weight,
    )
    final_unit_pipeline.fit(
        x_train,
        y_train_unit,
        target_encoder__sample_weight=sample_weight,
        model__sample_weight=sample_weight,
    )

    a, b, c = best_weights

    def predict_price(x):
        raw_pred = np.maximum(final_raw_pipeline.predict(x), 0)
        log_pred = np.maximum(np.expm1(final_log_pipeline.predict(x)), 0)
        unit_pred = final_unit_pipeline.predict(x)
        unit_price_pred = np.maximum(unit_pred * x["total_area"].values, 0)
        return np.maximum(a * raw_pred + b * log_pred + c * unit_price_pred, 0)

    train_pred = predict_price(x_train)
    test_pred = predict_price(x_test)
    train_metrics = evaluate(train_df["price"], train_pred)
    test_metrics = evaluate(y_test, test_pred)
    baseline_only_metrics = evaluate(y_test, x_test["baseline_price"].values)

    artifact = {
        "raw_pipeline": final_raw_pipeline,
        "log_pipeline": final_log_pipeline,
        "unit_pipeline": final_unit_pipeline,
        "best_weights": best_weights,
        "smoothing": SMOOTHING,
        "target_mode": TARGET_MODE,
        "target_encode_cols": TARGET_ENCODE_COLS,
        "num_features": NUM_FEATURES,
        "cat_features": CAT_FEATURES,
        "base_features": BASE_FEATURES,
        "metrics": test_metrics,
        "train_metrics": train_metrics,
        "baseline_only_metrics": baseline_only_metrics,
    }

    result = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "mode": mode,
        "device": device,
        "rows_total": int(len(data)),
        "train_rows": int(len(train_df)),
        "test_rows": int(len(test_df)),
        "test_period": [int(test_df["contract_ym"].min()), int(test_df["contract_ym"].max())],
        "model_type": "direct_price_xgb_with_historical_baseline_features",
        "target_mode": TARGET_MODE,
        "params": params,
        "weight_result": {str(k): float(np.mean(v)) for k, v in weight_scores.items()},
        "best_weights": list(best_weights),
        "metrics": test_metrics,
        "train_metrics": train_metrics,
        "baseline_only_metrics": baseline_only_metrics,
        "r2_gap": float(train_metrics["R2"] - test_metrics["R2"]),
        "target_encode_cols": TARGET_ENCODE_COLS,
        "num_features": NUM_FEATURES,
        "cat_features": CAT_FEATURES,
        "base_features": BASE_FEATURES,
    }

    return artifact, result


def write_summary(path, result):
    metrics = result["metrics"]
    train_metrics = result["train_metrics"]
    baseline_metrics = result["baseline_only_metrics"]
    content = f"""# Experiment Summary

## Latest Run

- Mode: `{result["mode"]}`
- Device: `{result["device"]}`
- Model: `{result["model_type"]}`
- Target mode: `{result["target_mode"]}`
- Rows: `{result["rows_total"]:,}` total / `{result["train_rows"]:,}` train / `{result["test_rows"]:,}` test
- Test period: `{result["test_period"][0]}` ~ `{result["test_period"][1]}`
- Best weights: `{result["best_weights"]}`

## Metrics

- Train R2: `{train_metrics["R2"]:.6f}`
- Test R2: `{metrics["R2"]:.6f}`
- R2 gap: `{result["r2_gap"]:.6f}`
- Test MAE: `{metrics["MAE_만원"]:.2f}` 만원
- Test RMSE: `{metrics["RMSE_만원"]:.2f}` 만원
- Test MAPE: `{metrics["MAPE_%"]:.2f}%`
- Test WMAPE: `{metrics["WMAPE_%"]:.2f}%`

## Baseline Only

- Baseline-only R2: `{baseline_metrics["R2"]:.6f}`
- Baseline-only MAE: `{baseline_metrics["MAE_만원"]:.2f}` 만원

## Changes In This Script

- Predicts direct absolute price.
- Uses historical local baseline price as helper features.
- Historical baseline uses only prior transactions to reduce target leakage.
- Baseline hierarchy: `dong+house_type` -> `gu+house_type` -> `house_type` -> global prior mean.
"""
    path.write_text(content, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data",
        default="최종_용인_실거래가_통합_결측채움.csv",
        help="Training CSV path",
    )
    parser.add_argument("--output-dir", default="ai_training/outputs")
    parser.add_argument("--mode", choices=["quick", "full"], default="full")
    parser.add_argument("--device", choices=["cpu", "cuda"], default="cuda")
    args, _unknown = parser.parse_known_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.data)
    data = prepare_dataframe(df)
    artifact, result = train_ensemble(data, mode=args.mode, device=args.device)

    model_path = output_dir / "xgb_price_unit_ensemble_model.joblib"
    metrics_path = output_dir / "xgb_price_unit_ensemble_metrics.json"
    summary_path = output_dir / "experiment_summary.md"

    joblib.dump(artifact, model_path)
    metrics_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    write_summary(summary_path, result)

    print("===== Train Metrics =====")
    print(json.dumps(result["train_metrics"], ensure_ascii=False, indent=2))
    print("===== Test Metrics =====")
    print(json.dumps(result["metrics"], ensure_ascii=False, indent=2))
    print("===== Baseline Only Metrics =====")
    print(json.dumps(result["baseline_only_metrics"], ensure_ascii=False, indent=2))
    print(f"R2 gap: {result['r2_gap']:.6f}")
    print(f"model saved: {model_path}")
    print(f"metrics saved: {metrics_path}")
    print(f"summary saved: {summary_path}")


if __name__ == "__main__":
    main()
