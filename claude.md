# CLAUDE.md

## Response Language

* Always respond in Korean.
* Keep explanations concise and practical.
* Do not over-explain unless I ask for detailed reasoning.
* Prefer direct answers, commands, and changed file summaries.

## Token Saving Rules

* Do not repeat the same explanation.
* Do not print huge code blocks unless necessary.
* When editing files, summarize the change first.
* Only show full code when I explicitly ask.
* Avoid long background explanations.
* If a command is needed, give the exact command only.
* If there are multiple options, recommend one best option first.

## Project Goal

This is a real estate price prediction project.

Make the project deployable without breaking the existing training code.

## Deployment Requirements

* Use FastAPI.
* Add a deployment API that loads the saved joblib model.
* Do not retrain the model during deployment.
* Keep the original training workflow intact.
* Add these endpoints:

  * `GET /health`
  * `POST /predict`

## Model

Use the saved model:

```text
ai_training/outputs_coord_test/xgb_price_unit_ensemble_model.joblib
```

Check whether this joblib file is:

1. a full preprocessing + model pipeline, or
2. only the trained estimator.

If it is only the estimator, reuse or save the exact same preprocessing used during training. Do not guess feature order manually.

## Output Format

The prediction API should return:

```json
{
  "predicted_price_manwon": 78200,
  "predicted_price_text": "7억 8,200만원"
}
```

## Files to Add if Needed

* `app.py`
* `requirements.txt`
* `README.md`
* `.gitignore`

## Run Commands

Local run:

```bash
uvicorn app:app --reload
```

Render deployment:

```text
Build Command:
pip install -r requirements.txt

Start Command:
uvicorn app:app --host 0.0.0.0 --port $PORT
```

## Final Response Format

After making changes, answer in Korean with:

```text
변경한 파일:
- ...

실행 방법:
- ...

주의할 점:
- ...
```

Keep the final explanation short.
