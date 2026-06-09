from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

from schemas import PricePredictionRequest, PricePredictionResponse


COORD_GRID_SIZE = 0.005
YONGIN_CENTER_LAT = 37.2411
YONGIN_CENTER_LON = 127.1776

_here = Path(__file__).resolve().parent
_candidates = [
    # 환경변수 우선
    Path(os.getenv("MODEL_PATH", "")) if os.getenv("MODEL_PATH") else None,
    # CLAUDE.md에 명시된 학습 결과 경로
    _here.parent / "ai_training" / "outputs_coord_test" / "xgb_price_unit_ensemble_model.joblib",
    # 기존 경로 (fallback)
    _here / "models" / "xgb_price_unit_ensemble_model.joblib",
]
MODEL_PATH = next((p for p in _candidates if p and p.exists()), _candidates[-1])


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


# joblib이 __main__.MultiTargetEncoder로 pickle 된 경우 역직렬화를 위해 등록
setattr(sys.modules["__main__"], "MultiTargetEncoder", MultiTargetEncoder)


def _clean_category(value) -> str:
    text = str(value).strip()
    if text in {"", "-", "nan", "None"}:
        return "기타"
    return text


def _extract_gu(address: str) -> str:
    for gu in ["수지구", "기흥구", "처인구"]:
        if gu in address:
            return gu
    return "기타"


def _extract_dong(address: str) -> str:
    parts = str(address).split()
    return _clean_category(parts[-1]) if parts else "기타"


def _format_manwon(value: float) -> str:
    rounded = int(round(value))
    sign = "-" if rounded < 0 else ""
    amount = abs(rounded)
    eok, remainder = divmod(amount, 10_000)
    cheon, man = divmod(remainder, 1_000)
    parts = []
    if eok:
        parts.append(f"{eok:,}억")
    if cheon:
        parts.append(f"{cheon}천")
    if man or not parts:
        parts.append(f"{man:,}만원")
    return sign + " ".join(parts)


def _build_features(request: PricePredictionRequest) -> pd.DataFrame:
    total_area = float(request.total_area)
    land_area = float(request.land_area)
    build_year_raw = int(request.build_year)
    build_year_missing = int(build_year_raw == 1900)
    build_year = np.nan if build_year_missing else float(build_year_raw)
    trade_year = int(request.contract_year)
    trade_month = int(request.contract_month)
    trade_day = int(request.contract_day)
    building_age = np.nan if build_year_missing else float(max(0, trade_year - build_year_raw))

    gu = _extract_gu(request.address)
    dong = _extract_dong(request.address)
    house_type = _clean_category(request.building_type)
    road_condition = _clean_category(request.road_condition)

    lat = float(request.latitude) if request.latitude is not None else np.nan
    lon = float(request.longitude) if request.longitude is not None else np.nan
    coord_missing = int(np.isnan(lat) or np.isnan(lon))

    lat_val = lat if not np.isnan(lat) else YONGIN_CENTER_LAT
    lon_val = lon if not np.isnan(lon) else YONGIN_CENTER_LON
    lat_bin = round(np.floor(lat_val / COORD_GRID_SIZE) * COORD_GRID_SIZE, 4)
    lon_bin = round(np.floor(lon_val / COORD_GRID_SIZE) * COORD_GRID_SIZE, 4)
    coord_grid = f"{lat_bin}_{lon_bin}"

    return pd.DataFrame([{
        "total_area": total_area,
        "land_area": land_area,
        "log_total_area": float(np.log1p(total_area)),
        "log_land_area": float(np.log1p(land_area)),
        "far": total_area / land_area,
        "land_to_total_ratio": land_area / total_area,
        "total_to_land_ratio": total_area / land_area,
        "building_age": building_age,
        "build_year": build_year,
        "build_year_missing": float(build_year_missing),
        "trade_year": float(trade_year),
        "trade_month": float(trade_month),
        "trade_day": float(trade_day),
        "latitude": lat if not np.isnan(lat) else np.nan,
        "longitude": lon if not np.isnan(lon) else np.nan,
        "coord_missing": float(coord_missing),
        "lat_lon_interaction": lat_val * lon_val,
        "lat_sq": lat_val ** 2,
        "lon_sq": lon_val ** 2,
        # historical baseline: NaN -> SimpleImputer(median) fills with training-time median
        "baseline_unit_price": np.nan,
        "baseline_price": np.nan,
        "baseline_count": np.nan,
        "baseline_source_level": np.nan,
        "gu": gu,
        "dong": dong,
        "road_condition": road_condition,
        "house_type": house_type,
        "gu_house_type": f"{gu}_{house_type}",
        "dong_house_type": f"{dong}_{house_type}",
        "dong_road": f"{dong}_{road_condition}",
        "coord_grid": coord_grid,
        "coord_grid_house_type": f"{coord_grid}_{house_type}",
    }])


def _pipeline_predict(pipeline, x: pd.DataFrame) -> np.ndarray:
    transformed = pipeline[:-1].transform(x)
    return pipeline.named_steps["model"].predict(transformed)


class PriceModelService:
    def __init__(self, model_path: Path = MODEL_PATH):
        self.model_path = model_path
        self.bundle = None
        self.load_error: Optional[str] = None
        self._load()

    def _load(self) -> None:
        if not self.model_path.exists():
            self.load_error = f"Model file not found: {self.model_path}"
            return
        try:
            self.bundle = joblib.load(self.model_path)
            self.load_error = None
        except Exception as exc:
            self.load_error = str(exc)
            self.bundle = None

    def is_loaded(self) -> bool:
        return self.bundle is not None

    def predict(self, request: PricePredictionRequest) -> PricePredictionResponse:
        if self.bundle is None:
            raise RuntimeError(self.load_error or "Model is not loaded")

        x = _build_features(request)
        b = self.bundle

        raw_pred = np.maximum(_pipeline_predict(b["raw_pipeline"], x), 0)
        log_pred = np.maximum(np.expm1(_pipeline_predict(b["log_pipeline"], x)), 0)
        unit_pred = _pipeline_predict(b["unit_pipeline"], x)
        unit_price_pred = np.maximum(unit_pred * x["total_area"].values, 0)

        a, w, c = b["best_weights"]
        price_pred = np.maximum(a * raw_pred + w * log_pred + c * unit_price_pred, 0)

        if b.get("calibrator") is not None:
            cal = b["calibrator"].predict(price_pred.reshape(-1, 1))
            strength = b.get("calibration_strength", 0.0)
            price_pred = (1 - strength) * price_pred + strength * cal

        if b.get("residual_pipeline") is not None:
            residual = _pipeline_predict(b["residual_pipeline"], x)
            if b.get("positive_residual_only", False):
                residual = np.maximum(residual, 0)
            gate = b.get("residual_gate_만원", 0.0)
            residual = np.where(price_pred >= gate, residual, 0)
            price_pred = price_pred + b.get("residual_strength", 0.0) * residual

        predicted_manwon = float(np.maximum(price_pred, 0)[0])

        return PricePredictionResponse(
            predicted_price_manwon=round(predicted_manwon),
            predicted_price_text=_format_manwon(predicted_manwon),
        )
