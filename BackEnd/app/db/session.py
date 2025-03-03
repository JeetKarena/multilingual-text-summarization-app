# BackEnd/app/db/session.py
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import asyncio
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    
async def connect_to_mongo():
    """Create database connection with retry logic."""
    retries = 5
    delay = 1  # Initial delay in seconds
    
    for attempt in range(retries):
        try:
            Database.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                retryWrites=True,
                w='majority'  # Ensure writes are acknowledged by majority
            )
            
            # Test the connection
            await Database.client.admin.command('ismaster')
            
            logger.info("Successfully connected to MongoDB replica set")
            return
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            if attempt == retries - 1:  # Last attempt
                logger.error(f"Failed to connect to MongoDB after {retries} attempts: {str(e)}")
                raise
            
            logger.warning(f"Connection attempt {attempt + 1} failed, retrying in {delay} seconds...")
            await asyncio.sleep(delay)
            delay *= 2  # Exponential backoff

async def close_mongo_connection():
    """Close database connection."""
    if Database.client is not None:
        Database.client.close()
        logger.info("Closed MongoDB connection")

def get_database():
    """Get database instance with read preference."""
    if Database.client is None:
        raise ConnectionError("Database connection not initialized")
    return Database.client.get_database(
        settings.DATABASE_NAME,
        read_preference=Database.client.read_preference
    )

def get_collection(collection_name: str):
    """Get a collection from the database."""
    return get_database()[collection_name]

async def ensure_indexes():
    """Ensure all required indexes exist."""
    db = get_database()
    
    # Users collection indexes
    await db.users.create_index("email", unique=True)
    
    # Documents collection indexes
    await db.documents.create_index([
        ("user_id", 1),
        ("created_at", -1)
    ])
    await db.documents.create_index([
        ("title", "text"),
        ("content", "text")
    ])
    
    # Summaries collection indexes
    await db.summaries.create_index([
        ("user_id", 1),
        ("created_at", -1)
    ])