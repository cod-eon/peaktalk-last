import subprocess

import pytest

from app.models.document import FileType
from app.services import parser


def test_parse_file_routes_legacy_doc_to_antiword(monkeypatch: pytest.MonkeyPatch) -> None:
    completed = subprocess.CompletedProcess(
        args=["antiword"], returncode=0, stdout="Legacy DOC text\n", stderr=""
    )
    calls: list[list[str]] = []

    def fake_run(args, **kwargs):
        calls.append(args)
        assert kwargs["timeout"] == 30
        assert kwargs["check"] is False
        return completed

    monkeypatch.setattr(parser.subprocess, "run", fake_run)

    result = parser.parse_file(b"legacy-doc", FileType.other, "brief.doc")

    assert result.text == "Legacy DOC text"
    assert calls and calls[0][0:3] == ["antiword", "-m", "UTF-8.txt"]


def test_parse_legacy_doc_reports_missing_runtime_dependency(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def missing_binary(*args, **kwargs):
        raise FileNotFoundError("antiword")

    monkeypatch.setattr(parser.subprocess, "run", missing_binary)

    with pytest.raises(parser.DocumentParseError, match="antiword"):
        parser.parse_file(b"legacy-doc", FileType.other, "brief.doc")
