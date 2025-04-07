import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    
    // Get the current database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Drop all data but keep the schema
    console.log('🗑️ Truncating all tables...');
    
    // Delete data from all tables in the correct order to avoid foreign key constraints
    await prisma.$transaction([
      // First delete tables with foreign keys
      prisma.track.deleteMany({}),
      prisma.rating.deleteMany({}),
      prisma.comment.deleteMany({}),
      prisma.userCommentVote.deleteMany({}),
      prisma.userComment.deleteMany({}),
      prisma.userRating.deleteMany({}),
      
      // Then delete session tables
      prisma.session.deleteMany({}),
      prisma.verificationToken.deleteMany({}),
      prisma.account.deleteMany({}),
      
      // Delete main tables
      prisma.album.deleteMany({}),
      prisma.user.deleteMany({})
    ]);
    
    console.log('✅ All tables truncated successfully');
    
    // Run seed script to recreate essential data
    console.log('🌱 Running database seed...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('✅ Database reset completed successfully!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the reset function
resetDatabase()
  .catch((error) => {
    console.error('Failed to reset database:', error);
    process.exit(1);
  }); 