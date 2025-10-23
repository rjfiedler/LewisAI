const { Pool } = require('pg');
require('dotenv').config();

async function rebuildConversationsTable() {
  console.log('🔧 Rebuilding conversations table...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Drop the old table (this will also delete all conversations)
    console.log('Dropping old conversations table...');
    await pool.query('DROP TABLE IF EXISTS conversations CASCADE;');
    console.log('✅ Old table dropped');

    // Create new table with correct schema
    console.log('\nCreating new conversations table...');
    await pool.query(`
      CREATE TABLE conversations (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ New table created');

    // Recreate the messages table (since we dropped CASCADE)
    console.log('\nRecreating messages table...');
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

    // Create indexes
    console.log('\nCreating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation 
      ON messages(conversation_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created 
      ON messages(created_at DESC);
    `);
    console.log('✅ Indexes created');

    // Verify structure
    console.log('\nVerifying table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'conversations'
      ORDER BY ordinal_position;
    `);
    
    console.log('Conversations table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ Database rebuild complete!');
    console.log('⚠️  Note: All previous conversations have been deleted.');
    
  } catch (error) {
    console.error('❌ Error rebuilding table:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

rebuildConversationsTable();