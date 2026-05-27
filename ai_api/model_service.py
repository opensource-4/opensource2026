from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

from schemas import PricePredictionRequest, PricePredictionResponse


MODEL_PATH = Path(__file__).resolve().parent / "models" / "xgb_price_unit_ensemble_model.joblib"

TARGET_ENCODE_COLS = [
    "gu",
    "dong",
    "house_type",
    "gu_house_type",
    "dong_house_type",
    "dong_road",
    "area_bin",
    "age_bin",
]


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
            x_out[f"{col}_target_avg"] = (
                x_out[col].map(mapping).fillna(self.global_mean_)
            )

        return x_out


# Notebook-trained joblib files can reference __main__.MultiTargetEncoder.
setattr(sys.modules["__main__"], "MultiTargetEncoder", MultiTargetEncoder)


def clean_category(value: Any) -> str:
    text = str(value).strip()
    if text in {"", "-", "nan", "None"}:
        return "기타"
    return text


def extract_gu(address: str) -> str:
    for gu in ["수지구", "기흥구", "처인구"]:
        if gu in address:
            return gu
    return "기타"


def extract_dong(address: str) -> str:
    parts = str(address).split()
    if not parts:
        return "기타"
    return clean_category(parts[-1])


def make_area_bin(total_area: float) -> str:
    if total_area <= 50:
        return "area_1"
    if total_area <= 70:
        return "area_2"
    if total_area <= 85:
        return "area_3"
    if total_area <= 100:
        return "area_4"
    if total_area <= 130:
        return "area_5"
    if total_area <= 170:
        return "area_6"
    if total_area <= 230:
        return "area_7"
    return "area_8"


def make_age_bin(building_age: int) -> str:
    if building_age <= 5:
        return "age_0_5"
    if building_age <= 10:
        return "age_6_10"
    if building_age <= 20:
        return "age_11_20"
    if building_age <= 30:
        return "age_21_30"
    if building_age <= 50:
        return "age_31_50"
    return "age_51_plus"


def build_features(request: PricePredictionRequest) -> pd.DataFrame:
    total_area = float(request.total_area)
    land_area = float(request.land_area)
    build_year = int(request.build_year)
    trade_year = int(request.contract_year)
    trade_month = int(request.contract_month)
    trade_day = int(request.contract_day)

    gu = extract_gu(request.address)
    dong = extract_dong(request.address)
    house_type = clean_category(request.building_type)
    road_condition = clean_category(request.road_condition)
    building_age = max(0, trade_year - build_year)
    area_bin = make_area_bin(total_area)
    age_bin = make_age_bin(building_age)

    features = {
        "total_area": total_area,
        "land_area": land_area,
        "log_total_area": float(np.log1p(total_area)),
        "log_land_area": float(np.log1p(land_area)),
        "far": total_area / land_area,
        "land_to_total_ratio": land_area / total_area,
        "total_to_land_ratio": total_area / land_area,
        "building_age": building_age,
        "build_year": build_year,
        "trade_year": trade_year,
        "trade_month": trade_month,
        "trade_day": trade_day,
        "contract_date_order": trade_year * 10000 + trade_month * 100 + trade_day,
        "month_sin": float(np.sin(2 * np.pi * trade_month / 12)),
        "month_cos": float(np.cos(2 * np.pi * trade_month / 12)),
        "area_x_age": total_area * building_age,
        "land_x_age": land_area * building_age,
        "gu": gu,
        "dong": dong,
        "road_condition": road_condition,
        "house_type": house_type,
        "gu_house_type": f"{gu}_{house_type}",
        "dong_house_type": f"{dong}_{house_type}",
        "dong_road": f"{dong}_{road_condition}",
        "area_bin": area_bin,
        "age_bin": age_bin,
    }

    return pd.DataFrame([features])


class PriceModelService:
    def __init__(self, model_path: Path = MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.load_error = None
        self.load()

    def load(self) -> None:
        if not self.model_path.exists():
            self.load_error = f"Model file not found: {self.model_path}"
            return

        try:
            self.model = joblib.load(self.model_path)
            self.load_error = None
        except Exception as exc:
            self.load_error = str(exc)
            self.model = None

    def is_loaded(self) -> bool:
        return self.model is not None

    def predict(self, request: PricePredictionRequest) -> PricePredictionResponse:
        if self.model is None:
            raise RuntimeError(self.load_error or "Model is not loaded")

        x = build_features(request)

        raw_pred = np.maximum(self.model["raw_pipeline"].predict(x), 0)
        log_pred = np.maximum(np.expm1(self.model["log_pipeline"].predict(x)), 0)
        unit_pred = self.model["unit_pipeline"].predict(x)
        unit_price_pred = np.maximum(unit_pred * x["total_area"].values, 0)

        a, b, c = self.model["best_weights"]
        predicted_manwon = float(np.maximum(a * raw_pred + b * log_pred + c * unit_price_pred, 0)[0])
        predicted_krw = int(round(predicted_manwon * 10_000))
        expected_auction_price_krw = int(round(predicted_krw * request.liquidation_rate))

        return PricePredictionResponse(
            predicted_price_manwon=predicted_manwon,
            predicted_price_krw=predicted_krw,
            expected_auction_price_krw=expected_auction_price_krw,
            liquidation_rate=request.liquidation_rate,
            model_loaded=True,
        )
