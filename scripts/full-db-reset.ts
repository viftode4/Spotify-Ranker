import { execSync } from 'child_process';

/**
 * This script performs a complete database reset by:
 * 1. Dropping all tables and data
 * 2. Re-running all migrations
 * 3. Seeding the database with initial data
 * 
 * Use this when you want to completely reset your database to the initial state.
 */
function resetDatabaseCompletely() {
  try {
    console.log('🔄 Starting complete database reset...');
    
    // Force reset the database using Prisma's migrate reset command
    // This will drop all tables, reapply migrations, and run the seed script
    console.log('🧹 Dropping all tables and recreating schema...');
    execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
    
    console.log('✅ Database completely reset successfully!');
    console.log('🚀 Your database is now empty except for seed data.');
  } catch (error) {
    console.error('❌ Error during complete database reset:', error);
    process.exit(1);
  }
}

// Execute the reset function
resetDatabaseCompletely(); 