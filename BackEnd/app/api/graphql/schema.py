from ariadne import QueryType, MutationType, gql, make_executable_schema
from app.models.summarization import generate_summary
from app.api.endpoints.auth import get_current_user

# Define GraphQL schema
type_defs = gql("""
    type User {
        email: String!
        isActive: Boolean!
    }

    type Summary {
        text: String!
        language: String!
        originalText: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type Query {
        me: User
    }

    type Mutation {
        summarizeText(
            text: String!
            language: String = "en"
            maxLength: Int = 150
            minLength: Int = 40
        ): Summary!
        
        login(email: String!, password: String!): AuthPayload!
    }
""")

# Initialize types
query = QueryType()
mutation = MutationType()

@query.field("me")
async def resolve_me(_, info):
    user = await get_current_user(info.context["request"])
    return {
        "email": user["email"],
        "isActive": user["is_active"]
    }

@mutation.field("summarizeText")
async def resolve_summarize_text(_, info, text, language="en", maxLength=150, minLength=40):
    # Get current user from context
    user = await get_current_user(info.context["request"])
    
    # Generate summary
    summary = await generate_summary(
        text=text,
        language=language,
        max_length=maxLength,
        min_length=minLength
    )
    
    return {
        "text": summary,
        "language": language,
        "originalText": text
    }

# Create executable schema
schema = make_executable_schema(type_defs, query, mutation)