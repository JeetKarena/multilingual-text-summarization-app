# LLM Model/multilingual_handler.py
"""
Module for handling multilingual text and translations.
"""

from typing import Optional
import re

# Dictionary of common words to help detect languages
LANGUAGE_MARKERS = {
    "en": ["the", "and", "of", "to", "in", "that", "for"],
    "fr": ["le", "la", "et", "des", "les", "en", "du"],
    "es": ["el", "la", "que", "de", "y", "en", "los"],
    "de": ["der", "die", "und", "in", "den", "von", "zu"],
    "it": ["il", "la", "che", "di", "e", "per", "un"],
    "pt": ["o", "a", "de", "que", "e", "do", "da"],
    "nl": ["de", "het", "een", "in", "van", "en", "voor"],
    "ru": ["и", "в", "на", "что", "с", "по", "не"],
    "zh": ["的", "是", "了", "在", "和", "有", "个"],
    "ja": ["の", "に", "は", "を", "た", "が", "で"],
    "ko": ["의", "에", "을", "를", "이", "가", "는"],
    "ar": ["و", "في", "من", "على", "إلى", "أن", "عن"],
    "hi": ["के", "में", "है", "की", "और", "का", "को"],
}

def detect_language(text: str, min_confidence: float = 0.3) -> str:
    """
    Detect the language of a text.
    
    Args:
        text: Text to analyze
        min_confidence: Minimum confidence required
        
    Returns:
        ISO language code (defaults to 'en' if detection fails)
    """
    # Normalize text
    sample = text[:5000].lower()  # Take a sample to improve performance
    words = re.findall(r'\b\w+\b', sample)
    
    if not words:
        return "en"
    
    # Count occurrences of language markers
    lang_scores = {lang: 0 for lang in LANGUAGE_MARKERS}
    
    for word in words:
        for lang, markers in LANGUAGE_MARKERS.items():
            if word in markers:
                lang_scores[lang] += 1
    
    # Calculate scores as percentages
    total_markers = sum(lang_scores.values())
    if total_markers == 0:
        return "en"
        
    for lang in lang_scores:
        lang_scores[lang] /= total_markers
    
    # Get the language with highest score
    best_lang = max(lang_scores, key=lang_scores.get)
    confidence = lang_scores[best_lang]
    
    # Return best match if confidence is high enough
    if confidence >= min_confidence:
        return best_lang
    return "en"  # Default to English

def translate_text(
    text: str, 
    source_language: Optional[str] = None,
    target_language: str = "en"
) -> str:
    """
    Translate text between languages using a pre-trained model.
    
    Args:
        text: Text to translate
        source_language: Source language (auto-detect if None)
        target_language: Target language
        
    Returns:
        Translated text
    """
    # This is a placeholder - in production, you would integrate with a
    # translation model or service like Helsinki-NLP/opus-mt models
    
    # For now, return the original text with a note
    if source_language is None:
        source_language = detect_language(text)
        
    if source_language == target_language:
        return text
        
    # In a real implementation, you'd call a translation service here
    return f"[Translation from {source_language} to {target_language}] {text[:100]}..."