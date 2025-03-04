import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable not set');
    process.exit(1);
  }

  // Create a PostgreSQL connection
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  
  // Run migrations
  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: './migrations' });
  
  console.log('Migrations completed successfully');
  
  // Close the pool
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});