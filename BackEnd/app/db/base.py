# BackEnd/app/db/base.py
from bson import ObjectId
from pydantic import BaseModel, ConfigDict, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from typing import Annotated, Any, Optional, List, Dict
from datetime import datetime

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(str(v)):
            raise ValueError("Invalid ObjectId")
        return ObjectId(str(v))

    @classmethod
    def __get_pydantic_json_schema__(
        cls, _schema_cache: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {
            "type": "string",
            "pattern": "^[a-f0-9]{24}$",
            "examples": ["507f1f77bcf86cd799439011"],
        }

class MongoBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[Annotated[PyObjectId, "The document ID"]] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    def dict(self, *args, **kwargs):
        """Convert to dict with _id handling."""
        kwargs.pop('by_alias', None)
        kwargs['exclude_unset'] = True
        
        dictionary = super().model_dump(*args, **kwargs)
        
        # Convert id to _id for MongoDB
        if dictionary.get("id"):
            dictionary["_id"] = dictionary.pop("id")
        
        return dictionary

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