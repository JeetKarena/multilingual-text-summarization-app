# BackEnd/app/db/base.py
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
        
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class MongoBaseModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat(),
        }
        allow_population_by_field_name = True

class UserModel(MongoBaseModel):
    email: str
    hashed_password: str
    is_active: bool = True
    is_superuser: bool = False

class DocumentModel(MongoBaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    file_path: Optional[str] = None
    mime_type: Optional[str] = None
    user_id: str
    language: Optional[str] = "en"
    tags: List[str] = []
    metadata: Dict[str, Any] = {}

class SummaryModel(MongoBaseModel):
    document_id: str
    original_text: str
    summary_text: str
    user_id: str
    language: str = "en"
    model_used: str