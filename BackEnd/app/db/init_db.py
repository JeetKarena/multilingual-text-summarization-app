from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import asyncio
import logging

logger = logging.getLogger(__name__)

async def init_indices(db: AsyncIOMotorClient):
    """Initialize database indices."""
    try:
        # Users collection indices
        await db.users.create_index("email", unique=True)
        
        # Documents collection indices
        await db.documents.create_index([
            ("user_id", 1),
            ("created_at", -1)
        ])
        await db.documents.create_index([
            ("title", "text"),
            ("content", "text")
        ])
        
        # Summaries collection indices
        await db.summaries.create_index([
            ("user_id", 1),
            ("created_at", -1)
        ])
        
        logger.info("Database indices initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database indices: {e}")
        raise

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    await init_indices(db)
    client.close()

if __name__ == "__main__":
    asyncio.run(init_db())