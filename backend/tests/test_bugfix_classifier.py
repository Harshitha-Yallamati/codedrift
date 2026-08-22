import pytest

from app.analysis.bugfix_classifier import is_bug_fix_commit

CASES = [
    ("fix: resolve null pointer in checkout", True),
    ("fix(auth): correct token refresh bug", True),
    ("Fixed crash on empty cart", True),
    ("hotfix for production outage", True),
    ("patch race condition in webhook delivery", True),
    ("feat: add pagination to orders API", False),
    ("refactor: simplify payment gateway client", False),
    ("docs: update README", False),
    ("add prefix to filenames for clarity", False),
    ("chore: bump dependency versions", False),
]


@pytest.mark.parametrize("message,expected", CASES)
def test_is_bug_fix_commit(message: str, expected: bool):
    assert is_bug_fix_commit(message) is expected
