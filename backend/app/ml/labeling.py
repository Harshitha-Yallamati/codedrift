"""Training-label derivation using a temporal split.

To avoid the tautology of predicting "has this file ever had a bug fix"
from "has this file ever had a bug fix", training uses two non-overlapping
windows of a repository's commit history:

  - a *feature window* (older commits) used to compute churn/complexity/
    bug-fix-frequency/etc. per file, exactly as the live prediction path
    does, and
  - a *label window* (the more recent commits) used only to decide
    whether each file was touched by a bug-fix commit *after* the feature
    snapshot was taken.

A file is labeled bug-prone (1) if a bug-fix commit in the label window
touches it. This mirrors real defect-prediction setups: "given what we
knew about this file up to time T, was it involved in a bug shortly
after?" The live risk score then applies the trained model to features
computed from the *entire* history (the most current snapshot).
"""


def build_labels_from_future_touches(
    feature_window_files: list[str],
    label_window_bugfix_files: set[str],
) -> list[int]:
    return [1 if path in label_window_bugfix_files else 0 for path in feature_window_files]
