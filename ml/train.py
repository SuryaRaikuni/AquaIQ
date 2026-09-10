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
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import MinMaxScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# ── Training data (matches prisma/seed.ts districts) ────────────────────────
DATA = [
    # name,             gw_level, rainfall, source,        stress_index
    ("Pune",                12.3,      722,  "mixed",            0.45),
    ("Nashik",              18.7,      684,  "groundwater",      0.61),
    ("Aurangabad",          24.1,      498,  "groundwater",      0.78),
    ("Latur",               31.5,      421,  "groundwater",      0.87),
    ("Jaipur",              38.4,      312,  "groundwater",      0.82),
    ("Jodhpur",             52.6,      198,  "groundwater",      0.94),
    ("Bikaner",             61.2,      145,  "groundwater",      0.97),
    ("Kota",                22.9,      527,  "surface",          0.68),
    ("Chennai",             28.3,     1400,  "mixed",            0.76),
    ("Coimbatore",          15.1,      718,  "surface",          0.52),
    ("Madurai",             19.8,      864,  "groundwater",      0.65),
    ("Bengaluru",           22.4,      982,  "mixed",            0.71),
    ("Mysuru",               9.2,     1102,  "surface",          0.38),
    ("Kalaburagi",          27.6,      541,  "groundwater",      0.80),
    ("Tumkur",              16.3,      820,  "mixed",            0.57),
    # Gujarat (new)
    ("Ahmedabad",           28.5,      782,  "mixed",            0.72),
    ("Surat",               12.1,      932,  "surface",          0.44),
    ("Vadodara",            18.4,      871,  "mixed",            0.58),
    ("Rajkot",              34.2,      420,  "groundwater",      0.83),
    ("Kutch",               56.8,      210,  "groundwater",      0.95),
    # Uttar Pradesh (new)
    ("Lucknow",             22.3,      895,  "mixed",            0.65),
    ("Kanpur",              27.8,      841,  "groundwater",      0.74),
    ("Agra",                31.2,      665,  "groundwater",      0.79),
    ("Varanasi",            18.6,      980,  "mixed",            0.61),
    ("Meerut",              24.5,      788,  "groundwater",      0.69),
    # Andhra Pradesh (new)
    ("Vijayawada",          14.8,     1020,  "surface",          0.51),
    ("Visakhapatnam",       11.2,     1050,  "surface",          0.42),
    ("Guntur",              22.7,      880,  "groundwater",      0.68),
    ("Kurnool",             35.4,      552,  "groundwater",      0.84),
    ("Anantapur",           41.3,      374,  "groundwater",      0.91),
    # West Bengal (new)
    ("Kolkata",              8.4,     1670,  "surface",          0.35),
    ("Howrah",               9.1,     1620,  "surface",          0.37),
    ("Asansol",             16.8,     1380,  "mixed",            0.54),
    ("Siliguri",             7.3,     2400,  "surface",          0.22),
    ("Midnapore",           12.4,     1450,  "surface",          0.45),
    # Kerala (new)
    ("Thiruvananthapuram",   6.8,     1750,  "surface",          0.30),
    ("Kochi",                5.2,     3200,  "surface",          0.19),
    ("Kozhikode",            7.1,     2900,  "surface",          0.24),
    ("Thrissur",             9.8,     2100,  "mixed",            0.36),
    # Haryana (new)
    ("Gurugram",            32.1,      715,  "groundwater",      0.81),
    ("Faridabad",           28.9,      688,  "groundwater",      0.76),
    ("Hisar",               45.3,      390,  "groundwater",      0.92),
    ("Rohtak",              38.7,      480,  "groundwater",      0.86),
    ("Ambala",              18.4,      890,  "mixed",            0.60),
]

SOURCE_MAP = {"surface": 0, "mixed": 1, "groundwater": 2}

df = pd.DataFrame(DATA, columns=["name", "gw_level", "rainfall", "source", "stress_index"])
df["source_encoded"] = df["source"].map(SOURCE_MAP)
df["rainfall_inv"]   = 1.0 / df["rainfall"]

X = df[["gw_level", "rainfall_inv", "source_encoded"]].values
y = df["stress_index"].values

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
