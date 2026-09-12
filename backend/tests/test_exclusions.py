import pytest

from app.analysis.exclusions import is_excluded_path


@pytest.mark.parametrize(
    "path,expected",
    [
        ("frontend/package-lock.json", True),
        ("backend/poetry.lock", True),
        ("frontend/node_modules/react/index.js", True),
        ("backend/alembic/versions/0001_initial.py", True),
        ("frontend/dist/assets/index.min.js", True),
        ("backend/app/services/analysis_service.py", False),
        ("frontend/src/App.tsx", False),
        ("README.md", False),
    ],
)
def test_is_excluded_path(path: str, expected: bool) -> None:
    assert is_excluded_path(path) is expected
