from typing import Optional
from app.db.base import MongoBaseModel
from datetime import datetime

class DocumentModel(MongoBaseModel):
    title: str
    content: str
    user_id: PyObjectId
    file_path: Optional[str] = None
    mime_type: Optional[str] = None
    language: Optional[str] = "en"
    
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "title": "Sample Document",
                "content": "This is a sample document content",
                "user_id": "507f1f77bcf86cd799439011",
                "file_path": "/uploads/sample.pdf",
                "mime_type": "application/pdf",
                "language": "en"
            }
        }
    )