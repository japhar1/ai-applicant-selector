import os
import tempfile
from typing import Tuple
from docx import Document
from PyPDF2 import PdfReader

def extract_text_from_pdf(path: str) -> str:
    text = ""
    try:
        reader = PdfReader(path)
        for page in reader.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
    except Exception as e:
        print("PDF parse error:", e)
    return text

def extract_text_from_docx(path: str) -> str:
    text = ""
    try:
        doc = Document(path)
        for p in doc.paragraphs:
            if p.text:
                text += p.text + "\n"
    except Exception as e:
        print("DOCX parse error:", e)
    return text

def extract_text_from_file_bytes(filename: str, content: bytes) -> Tuple[str, str]:
    ext = filename.split(".")[-1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    text = ""
    if ext == "pdf":
        text = extract_text_from_pdf(tmp_path)
    elif ext in ("docx", "doc"):
        text = extract_text_from_docx(tmp_path)
    elif ext in ("txt", "csv"):
        try:
            text = content.decode("utf-8", errors="ignore")
        except:
            text = ""
    else:
        try:
            text = content.decode("utf-8", errors="ignore")
        except:
            text = ""

    try:
        os.remove(tmp_path)
    except:
        pass

    return text, ext
