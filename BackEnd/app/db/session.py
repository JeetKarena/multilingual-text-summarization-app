# BackEnd/app/db/session.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    
async def connect_to_mongo():
    """Create database connection."""
    Database.client = AsyncIOMotorClient(settings.MONGODB_URL)
    print("Connected to MongoDB")

async def close_mongo_connection():
    """Close database connection."""
    if Database.client is not None:
        Database.client.close()
        print("Closed MongoDB connection")

def get_database():
    """Get database instance."""
    return Database.client[settings.DATABASE_NAME]

def get_collection(collection_name: str):
    """Get a collection from the database."""
    return get_database()[collection_name]