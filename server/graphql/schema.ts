import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: Int!
    username: String!
    firstName: String!
    lastName: String!
    email: String!
    createdAt: String!
  }

  type Summary {
    id: Int!
    userId: Int!
    originalText: String!
    summary: String!
    language: String!
    createdAt: String!
  }

  type AuthPayload {
    user: User!
  }

  input LoginInput {
    username: String!
    password: String!
  }

  input RegisterInput {
    username: String!
    password: String!
    firstName: String!
    lastName: String!
    email: String!
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    email: String
    currentPassword: String!
    newPassword: String
  }

  input SummarizeInput {
    originalText: String!
    language: String!
  }

  type Query {
    me: User
    summaries: [Summary!]!
  }

  type Mutation {
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    logout: Boolean!
    summarize(input: SummarizeInput!): Summary!
    updateProfile(input: UpdateProfileInput!): User!
    deleteAccount(password: String!): Boolean!
    deleteSummary(id: Int!): Boolean!
  }
`;