from ariadne import QueryType, MutationType, gql, make_executable_schema
from app.models.summarization import generate_summary, generate_summary_with_langchain
from app.api.endpoints.auth import get_current_user, get_password_hash, verify_password
from app.db.session import get_collection
from datetime import datetime
from bson import ObjectId

# Define GraphQL schema
type_defs = gql("""
    type User {
        id: ID!
        firstName: String!
        lastName: String!
        email: String!
        isActive: Boolean!
        createdAt: String!
        updatedAt: String!
    }

    type Summary {
        id: ID!
        text: String!
        language: String!
        originalText: String!
        userId: ID!
        createdAt: String!
        model: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type Query {
        me: User
        users: [User!]!
        user(id: ID!): User
        summaryHistory: [Summary!]!
        summary(id: ID!): Summary
    }

    input CreateUserInput {
        firstName: String!
        lastName: String!
        email: String!
        password: String!
    }

    input UpdateUserInput {
        firstName: String
        lastName: String
        email: String
        isActive: Boolean
    }

    input UpdatePasswordInput {
        oldPassword: String!
        newPassword: String!
    }

    input SummarizeInput {
        text: String!
        language: String = "en"
        maxLength: Int = 150
        minLength: Int = 40
        useLangChain: Boolean = false
    }

    type Mutation {
        # User Mutations
        createUser(input: CreateUserInput!): User!
        updateUser(id: ID!, input: UpdateUserInput!): User!
        deleteUser(id: ID!): Boolean!
        updatePassword(input: UpdatePasswordInput!): Boolean!
        
        # Auth Mutations
        login(email: String!, password: String!): AuthPayload!
        
        # Summarization Mutations
        summarizeText(input: SummarizeInput!): Summary!
    }
""")

# Initialize types
query = QueryType()
mutation = MutationType()

# Query Resolvers
@query.field("me")
async def resolve_me(_, info):
    user = await get_current_user(info.context["request"])
    return {
        "id": str(user["_id"]),
        "firstName": user.get("first_name", ""),
        "lastName": user.get("last_name", ""),
        "email": user["email"],
        "isActive": user["is_active"],
        "createdAt": user.get("created_at", "").isoformat(),
        "updatedAt": user.get("updated_at", "").isoformat()
    }

@query.field("users")
async def resolve_users(_, info):
    current_user = await get_current_user(info.context["request"])
    if not current_user.get("is_superuser"):
        raise Exception("Not authorized")
    
    users_collection = get_collection("users")
    users = await users_collection.find().to_list(None)
    
    return [{
        "id": str(user["_id"]),
        "firstName": user.get("first_name", ""),
        "lastName": user.get("last_name", ""),
        "email": user["email"],
        "isActive": user["is_active"],
        "createdAt": user.get("created_at", "").isoformat(),
        "updatedAt": user.get("updated_at", "").isoformat()
    } for user in users]

@query.field("user")
async def resolve_user(_, info, id):
    current_user = await get_current_user(info.context["request"])
    if not current_user.get("is_superuser") and str(current_user["_id"]) != id:
        raise Exception("Not authorized")
    
    users_collection = get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(id)})
    
    if not user:
        raise Exception("User not found")
    
    return {
        "id": str(user["_id"]),
        "firstName": user.get("first_name", ""),
        "lastName": user.get("last_name", ""),
        "email": user["email"],
        "isActive": user["is_active"],
        "createdAt": user.get("created_at", "").isoformat(),
        "updatedAt": user.get("updated_at", "").isoformat()
    }

@query.field("summaryHistory")
async def resolve_summary_history(_, info):
    current_user = await get_current_user(info.context["request"])
    
    summaries_collection = get_collection("summaries")
    summaries = await summaries_collection.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1).to_list(None)
    
    return [{
        "id": str(summary["_id"]),
        "text": summary["summary_text"],
        "language": summary["language"],
        "originalText": summary["original_text"],
        "userId": summary["user_id"],
        "createdAt": summary["created_at"].isoformat(),
        "model": summary["model_used"]
    } for summary in summaries]

# Mutation Resolvers
@mutation.field("createUser")
async def resolve_create_user(_, info, input):
    users_collection = get_collection("users")
    
    # Check if email exists
    if await users_collection.find_one({"email": input["email"]}):
        raise Exception("Email already registered")
    
    # Create user
    user = {
        "first_name": input["firstName"],
        "last_name": input["lastName"],
        "email": input["email"],
        "hashed_password": get_password_hash(input["password"]),
        "is_active": True,
        "is_superuser": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(user)
    user["_id"] = result.inserted_id
    
    return {
        "id": str(user["_id"]),
        "firstName": user["first_name"],
        "lastName": user["last_name"],
        "email": user["email"],
        "isActive": user["is_active"],
        "createdAt": user["created_at"].isoformat(),
        "updatedAt": user["updated_at"].isoformat()
    }

@mutation.field("updateUser")
async def resolve_update_user(_, info, id, input):
    current_user = await get_current_user(info.context["request"])
    if not current_user.get("is_superuser") and str(current_user["_id"]) != id:
        raise Exception("Not authorized")
    
    users_collection = get_collection("users")
    
    # Prepare update data
    update_data = {
        "updated_at": datetime.utcnow()
    }
    if "firstName" in input:
        update_data["first_name"] = input["firstName"]
    if "lastName" in input:
        update_data["last_name"] = input["lastName"]
    if "email" in input:
        update_data["email"] = input["email"]
    if "isActive" in input:
        update_data["is_active"] = input["isActive"]
    
    result = await users_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise Exception("User not found or no changes made")
    
    user = await users_collection.find_one({"_id": ObjectId(id)})
    
    return {
        "id": str(user["_id"]),
        "firstName": user.get("first_name", ""),
        "lastName": user.get("last_name", ""),
        "email": user["email"],
        "isActive": user["is_active"],
        "createdAt": user.get("created_at", "").isoformat(),
        "updatedAt": user.get("updated_at", "").isoformat()
    }

@mutation.field("summarizeText")
async def resolve_summarize_text(_, info, input):
    current_user = await get_current_user(info.context["request"])
    
    # Generate summary using either direct transformer or LangChain
    if input.get("useLangChain"):
        summary = await generate_summary_with_langchain(
            text=input["text"],
            language=input["language"],
            max_length=input.get("maxLength", 150),
            min_length=input.get("minLength", 40)
        )
    else:
        summary = await generate_summary(
            text=input["text"],
            language=input["language"],
            max_length=input.get("maxLength", 150),
            min_length=input.get("minLength", 40)
        )
    
    # Save summary to database
    summaries_collection = get_collection("summaries")
    summary_doc = {
        "user_id": str(current_user["_id"]),
        "original_text": input["text"],
        "summary_text": summary,
        "language": input["language"],
        "model_used": "langchain" if input.get("useLangChain") else "transformer",
        "created_at": datetime.utcnow()
    }
    
    result = await summaries_collection.insert_one(summary_doc)
    
    return {
        "id": str(result.inserted_id),
        "text": summary,
        "language": input["language"],
        "originalText": input["text"],
        "userId": str(current_user["_id"]),
        "createdAt": summary_doc["created_at"].isoformat(),
        "model": summary_doc["model_used"]
    }

# Create executable schema
schema = make_executable_schema(type_defs, query, mutation)