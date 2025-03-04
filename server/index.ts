import express, { type Request, Response, NextFunction } from "express";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { setupVite } from "./vite";
import { json } from "express";
import session from "express-session";
import { storage } from "./storage";
import cors from "cors";
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { createContext } from './graphql/context';
import { setupAuth } from "./auth";

const app = express();

// Server configuration
app.set("trust proxy", 1);

// CORS configuration - must come before other middleware
app.use(cors({
  origin: true, // Allow same origin
  credentials: true // Allow credentials (cookies)
}));

// Body parsing middleware
app.use(json());

// Session configuration must come before routes
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  name: 'sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  store: storage.sessionStore
}));

// Setup authentication
setupAuth(app);

// Debug middleware to log session and auth status
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Session ID:', req.sessionID);
  console.log('Is Authenticated:', req.isAuthenticated?.());
  next();
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

async function main() {
  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start Apollo Server
  await server.start();

  // Apply Apollo middleware
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }) => createContext({ req, res }),
    }),
  );

  const port = 5000; // Always serve on port 5000 as required

  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, app);
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});