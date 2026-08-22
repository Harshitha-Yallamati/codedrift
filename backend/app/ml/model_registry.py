"""Versioned model storage: trained XGBoost boosters are persisted to disk
(joblib) keyed by repository id and analysis-run id, so historical analysis
runs remain reproducible/inspectable even after a repo is re-analyzed with
a newer model.
"""

import os
from pathlib import Path

import joblib
from xgboost import XGBClassifier

MODEL_DIR = Path(os.environ.get("MODEL_STORAGE_DIR", "/data/models"))


def _ensure_dir() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def model_path(repository_id: int, run_id: int) -> Path:
    return MODEL_DIR / f"repo_{repository_id}_run_{run_id}.joblib"


def save_model(repository_id: int, run_id: int, model: XGBClassifier) -> str:
    _ensure_dir()
    path = model_path(repository_id, run_id)
    joblib.dump(model, path)
    return str(path)


def load_model(repository_id: int, run_id: int) -> XGBClassifier | None:
    path = model_path(repository_id, run_id)
    if not path.exists():
        return None
    return joblib.load(path)
