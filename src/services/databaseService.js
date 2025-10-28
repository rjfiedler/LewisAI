const { Pool } = require('pg');
require('dotenv').config();

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  async getOrCreateConversation(phoneNumber) {
    try {
      // Try to get existing conversation
      let result = await this.pool.query(
        'SELECT * FROM conversations WHERE phone_number = $1',
        [phoneNumber]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Create new conversation
      result = await this.pool.query(
        'INSERT INTO conversations (phone_number) VALUES ($1) RETURNING *',
        [phoneNumber]
      );

      console.log('📝 New conversation created for:', phoneNumber);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  async saveMessage(conversationId, data) {
    try {
      const { 
        messageSid, 
        direction, 
        content, 
        fromNumber, 
        toNumber, 
        status,
        mediaUrl = null,
        mediaType = null
      } = data;
      
      const result = await this.pool.query(
        `INSERT INTO messages 
        (conversation_id, message_sid, direction, content, from_number, to_number, status, media_url, media_type) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [conversationId, messageSid, direction, content, fromNumber, toNumber, status, mediaUrl, mediaType]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async getConversationHistory(conversationId, limit = 10) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM messages 
        WHERE conversation_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2`,
        [conversationId, limit]
      );

      return result.rows.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  async updateConversationTimestamp(conversationId) {
    try {
      await this.pool.query(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [conversationId]
      );
    } catch (error) {
      console.error('Error updating conversation timestamp:', error);
      throw error;
    }
  }

  async getAllConversations(limit = 20) {
    try {
      const result = await this.pool.query(
        `SELECT c.*, 
         (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
         FROM conversations c 
         ORDER BY c.updated_at DESC 
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting all conversations:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = DatabaseService;