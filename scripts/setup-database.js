const { Pool } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔧 Setting up Supabase database...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Create conversations table
    console.log('Creating conversations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(phone_number)
      );
    `);
    console.log('✅ Conversations table created');

    // Create messages table
    console.log('Creating messages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        message_sid VARCHAR(100),
        direction VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        from_number VARCHAR(20) NOT NULL,
        to_number VARCHAR(20) NOT NULL,
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_direction CHECK (direction IN ('inbound', 'outbound'))
      );
    `);
    console.log('✅ Messages table created');

    // Create index for faster lookups
    console.log('Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON messages(conversation_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created 
      ON messages(created_at DESC);
    `);
    console.log('✅ Indexes created');

    console.log('\n✅ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

setupDatabase();