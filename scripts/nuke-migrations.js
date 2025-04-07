// Script to remove all migrations and reset the database
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function nukeMigrationsAndDB() {
  console.log('🔥 Starting complete database and migrations cleanup...');
  
  // Step 1: Remove _prisma_migrations table from the database
  try {
    console.log('🗑️ Removing _prisma_migrations table from database...');
    
    // Get the database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const client = new Client({
      connectionString: databaseUrl,
    });
    
    await client.connect();
    
    // Drop the _prisma_migrations table if it exists
    await client.query('DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;');
    
    // Also drop all other tables to ensure a clean database
    // Fetch all tables except the Prisma migrations table
    const tablesRes = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    if (tablesRes.rows.length > 0) {
      // Start a transaction
      await client.query('BEGIN');
      
      // Disable foreign key constraints
      await client.query('SET CONSTRAINTS ALL DEFERRED');
      
      // Drop all tables in a single command
      const tableNames = tablesRes.rows.map(row => `"${row.tablename}"`).join(', ');
      if (tableNames.length > 0) {
        await client.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE;`);
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log(`✅ Dropped all tables from the database`);
    } else {
      console.log('No tables found to drop');
    }
    
    await client.end();
  } catch (dbError) {
    console.error('❌ Error removing tables from database:', dbError);
  }
  
  // Step 2: Delete the migrations directory
  try {
    console.log('🗑️ Removing migrations directory...');
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    
    // Check if the migrations directory exists
    if (fs.existsSync(migrationsDir)) {
      // Keep only the migration_lock.toml file
      const items = fs.readdirSync(migrationsDir);
      
      for (const item of items) {
        if (item !== 'migration_lock.toml') {
          const itemPath = path.join(migrationsDir, item);
          
          if (fs.statSync(itemPath).isDirectory()) {
            // Recursively delete directory
            fs.rmSync(itemPath, { recursive: true, force: true });
            console.log(`Deleted migration: ${item}`);
          } else if (item !== 'migration_lock.toml') {
            // Delete any files that aren't migration_lock.toml
            fs.unlinkSync(itemPath);
            console.log(`Deleted file: ${item}`);
          }
        }
      }
      
      console.log('✅ Migration history deleted');
    } else {
      console.log('Migrations directory does not exist');
    }
  } catch (fsError) {
    console.error('❌ Error removing migrations directory:', fsError);
  }
  
  // Step 3: Run prisma db push to create the schema without migrations
  try {
    console.log('🚀 Creating database schema using db push...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    console.log('✅ Database schema created');
    
    // Run seed script
    console.log('🌱 Running database seed...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('✅ Database seeded');
  } catch (pushError) {
    console.error('❌ Error pushing schema to database:', pushError);
  }
  
  console.log('✅ Database and migrations have been completely reset!');
  console.log('🚀 Your database now has a clean schema with no migration history.');
}

// Execute the function
nukeMigrationsAndDB(); 