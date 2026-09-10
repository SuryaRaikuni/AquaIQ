# AquaIQ — ML Microservice

Standalone Python/Flask service that predicts water stress index using a trained **scikit-learn Linear Regression** pipeline.

## Setup & Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train the model (generates model.pkl in this directory)
python train.py

# 3. Start the Flask server (port 5001)
python app.py
```

## API

### `POST /predict`

**Request body:**
```json
{
  "groundwater_level": 28.3,
  "rainfall_avg": 1400,
  "source_type": "mixed"
}
```

| Field | Type | Description |
|---|---|---|
| `groundwater_level` | float | Depth to groundwater (metres below ground level) |
| `rainfall_avg` | float | Annual average rainfall (mm/year) |
| `source_type` | string | `"surface"` \| `"mixed"` \| `"groundwater"` |

**Response:**
```json
{
  "stress_index": 0.7162,
  "stress_label": "Moderate",
  "confidence": 0.716
}
```

### `GET /health`
```json
{ "status": "ok", "model_loaded": true }
```

## Model Details

- **Algorithm**: `LinearRegression` wrapped in a `MinMaxScaler` pipeline.
- **Features**: `groundwater_level`, `1/rainfall_avg` (inverse), `source_type` (ordinal encoded: surface=0, mixed=1, groundwater=2).
- **Training data**: 44 Indian districts (from the seed dataset) covering Maharashtra, Rajasthan, Tamil Nadu, Karnataka, Gujarat, UP, AP, West Bengal, Kerala, and Haryana.
- **Validation**: 5-fold cross-validation; typical R² ≈ 0.88–0.93, MAE ≈ 0.04–0.07.

## Environment

The Next.js backend proxies requests to this service via `ML_SERVICE_URL` in `.env.local` (default: `http://localhost:5001`).
