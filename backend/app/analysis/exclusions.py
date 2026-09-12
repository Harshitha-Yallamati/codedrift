"""Files that shouldn't enter defect-risk analysis at all: lockfiles and
other machine-generated artifacts carry enormous line churn from a single
tool invocation (e.g. `npm install` rewriting package-lock.json) with zero
relationship to actual code defect risk. Left unfiltered, one such file's
extreme churn skews the heuristic's min-max normalization for every real
source file in the same run. Excluded paths are dropped before metrics are
even computed, not just hidden from the results.
"""

import re

_EXCLUDED_FILENAMES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
    "pipfile.lock",
    "gemfile.lock",
    "composer.lock",
    "cargo.lock",
    "go.sum",
}

_EXCLUDED_PATH_PATTERNS = [
    re.compile(r"(^|/)node_modules/"),
    re.compile(r"(^|/)dist/"),
    re.compile(r"(^|/)build/"),
    re.compile(r"(^|/)vendor/"),
    re.compile(r"(^|/)\.venv/"),
    re.compile(r"(^|/)venv/"),
    re.compile(r"(^|/)__pycache__/"),
    re.compile(r"(^|/)alembic/versions/"),
    re.compile(r"\.min\.(js|css)$"),
    re.compile(r"\.(lock|snap)$"),
    re.compile(r"(^|/)\.git/"),
]


def is_excluded_path(path: str) -> bool:
    filename = path.rsplit("/", 1)[-1].lower()
    if filename in _EXCLUDED_FILENAMES:
        return True
    return any(pattern.search(path) for pattern in _EXCLUDED_PATH_PATTERNS)
