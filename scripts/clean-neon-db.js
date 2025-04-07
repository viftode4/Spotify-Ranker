// Direct SQL approach to clear data from Neon DB
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function cleanNeonDB() {
  // Get the database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔄 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('🗑️ Disabling foreign key checks and truncating all tables...');
    
    // Start a transaction
    await client.query('BEGIN');

    // Temporarily disable foreign key constraints
    await client.query('SET CONSTRAINTS ALL DEFERRED');

    // Truncate all tables in a specific order to avoid constraint issues
    await client.query(`
      TRUNCATE TABLE "Track", 
                     "Rating", 
                     "Comment", 
                     "UserCommentVote", 
                     "UserComment", 
                     "UserRating", 
                     "Session", 
                     "VerificationToken", 
                     "Account", 
                     "Album",
                     "User" CASCADE;
    `);

    // Commit the transaction
    await client.query('COMMIT');

    console.log('✅ All tables truncated successfully');
    console.log('🚀 Your database is now empty');

  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('❌ Error cleaning database:', error);
  } finally {
    // Close the client connection
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Execute the function
cleanNeonDB(); 