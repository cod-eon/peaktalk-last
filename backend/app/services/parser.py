import io
import os
import subprocess
import tempfile
import time

from app.models.document import FileType

PARSE_TIME_THRESHOLD_SECONDS = 30


class ParseResult:
    def __init__(self, text: str, elapsed_seconds: float) -> None:
        self.text = text
        self.elapsed_seconds = elapsed_seconds

    @property
    def was_slow(self) -> bool:
        return self.elapsed_seconds >= PARSE_TIME_THRESHOLD_SECONDS


class DocumentParseError(ValueError):
    """Raised when a supported document cannot be converted to text."""


def parse_pdf(file_bytes: bytes) -> ParseResult:
    from pypdf import PdfReader

    start = time.monotonic()
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(pages).strip()
    elapsed = time.monotonic() - start
    return ParseResult(text=text, elapsed_seconds=elapsed)


def parse_docx(file_bytes: bytes) -> ParseResult:
    from docx import Document

    start = time.monotonic()
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    text = "\n".join(paragraphs).strip()
    elapsed = time.monotonic() - start
    return ParseResult(text=text, elapsed_seconds=elapsed)


def parse_doc(file_bytes: bytes) -> ParseResult:
    """Extract plain text from a legacy binary .doc file with antiword."""
    start = time.monotonic()
    try:
        with tempfile.NamedTemporaryFile(prefix="peaktalk-", suffix=".doc") as source:
            source.write(file_bytes)
            source.flush()
            completed = subprocess.run(
                ["antiword", "-m", "UTF-8.txt", source.name],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=30,
                check=False,
                env={
                    **os.environ,
                    "ANTIWORDHOME": "/usr/share/antiword",
                    "LC_ALL": "C.UTF-8",
                },
            )
    except FileNotFoundError as exc:
        raise DocumentParseError(
            "Для разбора legacy DOC не установлен antiword. Обратитесь к администратору."
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise DocumentParseError(
            "Разбор DOC занял слишком много времени. Попробуйте сохранить файл как DOCX."
        ) from exc

    if completed.returncode != 0:
        raise DocumentParseError(
            "Не удалось разобрать DOC. Проверьте файл или сохраните его как DOCX."
        )

    return ParseResult(text=completed.stdout.strip(), elapsed_seconds=time.monotonic() - start)


def parse_file(file_bytes: bytes, file_type: FileType, filename: str) -> ParseResult:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        return parse_pdf(file_bytes)
    elif ext == "docx":
        return parse_docx(file_bytes)
    elif ext == "doc":
        return parse_doc(file_bytes)
    else:
        # Attempt plain text
        start = time.monotonic()
        try:
            text = file_bytes.decode("utf-8", errors="replace").strip()
        except Exception:
            text = ""
        return ParseResult(text=text, elapsed_seconds=time.monotonic() - start)
