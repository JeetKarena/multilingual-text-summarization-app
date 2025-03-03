# BackEnd/app/api/endpoints/documents.py
import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Form
from bson.objectid import ObjectId
from datetime import datetime

from app.api.endpoints.auth import get_current_user
from app.core.config import settings
from app.db.session import get_collection
from app.db.base import DocumentModel
from app.models.document_parser import extract_text_from_file

router = APIRouter()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)

@router.post("/upload/", response_model=DocumentModel)
async def upload_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Create a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIRECTORY, unique_filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # Extract text from file using our parser
        extraction_result = extract_text_from_file(file_path)
        content = extraction_result["content"]
        metadata = extraction_result["metadata"]
        
        # Save document metadata to MongoDB
        documents_collection = get_collection("documents")
        document = {
            "title": title,
            "content": content,
            "file_path": file_path,
            "mime_type": file.content_type,
            "user_id": str(current_user["_id"]),
            "metadata": metadata,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await documents_collection.insert_one(document)
        
        # Get the created document
        created_document = await documents_collection.find_one({"_id": result.inserted_id})
        created_document["_id"] = str(created_document["_id"])
        
        return created_document
        
    except Exception as e:
        # Delete the saved file if parsing failed
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not process the document: {str(e)}"
        )

@router.get("/", response_model=List[DocumentModel])
async def get_documents(current_user: dict = Depends(get_current_user)):
    documents_collection = get_collection("documents")
    cursor = documents_collection.find({"user_id": str(current_user["_id"])})
    documents = await cursor.to_list(length=100)
    
    # Convert ObjectId to string
    for doc in documents:
        doc["_id"] = str(doc["_id"])
    
    return documents

@router.get("/{document_id}", response_model=DocumentModel)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    documents_collection = get_collection("documents")
    document = await documents_collection.find_one({
        "_id": ObjectId(document_id),
        "user_id": str(current_user["_id"])
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    document["_id"] = str(document["_id"])
    return document

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    documents_collection = get_collection("documents")
    document = await documents_collection.find_one({
        "_id": ObjectId(document_id),
        "user_id": str(current_user["_id"])
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete file if exists
    if document.get("file_path") and os.path.exists(document["file_path"]):
        os.remove(document["file_path"])
    
    # Delete from database
    await documents_collection.delete_one({"_id": ObjectId(document_id)})
    
    return {"message": "Document deleted successfully"}