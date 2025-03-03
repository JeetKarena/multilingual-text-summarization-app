# BackEnd/app/api/endpoints/summarization.py
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body, status
from bson.objectid import ObjectId
from datetime import datetime
from pydantic import BaseModel

from app.api.endpoints.auth import get_current_user
from app.core.config import settings
from app.db.session import get_collection

# Import your LLM model functions here (to be implemented in LLM Model directory)
from app.models.summarization import generate_summary

router = APIRouter()

class TextSummarizationRequest(BaseModel):
    text: str
    language: str = "en"
    max_length: int = 150

class DocumentSummarizationRequest(BaseModel):
    document_id: str
    max_length: int = 150

@router.post("/text/")
async def summarize_text(
    request: TextSummarizationRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        summary = await generate_summary(
            text=request.text,
            language=request.language,
            max_length=request.max_length
        )
        
        # Store the summary in the database
        summaries_collection = get_collection("summaries")
        summary_data = {
            "original_text": request.text,
            "summary_text": summary,
            "user_id": str(current_user["_id"]),
            "language": request.language,
            "model_used": settings.DEFAULT_MODEL,
            "created_at": datetime.utcnow()
        }
        await summaries_collection.insert_one(summary_data)
        
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating summary: {str(e)}"
        )

@router.post("/document/")
async def summarize_document(
    request: DocumentSummarizationRequest,
    current_user: dict = Depends(get_current_user)
):
    # Get the document
    documents_collection = get_collection("documents")
    document = await documents_collection.find_one({
        "_id": ObjectId(request.document_id),
        "user_id": str(current_user["_id"])
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    try:
        # Generate summary
        summary = await generate_summary(
            text=document["content"],
            max_length=request.max_length
        )
        
        # Update document with summary
        await documents_collection.update_one(
            {"_id": ObjectId(request.document_id)},
            {"$set": {"summary": summary, "updated_at": datetime.utcnow()}}
        )
        
        # Store summary in summaries collection
        summaries_collection = get_collection("summaries")
        summary_data = {
            "document_id": request.document_id,
            "original_text": document["content"],
            "summary_text": summary,
            "user_id": str(current_user["_id"]),
            "language": document.get("language", "en"),
            "model_used": settings.DEFAULT_MODEL,
            "created_at": datetime.utcnow()
        }
        await summaries_collection.insert_one(summary_data)
        
        return {
            "document_id": request.document_id,
            "title": document["title"],
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating summary: {str(e)}"
        )

@router.get("/history/")
async def get_summary_history(current_user: dict = Depends(get_current_user)):
    summaries_collection = get_collection("summaries")
    cursor = summaries_collection.find({"user_id": str(current_user["_id"])})
    summaries = await cursor.to_list(length=100)
    
    # Convert ObjectId to string
    for summary in summaries:
        summary["_id"] = str(summary["_id"])
        
    return summaries