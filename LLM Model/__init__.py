# LLM Model/__init__.py
"""
LLM Model package for text summarization.
This package provides utilities for working with language models
for multilingual text summarization.
"""

from .model_loader import load_model, get_supported_languages
from .langchain_integration import create_langchain_pipeline
from .text_processor import preprocess_text, postprocess_summary
from .multilingual_handler import translate_text, detect_language