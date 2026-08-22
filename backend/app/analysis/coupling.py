"""File coupling: how often a file changes together with other files in the
same commit. High coupling means a file rarely changes in isolation, which
correlates with hidden cross-file dependencies and higher defect risk.
"""

from collections import defaultdict


def compute_coupling_scores(commit_file_lists: list[list[str]]) -> dict[str, float]:
    """commit_file_lists: for each commit, the list of file paths it touched.

    Returns a 0..1 coupling score per file: the average fraction of its
    co-changing commits that also touched at least one other file.
    """
    co_change_commits: dict[str, int] = defaultdict(int)
    total_commits: dict[str, int] = defaultdict(int)

    for files in commit_file_lists:
        if not files:
            continue
        multi_file = len(files) > 1
        for f in files:
            total_commits[f] += 1
            if multi_file:
                co_change_commits[f] += 1

    scores: dict[str, float] = {}
    for f, total in total_commits.items():
        scores[f] = round(co_change_commits[f] / total, 3) if total else 0.0
    return scores
