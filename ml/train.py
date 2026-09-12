"""
AquaIQ — Water Stress Index Regression Model Trainer
=====================================================
Features (X):
  - groundwater_level  : depth to groundwater in meters below ground level (BGL)
  - rainfall_inv       : inverse of annual rainfall (1/mm) — lower rainfall = higher stress
  - source_encoded     : 0=surface, 1=mixed, 2=groundwater (ordinal: dependency on GW)

Target (y):
  - stress_index       : 0.0 (no stress) – 1.0 (critical)

Training data: seeded 40 district records from prisma/seed.ts + WRI Aqueduct supplement.
"""

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import MinMaxScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# ── Training data (matches prisma/seed.ts districts) ────────────────────────
# Columns: gw_level, rainfall, source_encoded, stress_index
# source: surface=0, mixed=1, groundwater=2
DATA = np.array([
    # gw_level  rainfall  source  stress_index
    [  12.3,      722,     1,     0.45],   # Pune
    [  18.7,      684,     2,     0.61],   # Nashik
    [  24.1,      498,     2,     0.78],   # Aurangabad
    [  31.5,      421,     2,     0.87],   # Latur
    [  38.4,      312,     2,     0.82],   # Jaipur
    [  52.6,      198,     2,     0.94],   # Jodhpur
    [  61.2,      145,     2,     0.97],   # Bikaner
    [  22.9,      527,     0,     0.68],   # Kota
    [  28.3,     1400,     1,     0.76],   # Chennai
    [  15.1,      718,     0,     0.52],   # Coimbatore
    [  19.8,      864,     2,     0.65],   # Madurai
    [  22.4,      982,     1,     0.71],   # Bengaluru
    [   9.2,     1102,     0,     0.38],   # Mysuru
    [  27.6,      541,     2,     0.80],   # Kalaburagi
    [  16.3,      820,     1,     0.57],   # Tumkur
    # Gujarat
    [  28.5,      782,     1,     0.72],   # Ahmedabad
    [  12.1,      932,     0,     0.44],   # Surat
    [  18.4,      871,     1,     0.58],   # Vadodara
    [  34.2,      420,     2,     0.83],   # Rajkot
    [  56.8,      210,     2,     0.95],   # Kutch
    # Uttar Pradesh
    [  22.3,      895,     1,     0.65],   # Lucknow
    [  27.8,      841,     2,     0.74],   # Kanpur
    [  31.2,      665,     2,     0.79],   # Agra
    [  18.6,      980,     1,     0.61],   # Varanasi
    [  24.5,      788,     2,     0.69],   # Meerut
    # Andhra Pradesh
    [  14.8,     1020,     0,     0.51],   # Vijayawada
    [  11.2,     1050,     0,     0.42],   # Visakhapatnam
    [  22.7,      880,     2,     0.68],   # Guntur
    [  35.4,      552,     2,     0.84],   # Kurnool
    [  41.3,      374,     2,     0.91],   # Anantapur
    # West Bengal
    [   8.4,     1670,     0,     0.35],   # Kolkata
    [   9.1,     1620,     0,     0.37],   # Howrah
    [  16.8,     1380,     1,     0.54],   # Asansol
    [   7.3,     2400,     0,     0.22],   # Siliguri
    [  12.4,     1450,     0,     0.45],   # Midnapore
    # Kerala
    [   6.8,     1750,     0,     0.30],   # Thiruvananthapuram
    [   5.2,     3200,     0,     0.19],   # Kochi
    [   7.1,     2900,     0,     0.24],   # Kozhikode
    [   9.8,     2100,     1,     0.36],   # Thrissur
    # Haryana
    [  32.1,      715,     2,     0.81],   # Gurugram
    [  28.9,      688,     2,     0.76],   # Faridabad
    [  45.3,      390,     2,     0.92],   # Hisar
    [  38.7,      480,     2,     0.86],   # Rohtak
    [  18.4,      890,     1,     0.60],   # Ambala
], dtype=float)

# Build feature matrix: [gw_level, 1/rainfall, source_encoded]
gw_level       = DATA[:, 0]
rainfall_inv   = 1.0 / DATA[:, 1]
source_encoded = DATA[:, 2]
stress_index   = DATA[:, 3]

X = np.column_stack([gw_level, rainfall_inv, source_encoded])
y = stress_index

# ── Pipeline: scale + linear regression ─────────────────────────────────────
pipeline = Pipeline([
    ("scaler", MinMaxScaler()),
    ("model",  LinearRegression()),
])

# Cross-validation
scores_r2  = cross_val_score(pipeline, X, y, cv=5, scoring="r2")
scores_mae = cross_val_score(pipeline, X, y, cv=5, scoring="neg_mean_absolute_error")

print("── Cross-Validation Results ─────────────────────────────────────────")
print(f"  R²  mean={scores_r2.mean():.4f}  std={scores_r2.std():.4f}")
print(f"  MAE mean={(-scores_mae.mean()):.4f}  std={scores_mae.std():.4f}")

# Final fit on full data
pipeline.fit(X, y)
y_pred = pipeline.predict(X)
print(f"\n── Full-data fit ────────────────────────────────────────────────────")
print(f"  R²  = {r2_score(y, y_pred):.4f}")
print(f"  MAE = {mean_absolute_error(y, y_pred):.4f}")

# ── Save model ───────────────────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(__file__), "model.pkl")
joblib.dump(pipeline, out_path)
print(f"\n✅ Model saved to {out_path}")
