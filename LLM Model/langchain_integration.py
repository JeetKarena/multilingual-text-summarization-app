# LLM Model/langchain_integration.py
"""
Module for integrating models with LangChain.
"""

from typing import Dict, Any, Optional
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.llms import HuggingFacePipeline

from .model_loader import load_model

def create_langchain_pipeline(
    model_name: str = "facebook/mbart-large-cc25",
    language: str = "en",
    prompt_template: str = "Summarize the following text: {text}",
    device: str = None,
    model_kwargs: Dict[str, Any] = None
) -> LLMChain:
    """
    Create a LangChain pipeline for summarization.
    
    Args:
        model_name: Hugging Face model name
        language: Language code
        prompt_template: Template for LangChain prompt
        device: Device to load model on
        model_kwargs: Additional kwargs for the model
        
    Returns:
        LangChain chain for summarization
    """
    # Set defaults for model_kwargs
    if model_kwargs is None:
        model_kwargs = {
            "max_length": 150,
            "min_length": 40,
            "do_sample": False
        }
    
    # Load the model components
    _, _, summarization_pipeline = load_model(
        model_name=model_name,
        language=language,
        device=device
    )
    
    # Create a HuggingFacePipeline for LangChain
    llm = HuggingFacePipeline(pipeline=summarization_pipeline)
    
    # Create a prompt template
    prompt = PromptTemplate(
        input_variables=["text"],
        template=prompt_template
    )
    
    # Create and return the LangChain
    chain = LLMChain(llm=llm, prompt=prompt)
    return chain

def generate_with_langchain(
    chain: LLMChain, 
    text: str,
    return_only_outputs: bool = True
) -> str:
    """
    Generate a summary using a LangChain pipeline.
    
    Args:
        chain: LangChain pipeline
        text: Text to summarize
        return_only_outputs: Whether to return only the output text
        
    Returns:
        Generated summary
    """
    result = chain({"text": text}, return_only_outputs=return_only_outputs)
    
    if return_only_outputs:
        return result['text']
    return result