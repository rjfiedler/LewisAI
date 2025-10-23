const { Pool } = require('pg');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...\n');
  
  const dbUrl = process.env.DATABASE_URL;
  const sanitizedUrl = dbUrl ? dbUrl.replace(/:[^:@]*@/, ':****@') : 'Not configured';
  console.log('Connection string:', sanitizedUrl);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\nTesting basic connection...');
    const result = await pool.query('SELECT version(), current_database(), current_user');
    console.log('Connected to Supabase!');
    console.log('   Database:', result.rows[0].current_database);
    console.log('   User:', result.rows[0].current_user);
    
    console.log('\nChecking tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    if (tables.rows.length === 0) {
      console.log('No tables found. Run the setup script first.');
    } else {
      console.log('Found tables:');
      tables.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }
    
    console.log('\nSupabase connection test completed successfully!');
    
  } catch (error) {
    console.error('\nConnection failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check your DATABASE_URL in .env file');
    console.error('2. Make sure you replaced YOUR_PASSWORD with actual password');
    console.error('3. Ensure your Supabase project is active (not paused)');
  } finally {
    await pool.end();
  }
}

testSupabaseConnection();
