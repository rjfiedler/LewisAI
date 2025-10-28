const { Pool } = require('pg');
require('dotenv').config();

async function addMediaSupport() {
  console.log('🔧 Adding media support to messages table...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Add media columns to messages table
    console.log('Adding media_url and media_type columns...');
    await pool.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS media_url TEXT,
      ADD COLUMN IF NOT EXISTS media_type VARCHAR(100);
    `);
    console.log('✅ Media columns added');

    // Verify structure
    console.log('\nVerifying table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `);
    
    console.log('Messages table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ Media support added successfully!');
    console.log('You can now send and receive photos/media via SMS and WhatsApp!');
    
  } catch (error) {
    console.error('❌ Error adding media support:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addMediaSupport();