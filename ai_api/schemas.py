from pydantic import BaseModel, Field


class PricePredictionRequest(BaseModel):
    address: str = ""
    building_type: str = Field(default="기타")
    total_area: float = Field(gt=0)
    land_area: float = Field(gt=0)
    build_year: int = Field(ge=1800, le=2100)
    contract_year: int = Field(ge=2000, le=2100)
    contract_month: int = Field(default=1, ge=1, le=12)
    contract_day: int = Field(default=1, ge=1, le=31)
    road_condition: str = "기타"
    liquidation_rate: float = Field(default=0.85, gt=0, le=1)


class PricePredictionResponse(BaseModel):
    predicted_price_manwon: float
    predicted_price_krw: int
    expected_auction_price_krw: int
    liquidation_rate: float
    model_loaded: bool
