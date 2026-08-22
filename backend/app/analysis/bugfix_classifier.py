import re

_BUGFIX_PATTERNS = [
    r"\bfix(e[sd])?\b",
    r"\bbug\b",
    r"\bissue\b",
    r"\bcrash(e[sd])?\b",
    r"\bhotfix\b",
    r"\bpatch(e[sd])?\b",
    r"\bregression\b",
    r"\bdefect\b",
    r"\berror\b",
    r"\bfail(ure|ing)?\b",
    r"^fix(\(.+\))?:",  # conventional commits "fix:" / "fix(scope):"
]

_COMPILED = re.compile("|".join(_BUGFIX_PATTERNS), re.IGNORECASE)

_EXCLUDE_PATTERNS = re.compile(r"\b(prefix|suffix|fixture|fixtures|traffic)\b", re.IGNORECASE)


def is_bug_fix_commit(message: str) -> bool:
    """Heuristic classification of a commit message as a bug-fix commit.

    Used both to label commits for display and to derive ML training labels
    (a file is considered historically bug-prone if it was touched by one of
    these commits).
    """
    if not message:
        return False
    first_line = message.strip().splitlines()[0]
    cleaned = _EXCLUDE_PATTERNS.sub("", first_line)
    return bool(_COMPILED.search(cleaned))
