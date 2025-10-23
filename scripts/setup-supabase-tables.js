const { Pool } = require('pg');
require('dotenv').config();

async function setupTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Setting up Supabase tables...\n');

  try {
    console.log('Creating conversations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      )
    `);
    console.log('Conversations table created');

    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        first_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        message_count INTEGER DEFAULT 0,
        total_tokens_used INTEGER DEFAULT 0,
        is_blocked BOOLEAN DEFAULT FALSE,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      )
    `);
    console.log('Users table created');

    console.log('Creating rate_limits table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        message_count INTEGER DEFAULT 1,
        window_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      )
    `);
    console.log('Rate limits table created');

    console.log('\nCreating indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)');
    console.log('Indexes created');

    console.log('\nSupabase database is ready!');

  } catch (error) {
    console.error('Setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

setupTables();
