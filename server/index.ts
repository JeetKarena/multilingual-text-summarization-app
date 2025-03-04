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
import { PostgresStorage } from "./pg-storage";
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;

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
  secret: process.env.SESSION_SECRET || 'dev_secret_should_change_in_production',
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
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Session ID:', req.sessionID);
    console.log('Is Authenticated:', req.isAuthenticated?.());
    next();
  });
}

// Add this endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString() 
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

async function main() {
  // Initialize PostgreSQL if being used
  if (storage instanceof PostgresStorage) {
    try {
      console.log("Initializing PostgreSQL database...");
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        console.error('DATABASE_URL environment variable not set');
        process.exit(1);
      }
      const pool = new Pool({ connectionString });
      const db = drizzle(pool);
      await migrate(db, { migrationsFolder: './migrations' });
      console.log("PostgreSQL database initialized successfully");
    } catch (err) {
      console.error("Failed to initialize PostgreSQL:", err);
      
      // In development, exit on database error
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      } else {
        // In production, retry after delay instead of crashing
        console.log("Will retry database initialization in 5 seconds...");
        setTimeout(() => main(), 5000);
        return; // Return to prevent the rest of the app from starting
      }
    }
  }
  
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

  const port = process.env.PORT || 5000;
  
  // Create HTTP server from Express app
  const httpServer = require('http').createServer(app);

  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, httpServer);
  }

  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});