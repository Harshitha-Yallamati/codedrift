from app.analysis.complexity import compute_complexity

PY_SNIPPET = """
def process(items):
    total = 0
    for item in items:
        if item.valid:
            try:
                total += item.value
            except ValueError:
                continue
        elif item.skip:
            continue
        else:
            total -= 1
    return total
"""

JS_SNIPPET = """
function process(items) {
    let total = 0;
    for (const item of items) {
        if (item.valid) {
            total += item.value;
        } else if (item.skip) {
            continue;
        }
    }
    return total;
}
"""


def test_python_uses_ast():
    result = compute_complexity("src/app/processor.py", PY_SNIPPET)
    assert result.method == "ast"
    assert result.complexity > 1
    assert result.loc > 0


def test_non_python_uses_heuristic():
    result = compute_complexity("src/app/processor.js", JS_SNIPPET)
    assert result.method == "heuristic"
    assert result.complexity >= 1
