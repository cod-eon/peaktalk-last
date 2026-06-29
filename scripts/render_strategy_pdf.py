#!/usr/bin/env python3
"""Render the PeakTalk strategy markdown report into a styled PDF."""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "peaktalk-strategy-deep-analysis-2026-06-09.md"
OUTPUT = ROOT / "docs" / "peaktalk-strategy-deep-analysis-2026-06-09.pdf"

INK = colors.HexColor("#111827")
STEEL = colors.HexColor("#73706A")
LINE = colors.HexColor("#D9D5CC")
PAPER = colors.HexColor("#FAF8F4")
EMBER = colors.HexColor("#E8600A")
VIOLET = colors.HexColor("#8B5CF6")
WHITE = colors.white


def register_fonts() -> None:
    candidates = [
        ("/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
        ("/Library/Fonts/Arial Unicode.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    ]
    for regular, bold in candidates:
        if Path(regular).exists() and Path(bold).exists():
            pdfmetrics.registerFont(TTFont("PeakSans", regular))
            pdfmetrics.registerFont(TTFont("PeakSans-Bold", bold))
            pdfmetrics.registerFontFamily("PeakSans", normal="PeakSans", bold="PeakSans-Bold")
            return
    raise RuntimeError("No suitable Cyrillic-capable font found.")


def inline(text: str) -> str:
    text = re.sub(r"\s*₽", " руб.", text)
    text = text.replace("руб..", "руб.")
    text = html.escape(text.strip())
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(
        r"`([^`]+)`",
        r'<font name="PeakSans-Bold" color="#111827">\1</font>',
        text,
    )
    return text


class CoverPage(Flowable):
    def __init__(self, title: str, subtitle: str) -> None:
        super().__init__()
        self.title = title
        self.subtitle = subtitle
        self.width, self.height = A4

    def wrap(self, avail_width: float, avail_height: float) -> tuple[float, float]:
        return avail_width, avail_height

    def draw(self) -> None:
        c = self.canv
        w, h = A4
        c.saveState()
        # The flowable is placed inside the document frame; translate back to
        # page coordinates so the cover can draw full-bleed without clipping.
        c.translate(-18 * mm, -20 * mm)
        c.setFillColor(INK)
        c.rect(-3 * cm, -3 * cm, w + 6 * cm, h + 6 * cm, fill=True, stroke=False)

        # Industrial grid.
        c.setStrokeColor(colors.Color(1, 1, 1, alpha=0.06))
        c.setLineWidth(0.35)
        step = 18 * mm
        x = 0
        while x < w:
            c.line(x, 0, x, h)
            x += step
        y = 0
        while y < h:
            c.line(0, y, w, y)
            y += step

        c.setFillColor(EMBER)
        c.rect(0, h - 34 * mm, w, 7 * mm, fill=True, stroke=False)
        c.rect(22 * mm, 42 * mm, 7 * mm, 78 * mm, fill=True, stroke=False)
        c.setStrokeColor(EMBER)
        c.setLineWidth(2)
        c.line(22 * mm, 126 * mm, w - 22 * mm, 126 * mm)

        c.setFont("PeakSans-Bold", 12)
        c.setFillColor(colors.Color(1, 1, 1, alpha=0.6))
        c.drawString(24 * mm, h - 24 * mm, "PEAKTALK / STRATEGY DOSSIER")

        text = c.beginText(24 * mm, h - 62 * mm)
        text.setFont("PeakSans-Bold", 30)
        text.setFillColor(WHITE)
        text.setLeading(36)
        for line in ["Глубокий", "продуктово-", "бизнесовый", "анализ"]:
            text.textLine(line)
        c.drawText(text)

        c.setFont("PeakSans", 12)
        c.setFillColor(colors.Color(1, 1, 1, alpha=0.72))
        sub = c.beginText(38 * mm, 110 * mm)
        sub.setLeading(17)
        for line in [
            "Модель, рынок, боль, pricing,",
            "стратегия запуска и функциональные",
            "доработки PeakTalk.",
        ]:
            sub.textLine(line)
        c.drawText(sub)

        c.setFillColor(PAPER)
        c.roundRect(38 * mm, 48 * mm, w - 62 * mm, 38 * mm, 0, fill=True, stroke=False)
        c.setFillColor(INK)
        c.setFont("PeakSans-Bold", 12)
        c.drawString(44 * mm, 73 * mm, "Главный вердикт")
        c.setFont("PeakSans", 10.5)
        c.setFillColor(STEEL)
        verdict = c.beginText(44 * mm, 65 * mm)
        verdict.setLeading(14)
        for line in [
            "Строить стоит только узко: B2P meeting defense",
            "для реального рабочего материала и конкретного",
            "оппонента. Generic EdTech и AI-coach надо резать.",
        ]:
            verdict.textLine(line)
        c.drawText(verdict)

        c.setFont("PeakSans", 9)
        c.setFillColor(colors.Color(1, 1, 1, alpha=0.45))
        c.drawString(24 * mm, 25 * mm, "Дата: 09 июня 2026")
        c.drawRightString(w - 24 * mm, 25 * mm, "AI-стресс-тест аргументов перед рабочей встречей")
        c.restoreState()


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "Body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="PeakSans",
            fontSize=9.4,
            leading=13.2,
            textColor=INK,
            spaceAfter=5,
            alignment=TA_LEFT,
        ),
        "Small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="PeakSans",
            fontSize=8,
            leading=11,
            textColor=STEEL,
        ),
        "H1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="PeakSans-Bold",
            fontSize=21,
            leading=25,
            textColor=INK,
            spaceBefore=4,
            spaceAfter=10,
        ),
        "H2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="PeakSans-Bold",
            fontSize=15,
            leading=19,
            textColor=INK,
            spaceBefore=8,
            spaceAfter=8,
            borderWidth=0,
            borderPadding=0,
        ),
        "H3": ParagraphStyle(
            "H3",
            parent=base["Heading3"],
            fontName="PeakSans-Bold",
            fontSize=11.5,
            leading=15,
            textColor=EMBER,
            spaceBefore=8,
            spaceAfter=5,
        ),
        "Bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="PeakSans",
            fontSize=9.1,
            leading=12.8,
            leftIndent=14,
            firstLineIndent=-8,
            textColor=INK,
            spaceAfter=3.5,
        ),
        "Quote": ParagraphStyle(
            "Quote",
            parent=base["BodyText"],
            fontName="PeakSans-Bold",
            fontSize=11,
            leading=15,
            leftIndent=12,
            rightIndent=10,
            textColor=INK,
            spaceBefore=4,
            spaceAfter=4,
        ),
        "TOC": ParagraphStyle(
            "TOC",
            parent=base["BodyText"],
            fontName="PeakSans",
            fontSize=9.5,
            leading=13,
            textColor=INK,
            spaceAfter=3,
        ),
        "CoverKicker": ParagraphStyle(
            "CoverKicker",
            parent=base["BodyText"],
            fontName="PeakSans-Bold",
            fontSize=9,
            leading=11,
            textColor=EMBER,
            alignment=TA_CENTER,
        ),
        "Decision": ParagraphStyle(
            "Decision",
            parent=base["BodyText"],
            fontName="PeakSans-Bold",
            fontSize=10.3,
            leading=14,
            textColor=INK,
        ),
    }


def section_band(title: str, styles: dict[str, ParagraphStyle]) -> Table:
    table = Table(
        [[Paragraph(inline(title), styles["H1"])]],
        colWidths=[16.5 * cm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                ("BOX", (0, 0), (-1, -1), 0.8, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        ),
    )
    return table


def callout(text: str, styles: dict[str, ParagraphStyle], accent=EMBER) -> Table:
    table = Table(
        [[Paragraph(inline(text), styles["Quote"])]],
        colWidths=[16.2 * cm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF7ED")),
                ("LINEBEFORE", (0, 0), (0, -1), 3.0, accent),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#FED7AA")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        ),
    )
    return table


def decision_page(styles: dict[str, ParagraphStyle]) -> list:
    cards = [
        ("Модель", "B2P self-serve для ближайшей рабочей встречи, затем team packs и selective B2B SMB pilots."),
        ("Боль", "Не учиться говорить лучше, а найти слабые места позиции до CFO, клиента, инвестора или совета."),
        ("Pricing", "299 ₽ оставить как launch-price. Основной paid SKU после теста — Meeting Defense Pack 990–1490 ₽."),
        ("P0", "Честные 3 guest-вопроса, paywall на покупку подготовки, Defense Brief, trust layer, analytics events."),
        ("Kill logic", "Через 90 дней без 1–2 платящих сценариев с повтором и team interest — pivot, а не расширение."),
    ]
    rows = []
    for title, body in cards:
        rows.append(
            [
                Paragraph(f"<font color='#E8600A'><b>{html.escape(title)}</b></font>", styles["Decision"]),
                Paragraph(inline(body), styles["Body"]),
            ]
        )
    table = Table(
        rows,
        colWidths=[3.4 * cm, 13.1 * cm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PAPER),
                ("BOX", (0, 0), (-1, -1), 0.8, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        ),
    )
    return [
        section_band("Короткое решение", styles),
        Spacer(1, 8),
        callout(
            "PeakTalk стоит строить только как event-driven pressure-testing engine для реального рабочего документа и реального оппонента. Generic EdTech, soft skills и AI-coach позиционирование надо резать.",
            styles,
            accent=EMBER,
        ),
        Spacer(1, 12),
        table,
        PageBreak(),
    ]


def extract_toc(markdown_text: str) -> list[str]:
    toc = []
    for line in markdown_text.splitlines():
        if line.startswith("## ") and not line.startswith("### "):
            title = line[3:].strip()
            if title and title not in {"1. Жесткий вердикт"}:
                toc.append(title)
    return toc


def toc_page(markdown_text: str, styles: dict[str, ParagraphStyle]) -> list:
    story = [section_band("Навигация", styles), Spacer(1, 8)]
    for index, title in enumerate(extract_toc(markdown_text), 1):
        clean_title = re.sub(r"^\d+\.\s*", "", title)
        story.append(Paragraph(f"{index:02d}. {inline(clean_title)}", styles["TOC"]))
    story.append(PageBreak())
    return story


def parse_markdown(markdown_text: str, styles: dict[str, ParagraphStyle]) -> list:
    story = []
    paragraph_lines: list[str] = []
    quote_lines: list[str] = []
    first_h2 = True

    def flush_paragraph() -> None:
        nonlocal paragraph_lines
        if paragraph_lines:
            text = " ".join(part.strip() for part in paragraph_lines if part.strip())
            if text:
                story.append(Paragraph(inline(text), styles["Body"]))
            paragraph_lines = []

    def flush_quote() -> None:
        nonlocal quote_lines
        if quote_lines:
            text = " ".join(q.strip() for q in quote_lines if q.strip())
            story.append(callout(text, styles))
            quote_lines = []

    for raw in markdown_text.splitlines():
        line = raw.rstrip()
        stripped = line.strip()

        if not stripped:
            flush_paragraph()
            flush_quote()
            story.append(Spacer(1, 2))
            continue

        if stripped == "---":
            flush_paragraph()
            flush_quote()
            story.append(Spacer(1, 4))
            story.append(HRFlowable(width="100%", thickness=0.6, color=LINE, spaceBefore=3, spaceAfter=7))
            continue

        if stripped.startswith("# "):
            # The cover already carries the document title.
            flush_paragraph()
            flush_quote()
            continue

        if stripped.startswith("## "):
            flush_paragraph()
            flush_quote()
            title = stripped[3:].strip()
            if not first_h2:
                story.append(PageBreak())
            first_h2 = False
            story.append(section_band(title, styles))
            story.append(Spacer(1, 7))
            continue

        if stripped.startswith("### "):
            flush_paragraph()
            flush_quote()
            story.append(Paragraph(inline(stripped[4:].strip()), styles["H2"]))
            continue

        if stripped.startswith(">"):
            flush_paragraph()
            quote_lines.append(stripped.lstrip(">").strip())
            continue

        bullet_match = re.match(r"^(\s*)[-*]\s+(.+)$", line)
        numbered_match = re.match(r"^\s*(\d+)\.\s+(.+)$", line)
        if bullet_match:
            flush_paragraph()
            flush_quote()
            content = bullet_match.group(2)
            story.append(Paragraph(f"• {inline(content)}", styles["Bullet"]))
            continue
        if numbered_match and len(numbered_match.group(2)) > 0:
            flush_paragraph()
            flush_quote()
            story.append(Paragraph(f"{numbered_match.group(1)}. {inline(numbered_match.group(2))}", styles["Bullet"]))
            continue

        paragraph_lines.append(stripped)

    flush_paragraph()
    flush_quote()
    return story


def draw_page(canvas, doc) -> None:
    page = canvas.getPageNumber()
    if page == 1:
        return
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, height - 14 * mm, width - doc.rightMargin, height - 14 * mm)
    canvas.setFont("PeakSans-Bold", 7.5)
    canvas.setFillColor(EMBER)
    canvas.drawString(doc.leftMargin, height - 10 * mm, "PEAKTALK / STRATEGY ANALYSIS")
    canvas.setFont("PeakSans", 7.5)
    canvas.setFillColor(STEEL)
    canvas.drawRightString(width - doc.rightMargin, height - 10 * mm, "09.06.2026")
    canvas.setStrokeColor(LINE)
    canvas.line(doc.leftMargin, 14 * mm, width - doc.rightMargin, 14 * mm)
    canvas.setFont("PeakSans", 8)
    canvas.setFillColor(STEEL)
    canvas.drawString(doc.leftMargin, 9 * mm, "AI-стресс-тест аргументов перед рабочей встречей")
    canvas.drawRightString(width - doc.rightMargin, 9 * mm, str(page - 1))
    canvas.restoreState()


def build_pdf(source: Path = SOURCE, output: Path = OUTPUT) -> None:
    register_fonts()
    markdown_text = source.read_text(encoding="utf-8")
    styles = make_styles()

    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=22 * mm,
        bottomMargin=20 * mm,
        title="PeakTalk — глубокий продуктово-бизнесовый анализ",
        author="Codex",
    )

    story = [
        CoverPage(
            "PeakTalk — глубокий продуктово-бизнесовый анализ",
            "Модель, рынок, боль, pricing, запуск и roadmap.",
        ),
        PageBreak(),
    ]
    story.extend(decision_page(styles))
    story.extend(toc_page(markdown_text, styles))
    story.extend(parse_markdown(markdown_text, styles))
    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)


if __name__ == "__main__":
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else SOURCE
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else OUTPUT
    build_pdf(src, out)
    print(out)
