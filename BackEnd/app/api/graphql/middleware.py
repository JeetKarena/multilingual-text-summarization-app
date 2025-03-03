from typing import Optional
from fastapi import Request
from ariadne.asgi import GraphQL
from ariadne import make_executable_schema
from .schema import schema

class AuthenticatedGraphQL(GraphQL):
    async def get_context_value(self, request: Request) -> dict:
        return {
            "request": request,
        }

graphql_app = AuthenticatedGraphQL(
    schema=schema,
    debug=True
)