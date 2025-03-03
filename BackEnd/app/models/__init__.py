# BackEnd/app/models/__init__.py
from .summarization import generate_summary, generate_summary_with_langchain, detect_language
from .document_parser import extract_text_from_file