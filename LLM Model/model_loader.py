# LLM Model/model_loader.py
"""
Module for loading and managing LLM models for text summarization.
"""

import os
import torch
from typing import Dict, Any, Tuple, List
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

# Cache for loaded models
_loaded_models = {}

def get_supported_languages() -> List[str]:
    """
    Get list of supported language codes.
    
    Returns:
        List of ISO language codes supported by the model.
    """
    # Languages supported by mbart-large-cc25
    return [
        "en", "de", "fr", "es", "it", "zh", "ja", "ko", "ru", 
        "pt", "nl", "ar", "hi", "tr", "pl", "vi", "th"
    ]

def load_model(
    model_name: str = "facebook/mbart-large-cc25",
    language: str = "en", 
    device: str = None,
    cache: bool = True
) -> Tuple[Any, Any, Any]:
    """
    Load a model for text summarization.
    
    Args:
        model_name: Hugging Face model name
        language: Language code
        device: Device to load the model on ('cpu', 'cuda', or None for auto)
        cache: Whether to cache the model for future use
        
    Returns:
        Tuple of (tokenizer, model, summarization_pipeline)
    """
    # Generate a cache key
    cache_key = f"{model_name}_{language}"
    
    # Check if model is already loaded
    if cache and cache_key in _loaded_models:
        return _loaded_models[cache_key]
    
    # Determine device
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Print loading info
    print(f"Loading model {model_name} for language {language} on {device}...")
    
    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(device)
    
    # Configure for the specific language
    if hasattr(tokenizer, 'src_lang') and language != "en":
        tokenizer.src_lang = language
    
    # Create summarization pipeline
    summarizer = pipeline(
        "summarization", 
        model=model, 
        tokenizer=tokenizer,
        device=0 if device == "cuda" else -1
    )
    
    # Cache the models if requested
    if cache:
        _loaded_models[cache_key] = (tokenizer, model, summarizer)
    
    return tokenizer, model, summarizer

def unload_model(model_name: str = None, language: str = None):
    """
    Unload models from cache to free up memory.
    
    Args:
        model_name: Specific model name to unload (or None for all)
        language: Specific language to unload (or None for all)
    """
    global _loaded_models
    
    # Unload specific model
    if model_name and language:
        cache_key = f"{model_name}_{language}"
        if cache_key in _loaded_models:
            del _loaded_models[cache_key]
            torch.cuda.empty_cache()  # Free up CUDA memory
            print(f"Unloaded model {model_name} for {language}")
    # Unload all models
    else:
        _loaded_models = {}
        torch.cuda.empty_cache()
        print("Unloaded all models")