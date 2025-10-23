const { Pool } = require('pg');
require('dotenv').config();

async function addMessagesTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
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
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON messages(conversation_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created 
      ON messages(created_at DESC);
    `);
    
    console.log('✅ Messages table created successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addMessagesTable();
