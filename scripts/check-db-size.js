// Script to check Neon database size
const { Client } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Free plan limit in bytes (0.5 GB = 536,870,912 bytes)
const FREE_PLAN_LIMIT = 536870912;
const WARNING_THRESHOLD = 0.8; // 80% of free plan limit

async function checkDatabaseSize() {
  // Get the database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔍 Connecting to Neon database to check size...');
    await client.connect();
    
    // Query to get database size
    const sizeQuery = `
      SELECT 
        pg_database.datname, 
        pg_size_pretty(pg_database_size(pg_database.datname)) as pretty_size,
        pg_database_size(pg_database.datname) as size_in_bytes
      FROM pg_database
      WHERE pg_database.datname = current_database();
    `;
    
    const sizeResult = await client.query(sizeQuery);
    
    if (sizeResult.rows.length > 0) {
      const dbName = sizeResult.rows[0].datname;
      const prettySize = sizeResult.rows[0].pretty_size;
      const sizeInBytes = parseInt(sizeResult.rows[0].size_in_bytes);
      
      // Calculate percentage of free plan used
      const percentUsed = (sizeInBytes / FREE_PLAN_LIMIT) * 100;
      const percentageFormatted = percentUsed.toFixed(2);
      
      console.log(`\n📊 Database Size Report for "${dbName}"`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 Current Size: ${prettySize}`);
      console.log(`🔋 Free Plan Limit: 0.5 GB`);
      console.log(`📊 Percentage Used: ${percentageFormatted}%`);
      
      // Get table sizes to identify large tables
      const tableQuery = `
        SELECT
          table_name,
          pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as pretty_size,
          pg_total_relation_size(quote_ident(table_name)) as size_in_bytes
        FROM
          information_schema.tables
        WHERE
          table_schema = 'public'
        ORDER BY
          pg_total_relation_size(quote_ident(table_name)) DESC
        LIMIT 5;
      `;
      
      const tableResult = await client.query(tableQuery);
      
      if (tableResult.rows.length > 0) {
        console.log(`\n📋 Top 5 Largest Tables:`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        tableResult.rows.forEach((row, i) => {
          const tablePercentage = ((row.size_in_bytes / sizeInBytes) * 100).toFixed(2);
          console.log(`${i+1}. ${row.table_name}: ${row.pretty_size} (${tablePercentage}% of DB)`);
        });
      }
      
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Warning if approaching limit
      if (percentUsed >= WARNING_THRESHOLD * 100) {
        console.log(`⚠️  WARNING: Your database is using ${percentageFormatted}% of the free tier limit!`);
        console.log(`⚠️  Consider running one of the reset scripts:`);
        console.log(`    - npm run db:clean    (Fast data cleanup)`);
        console.log(`    - npm run db:nuke     (Complete reset including migrations)`);
      } else {
        console.log(`✅ Your database is at ${percentageFormatted}% of the free tier limit.`);
      }
    } else {
      console.log('❌ Unable to retrieve database size information');
    }
  } catch (error) {
    console.error('❌ Error checking database size:', error);
  } finally {
    await client.end();
  }
}

// Execute the function
checkDatabaseSize(); 