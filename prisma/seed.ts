import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  
  // Check if admin user exists
  const adminExists = await prisma.user.findFirst({
    where: { 
      email: "admin@spotifyranker.com",
    }
  });
  
  // If admin user doesn't exist, create one
  if (!adminExists) {
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash("spotify_ranker_admin123", 10);
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@spotifyranker.com",
        password: hashedPassword,
        isAdmin: true,
        id: "admin-user", // Use a consistent ID for the admin user
      }
    });
    console.log('Admin user created!');
  } else {
    console.log('Admin user already exists!');
  }
  
  console.log('Database seed completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 