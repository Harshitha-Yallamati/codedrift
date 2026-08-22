"""Cyclomatic complexity estimation.

Python files get real AST-based complexity via the stdlib `ast` module
(counting branching nodes, equivalent to the standard McCabe formula).
Other languages fall back to a documented heuristic that counts
branching-keyword density per line, since full AST parsing for every
language would require a parser toolchain per language. Both paths are
labelled on the returned result (`method`) so the UI can be transparent
about which one was used.
"""

import ast
import re
from dataclasses import dataclass

_BRANCH_KEYWORDS = re.compile(
    r"\b(if|else if|elif|for|foreach|while|case|catch|except|&&|\|\||\?\s*:|switch)\b"
)

PY_EXTENSIONS = {".py"}
LANGUAGE_BY_EXT = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".java": "Java",
    ".go": "Go",
    ".rb": "Ruby",
    ".php": "PHP",
    ".c": "C",
    ".cpp": "C++",
    ".cs": "C#",
    ".rs": "Rust",
    ".swift": "Swift",
    ".kt": "Kotlin",
}


@dataclass
class ComplexityResult:
    complexity: float
    loc: int
    method: str  # "ast" | "heuristic"


class _McCabeVisitor(ast.NodeVisitor):
    def __init__(self) -> None:
        self.complexity = 1

    def _bump(self, node: ast.AST) -> None:
        self.complexity += 1
        self.generic_visit(node)

    visit_If = _bump
    visit_For = _bump
    visit_AsyncFor = _bump
    visit_While = _bump
    visit_ExceptHandler = _bump
    visit_With = _bump
    visit_AsyncWith = _bump
    visit_Assert = _bump
    visit_BoolOp = _bump
    visit_comprehension = _bump

    def visit_FunctionDef(self, node: ast.AST) -> None:
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef


def detect_language(file_path: str) -> str | None:
    for ext, lang in LANGUAGE_BY_EXT.items():
        if file_path.endswith(ext):
            return lang
    return None


def compute_complexity(file_path: str, content: str) -> ComplexityResult:
    loc = len([line for line in content.splitlines() if line.strip()])

    if any(file_path.endswith(ext) for ext in PY_EXTENSIONS):
        try:
            tree = ast.parse(content)
            total = 0
            functions = 0
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    visitor = _McCabeVisitor()
                    visitor.visit(node)
                    total += visitor.complexity
                    functions += 1
            if functions == 0:
                visitor = _McCabeVisitor()
                visitor.visit(tree)
                total = visitor.complexity
                functions = 1
            return ComplexityResult(complexity=round(total / functions, 2), loc=loc, method="ast")
        except SyntaxError:
            pass

    matches = len(_BRANCH_KEYWORDS.findall(content))
    heuristic_complexity = 1 + (matches / max(loc, 1)) * 10
    return ComplexityResult(complexity=round(heuristic_complexity, 2), loc=loc, method="heuristic")
