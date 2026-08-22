"""Churn, commit-frequency, bug-fix-frequency, age, and developer-count
metrics derived purely from a repository's commit history (no cloning
required — commit history already carries per-file add/delete stats from
the GitHub API's commit-detail endpoint).
"""

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class FileTouch:
    sha: str
    author: str
    committed_at: datetime
    additions: int
    deletions: int
    is_bug_fix: bool


@dataclass
class FileHistory:
    touches: list[FileTouch] = field(default_factory=list)

    @property
    def churn(self) -> int:
        return sum(t.additions + t.deletions for t in self.touches)

    @property
    def commit_frequency(self) -> int:
        return len(self.touches)

    @property
    def bug_fix_frequency(self) -> int:
        return sum(1 for t in self.touches if t.is_bug_fix)

    @property
    def developer_count(self) -> int:
        return len({t.author for t in self.touches})

    def age_days(self, as_of: datetime) -> int:
        if not self.touches:
            return 0
        first = min(t.committed_at for t in self.touches)
        return max((as_of - first).days, 0)


def build_file_histories(
    commit_files: list[tuple[str, list[str], "FileTouch"]],
) -> dict[str, FileHistory]:
    """commit_files: list of (commit_sha, [file_paths], FileTouch) tuples."""
    histories: dict[str, FileHistory] = defaultdict(FileHistory)
    for _sha, file_paths, touch in commit_files:
        for path in file_paths:
            histories[path].touches.append(touch)
    return histories
