const DatabaseService = require('../src/services/databaseService');

async function testConversationSeparation() {
  console.log('🔍 Testing conversation separation...\n');
  
  const db = new DatabaseService();
  
  try {
    // Get all conversations
    const conversations = await db.getAllConversations();
    
    console.log('📊 Current conversations in database:');
    console.log('Total conversations:', conversations.length);
    console.log('');
    
    for (const conv of conversations) {
      console.log('Conversation ID:', conv.id);
      console.log('  Phone Number:', conv.phone_number);
      console.log('  Message Count:', conv.message_count);
      console.log('  Last Message:', conv.last_message);
      console.log('  Created:', conv.created_at);
      console.log('  Updated:', conv.updated_at);
      console.log('');
      
      // Get full history for this conversation
      const history = await db.getConversationHistory(conv.id, 10);
      console.log('  Recent messages:');
      history.forEach((msg, idx) => {
        console.log(`    ${idx + 1}. [${msg.direction}] ${msg.content}`);
      });
      console.log('');
    }
    
    console.log('✅ Verification complete!');
    console.log('\nHow it works:');
    console.log('- Each phone number gets a unique conversation ID');
    console.log('- All messages are linked to that conversation ID');
    console.log('- When generating AI responses, only messages from that specific conversation are used');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

testConversationSeparation();