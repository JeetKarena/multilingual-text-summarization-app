# LLM Model/text_processor.py
"""
Module for processing text before and after summarization.
"""

import re
from typing import List, Dict, Any

def preprocess_text(text: str) -> str:
    """
    Clean and prepare text for summarization.
    
    Args:
        text: Raw text to preprocess
        
    Returns:
        Preprocessed text
    """
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters that might confuse the model
    text = re.sub(r'[^\w\s.,!?;:\-\'"\(\)\[\]]', ' ', text)
    
    # Ensure proper spacing after punctuation
    text = re.sub(r'([.,!?;:])\s*', r'\1 ', text)
    
    return text.strip()

def split_into_chunks(text: str, chunk_size: int = 4000) -> List[str]:
    """
    Split text into chunks of appropriate size.
    
    Args:
        text: Text to split
        chunk_size: Maximum size of each chunk
        
    Returns:
        List of text chunks
    """
    # Try to split at paragraph boundaries
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        if len(current_chunk) + len(paragraph) < chunk_size:
            current_chunk += paragraph + "\n\n"
        else:
            # If current chunk is not empty, add it to chunks
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = paragraph + "\n\n"
    
    # Add the last chunk if not empty
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks

def postprocess_summary(summary: str) -> str:
    """
    Clean and improve the generated summary.
    
    Args:
        summary: Raw generated summary
        
    Returns:
        Improved summary
    """
    # Remove redundant sentences
    sentences = re.split(r'(?<=[.!?])\s+', summary)
    unique_sentences = []
    
    for sentence in sentences:
        # Skip very short sentences
        if len(sentence) < 5:
            continue
            
        # Check if sentence is too similar to any previous one
        is_duplicate = False
        for existing in unique_sentences:
            if similarity(sentence, existing) > 0.7:
                is_duplicate = True
                break
                
        if not is_duplicate:
            unique_sentences.append(sentence)
    
    # Join unique sentences
    clean_summary = ' '.join(unique_sentences)
    
    # Fix common issues
    clean_summary = re.sub(r'\s+', ' ', clean_summary)  # Remove extra spaces
    clean_summary = re.sub(r'\s([.,;:!?])', r'\1', clean_summary)  # Fix punctuation
    
    return clean_summary

def similarity(s1: str, s2: str) -> float:
    """
    Calculate simple similarity between two strings.
    
    Args:
        s1: First string
        s2: Second string
        
    Returns:
        Similarity score (0.0 to 1.0)
    """
    # Convert to lowercase and split into words
    words1 = set(s1.lower().split())
    words2 = set(s2.lower().split())
    
    # Calculate Jaccard similarity
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    
    return intersection / union if union > 0 else 0.0