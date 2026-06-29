#!/usr/bin/env python3
"""Render the practical PeakTalk strategy report into a clean PDF."""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
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
SOURCE = ROOT / "docs" / "peaktalk-practical-strategy-report-2026-06-09.md"
OUTPUT = ROOT / "docs" / "peaktalk-practical-strategy-report-2026-06-09.pdf"

INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#6F6A61")
LIGHT = colors.HexColor("#F6F2EA")
LINE = colors.HexColor("#D8D1C5")
EMBER = colors.HexColor("#E8600A")
PALE_ORANGE = colors.HexColor("#FFF3E8")
WHITE = colors.white


def register_fonts() -> None:
    candidates = [
        (
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ),
        (
            "/Library/Fonts/Arial Unicode.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ),
    ]
    for regular, bold in candidates:
        if Path(regular).exists() and Path(bold).exists():
            pdfmetrics.registerFont(TTFont("DocSans", regular))
            pdfmetrics.registerFont(TTFont("DocSans-Bold", bold))
            pdfmetrics.registerFontFamily("DocSans", normal="DocSans", bold="DocSans-Bold")
            return
    raise RuntimeError("No Cyrillic-capable font found.")


def inline(text: str) -> str:
    text = html.escape(text.strip())
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r"<b>\1</b>", text)
    return text


class CoverPage(Flowable):
    def wrap(self, avail_width: float, avail_height: float) -> tuple[float, float]:
        return avail_width, avail_height

    def draw(self) -> None:
        c = self.canv
        w, h = A4
        c.saveState()
        c.translate(-19 * mm, -19 * mm)
        c.setFillColor(colors.HexColor("#FBFAF7"))
        c.rect(0, 0, w, h, fill=True, stroke=False)

        c.setFillColor(EMBER)
        c.rect(0, 0, 10 * mm, h, fill=True, stroke=False)
        c.setFillColor(LIGHT)
        c.rect(10 * mm, h - 48 * mm, w - 10 * mm, 48 * mm, fill=True, stroke=False)

        c.setFillColor(EMBER)
        c.setFont("DocSans-Bold", 11)
        c.drawString(24 * mm, h - 25 * mm, "PEAKTALK")
        c.setFillColor(MUTED)
        c.setFont("DocSans", 9)
        c.drawRightString(w - 24 * mm, h - 25 * mm, "9 июня 2026")

        c.setFillColor(INK)
        c.setFont("DocSans-Bold", 34)
        title = c.beginText(24 * mm, h - 78 * mm)
        title.setLeading(39)
        title.textLine("Что делать")
        title.textLine("дальше")
        c.drawText(title)

        c.setFont("DocSans", 13)
        c.setFillColor(MUTED)
        subtitle = c.beginText(24 * mm, h - 128 * mm)
        subtitle.setLeading(18)
        subtitle.textLine("Рабочий отчет по модели, цене, продукту")
        subtitle.textLine("и запуску. Без общей болтовни.")
        c.drawText(subtitle)

        c.setStrokeColor(LINE)
        c.setLineWidth(0.8)
        c.line(24 * mm, h - 150 * mm, w - 24 * mm, h - 150 * mm)

        c.setFillColor(PALE_ORANGE)
        c.roundRect(24 * mm, h - 220 * mm, w - 48 * mm, 48 * mm, 2, fill=True, stroke=False)
        c.setFillColor(EMBER)
        c.rect(24 * mm, h - 220 * mm, 4 * mm, 48 * mm, fill=True, stroke=False)
        c.setFillColor(INK)
        c.setFont("DocSans-Bold", 13)
        c.drawString(33 * mm, h - 188 * mm, "Решение")
        c.setFont("DocSans", 10.5)
        note = c.beginText(33 * mm, h - 202 * mm)
        note.setLeading(15)
        note.textLine("Продавать не обучение общению, а разбор одной")
        note.textLine("реальной встречи. Первый товар: полный разбор")
        note.textLine("рабочей позиции за 990 рублей.")
        c.drawText(note)

        c.setFillColor(MUTED)
        c.setFont("DocSans", 9)
        c.drawString(24 * mm, 24 * mm, "Подготовлено по коду PeakTalk, AGENTS.md и отчету по конкурентам.")
        c.restoreState()


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "Body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="DocSans",
            fontSize=9.6,
            leading=13.4,
            textColor=INK,
            spaceAfter=6,
        ),
        "Small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="DocSans",
            fontSize=8.2,
            leading=11.2,
            textColor=MUTED,
            spaceAfter=4,
        ),
        "H2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="DocSans-Bold",
            fontSize=16.5,
            leading=21,
            textColor=INK,
            spaceBefore=11,
            spaceAfter=8,
            keepWithNext=True,
        ),
        "H3": ParagraphStyle(
            "H3",
            parent=base["Heading3"],
            fontName="DocSans-Bold",
            fontSize=11.2,
            leading=14.5,
            textColor=EMBER,
            spaceBefore=9,
            spaceAfter=4,
            keepWithNext=True,
        ),
        "Bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="DocSans",
            fontSize=9.3,
            leading=12.8,
            leftIndent=13,
            firstLineIndent=-7,
            spaceAfter=3.5,
            textColor=INK,
        ),
        "Number": ParagraphStyle(
            "Number",
            parent=base["BodyText"],
            fontName="DocSans",
            fontSize=9.3,
            leading=12.8,
            leftIndent=15,
            firstLineIndent=-11,
            spaceAfter=3.8,
            textColor=INK,
        ),
        "Quote": ParagraphStyle(
            "Quote",
            parent=base["BodyText"],
            fontName="DocSans-Bold",
            fontSize=11,
            leading=15,
            textColor=INK,
        ),
        "TableHead": ParagraphStyle(
            "TableHead",
            parent=base["BodyText"],
            fontName="DocSans-Bold",
            fontSize=9.3,
            leading=12,
            textColor=EMBER,
        ),
        "TableBody": ParagraphStyle(
            "TableBody",
            parent=base["BodyText"],
            fontName="DocSans",
            fontSize=8.8,
            leading=12,
            textColor=INK,
        ),
    }


def callout(text: str, styles: dict[str, ParagraphStyle]) -> Table:
    table = Table(
        [[Paragraph(inline(text), styles["Quote"])]],
        colWidths=[16.3 * cm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE_ORANGE),
                ("LINEBEFORE", (0, 0), (0, -1), 3, EMBER),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#F4C38F")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        ),
    )
    return table


def decision_page(styles: dict[str, ParagraphStyle]) -> list:
    rows = [
        ("Строить", "Разбор позиции перед конкретной рабочей встречей. Один материал, один оппонент, понятная памятка."),
        ("Не строить", "Тренажер речи, помощник по уверенности, широкое обучение общению, игровые механики."),
        ("Первый товар", "Полный разбор одной встречи за 990 рублей. Бесплатно только три вопроса и краткий список слабых мест."),
        ("Первые сценарии", "Бюджет, план продукта, инвестор, сложный клиент, спор о цене или закупке."),
        ("Первый канал", "Личные приглашения людям с ближайшей встречей. Не широкая реклама и не мероприятия для отделов обучения."),
        ("Главная проверка", "Пользователь вставляет настоящий материал и платит после первых трех вопросов."),
    ]
    table_rows = [
        [Paragraph(inline(left), styles["TableHead"]), Paragraph(inline(right), styles["TableBody"])]
        for left, right in rows
    ]
    table = Table(
        table_rows,
        colWidths=[3.7 * cm, 12.6 * cm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FBFAF7")),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        ),
    )
    return [
        Paragraph("Сначала решение", styles["H2"]),
        Paragraph(
            "Этот лист нужен, чтобы не потеряться в деталях. Если команда запомнит только его, стратегия уже станет яснее.",
            styles["Body"],
        ),
        table,
        PageBreak(),
    ]


def parse_markdown(markdown_text: str, styles: dict[str, ParagraphStyle]) -> list:
    story: list = []
    paragraph_lines: list[str] = []
    quote_lines: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph_lines
        if paragraph_lines:
            text = " ".join(line.strip() for line in paragraph_lines if line.strip())
            if text:
                story.append(Paragraph(inline(text), styles["Body"]))
            paragraph_lines = []

    def flush_quote() -> None:
        nonlocal quote_lines
        if quote_lines:
            text = " ".join(line.strip() for line in quote_lines if line.strip())
            story.append(KeepTogether([callout(text, styles), Spacer(1, 5)]))
            quote_lines = []

    skip_meta = True
    for raw in markdown_text.splitlines():
        line = raw.rstrip()
        stripped = line.strip()

        if stripped.startswith("# "):
            continue

        if skip_meta and (stripped.startswith("Дата:") or stripped.startswith("Формат:") or stripped.startswith("Использованы:")):
            continue
        if stripped:
            skip_meta = False

        if not stripped:
            flush_paragraph()
            flush_quote()
            story.append(Spacer(1, 1.5))
            continue

        if stripped.startswith("## "):
            flush_paragraph()
            flush_quote()
            story.append(Spacer(1, 3))
            story.append(HRFlowable(width="100%", thickness=0.5, color=LINE, spaceBefore=1, spaceAfter=7))
            story.append(Paragraph(inline(stripped[3:].strip()), styles["H2"]))
            continue

        if stripped.startswith("### "):
            flush_paragraph()
            flush_quote()
            story.append(Paragraph(inline(stripped[4:].strip()), styles["H3"]))
            continue

        if stripped.startswith(">"):
            flush_paragraph()
            quote_lines.append(stripped.lstrip(">").strip())
            continue

        bullet_match = re.match(r"^[-*]\s+(.+)$", stripped)
        number_match = re.match(r"^(\d+)\.\s+(.+)$", stripped)
        if bullet_match:
            flush_paragraph()
            flush_quote()
            story.append(Paragraph(f"• {inline(bullet_match.group(1))}", styles["Bullet"]))
            continue
        if number_match:
            flush_paragraph()
            flush_quote()
            story.append(
                Paragraph(
                    f"{number_match.group(1)}. {inline(number_match.group(2))}",
                    styles["Number"],
                )
            )
            continue

        paragraph_lines.append(stripped)

    flush_paragraph()
    flush_quote()
    return story


def draw_page(canvas, doc) -> None:
    page = canvas.getPageNumber()
    if page == 1:
        return
    width, height = A4
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, height - 13 * mm, width - doc.rightMargin, height - 13 * mm)
    canvas.setFont("DocSans-Bold", 7.8)
    canvas.setFillColor(EMBER)
    canvas.drawString(doc.leftMargin, height - 9.5 * mm, "PEAKTALK")
    canvas.setFont("DocSans", 7.8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - doc.rightMargin, height - 9.5 * mm, "рабочий отчет / 09.06.2026")
    canvas.line(doc.leftMargin, 14 * mm, width - doc.rightMargin, 14 * mm)
    canvas.setFont("DocSans", 8)
    canvas.drawString(doc.leftMargin, 9 * mm, "Проверка рабочей позиции перед встречей")
    canvas.drawRightString(width - doc.rightMargin, 9 * mm, str(page - 1))
    canvas.restoreState()


def build_pdf(source: Path = SOURCE, output: Path = OUTPUT) -> None:
    register_fonts()
    styles = make_styles()
    markdown_text = source.read_text(encoding="utf-8")

    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=19 * mm,
        rightMargin=19 * mm,
        topMargin=21 * mm,
        bottomMargin=20 * mm,
        title="PeakTalk. Что делать дальше",
        author="Codex",
    )

    story = [CoverPage(), PageBreak()]
    story.extend(decision_page(styles))
    story.extend(parse_markdown(markdown_text, styles))
    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)


if __name__ == "__main__":
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else SOURCE
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else OUTPUT
    build_pdf(src, out)
    print(out)
