import io
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


def parse_file(file_bytes: bytes, file_type: FileType, filename: str) -> ParseResult:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        return parse_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return parse_docx(file_bytes)
    else:
        # Attempt plain text
        start = time.monotonic()
        try:
            text = file_bytes.decode("utf-8", errors="replace").strip()
        except Exception:
            text = ""
        return ParseResult(text=text, elapsed_seconds=time.monotonic() - start)
