"""CSV/PDF export of a repository's latest file-risk analysis."""

import csv
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.file_metric import FileMetric
from app.models.repository import Repository


def export_csv(repository: Repository, files: list[FileMetric]) -> io.BytesIO:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "file_path",
            "language",
            "risk_category",
            "defect_probability",
            "churn",
            "commit_frequency",
            "bug_fix_frequency",
            "file_age_days",
            "loc",
            "cyclomatic_complexity",
            "developer_count",
            "coupling_score",
        ]
    )
    for f in files:
        rp = f.risk_prediction
        writer.writerow(
            [
                f.file_path,
                f.language or "",
                rp.risk_category if rp else "",
                f"{rp.defect_probability:.4f}" if rp else "",
                f.churn,
                f.commit_frequency,
                f.bug_fix_frequency,
                f.file_age_days,
                f.loc,
                f.cyclomatic_complexity,
                f.developer_count,
                f.coupling_score,
            ]
        )
    out = io.BytesIO(buffer.getvalue().encode("utf-8"))
    out.seek(0)
    return out


def export_pdf(repository: Repository, files: list[FileMetric], health_score: float) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.6 * inch, bottomMargin=0.6 * inch)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph(f"CodeDrift Report — {repository.full_name}", styles["Title"]),
        Paragraph(f"Codebase Health Score: {health_score:.1f} / 100", styles["Heading2"]),
        Spacer(1, 0.2 * inch),
    ]

    sorted_files = sorted(
        [f for f in files if f.risk_prediction],
        key=lambda f: f.risk_prediction.defect_probability,
        reverse=True,
    )[:40]

    data = [["File", "Risk", "Probability", "Churn", "Complexity"]]
    for f in sorted_files:
        rp = f.risk_prediction
        data.append([f.file_path, rp.risk_category, f"{rp.defect_probability:.0%}", str(f.churn), f"{f.cyclomatic_complexity:.1f}"])

    table = Table(data, repeatRows=1, colWidths=[3.2 * inch, 0.9 * inch, 1.1 * inch, 0.8 * inch, 1.0 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e1b4b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
            ]
        )
    )
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer
