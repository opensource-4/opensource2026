# AI Price Prediction API

FastAPI service that loads the XGBoost ensemble model created from `train (1).ipynb`.

## Run

Place the trained model at:

```text
ai_api/models/xgb_price_unit_ensemble_model.joblib
```

Then start the API:

```bash
cd ai_api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Spring Boot calls `POST http://localhost:8000/predict-price`.
