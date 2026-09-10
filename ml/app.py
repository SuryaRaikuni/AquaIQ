"""
AquaIQ — Water Stress Prediction Flask Microservice
====================================================
Endpoint: POST /predict
Payload:  { "groundwater_level": float, "rainfall_avg": float, "source_type": "groundwater"|"mixed"|"surface" }
Response: { "stress_index": float, "stress_label": str, "confidence": float }

Run:
  pip install -r requirements.txt
  python train.py        # generates model.pkl
  python app.py          # starts server on :5001
"""

from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# ── Load model ───────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")
    else:
        print("⚠️  model.pkl not found — run python train.py first")

SOURCE_MAP = {"surface": 0, "mixed": 1, "groundwater": 2}

def stress_label(idx: float) -> str:
    if idx < 0.35: return "Low"
    if idx < 0.55: return "Low-Moderate"
    if idx < 0.70: return "Moderate"
    if idx < 0.85: return "High"
    return "Critical"

# ── Routes ───────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})

@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded. Run python train.py first."}), 503

    body = request.get_json(force=True, silent=True)
    if not body:
        return jsonify({"error": "Invalid JSON body"}), 400

    try:
        gw_level    = float(body["groundwater_level"])
        rainfall    = float(body["rainfall_avg"])
        source      = str(body.get("source_type", "mixed")).lower()
    except (KeyError, ValueError) as e:
        return jsonify({"error": f"Missing or invalid field: {e}"}), 400

    if rainfall <= 0:
        return jsonify({"error": "rainfall_avg must be positive"}), 400

    source_enc  = SOURCE_MAP.get(source, 1)   # default: mixed
    rainfall_inv = 1.0 / rainfall
    X = np.array([[gw_level, rainfall_inv, source_enc]])

    raw = float(model.predict(X)[0])
    stress_idx = max(0.0, min(1.0, raw))   # clamp to [0, 1]

    # Simple confidence heuristic: how far from 0.5 (centre of range)
    confidence = round(min(1.0, 0.5 + abs(stress_idx - 0.5)), 3)

    return jsonify({
        "stress_index": round(stress_idx, 4),
        "stress_label": stress_label(stress_idx),
        "confidence":   confidence,
    })

# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    load_model()
    app.run(host="0.0.0.0", port=5001, debug=False)
