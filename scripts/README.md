# Database Management Scripts

This directory contains scripts for managing the Neon database in the Spotify Ranker application.

## Available Scripts

### 1. Database Reset (Keep Structure)

```bash
npm run db:reset
```

This script:
- Keeps your database structure intact
- Deletes all data from all tables
- Runs the seed script to restore essential data
- Use this to free up space while preserving your database schema

### 2. Full Database Reset

```bash
npm run db:full-reset
```

This script:
- Drops all tables completely
- Re-runs all migrations to recreate the schema
- Seeds the database with initial data
- Use this for a complete reset when there are schema changes

### 3. Direct SQL Clean

```bash
npm run db:clean
```

This script:
- Directly connects to the Neon database
- Uses SQL commands to truncate all tables
- Doesn't run seeds automatically
- Fastest option, but requires pg library

### 4. Nuclear Option (Remove Migrations)

```bash
npm run db:nuke
```

This script:
- Completely removes all migration history
- Deletes migration files from the filesystem
- Drops the _prisma_migrations table from the database
- Recreates the schema using prisma db push (without migrations)
- Seeds the database with initial data
- Use this when you want to eliminate all migration history

### 5. Database Size Check

```bash
npm run db:size
```

This script:
- Connects to the Neon database and checks its current size
- Shows the percentage used of the free tier limit (0.5GB)
- Lists the top 5 largest tables to help identify space usage
- Warns you if the database is approaching the size limit
- Use this regularly to monitor your database size

## When to Use Each Script

- **db:reset**: When you want to quickly clear data but keep the structure
- **db:full-reset**: When you want to completely reset everything, including schema
- **db:clean**: When you need the most direct and efficient way to clean data
- **db:nuke**: When you want to eliminate all migrations and start fresh with db push
- **db:size**: When you want to check how much space your database is using

## Regular Maintenance

To prevent reaching the Neon free tier limit (0.5GB), it's recommended to:

1. Run `npm run db:size` regularly to monitor your database size
2. When database exceeds 80% of the limit, clean up with `npm run db:clean` 
3. After cleaning, run `npx prisma db seed` to restore essential data
4. If size issues persist, use `npm run db:nuke` to completely reset

## Troubleshooting

If you encounter issues with foreign key constraints:

1. The scripts handle foreign key constraints, but if you still have problems:
   ```bash
   # First run the clean script
   npm run db:clean
   
   # Then seed the database
   npx prisma db seed
   ```

2. If that doesn't work, check your DATABASE_URL in the .env file and make sure it's correct 