const OpenAIService = require('../src/services/openaiService');

async function testOpenAI() {
  console.log('🤖 Testing OpenAI integration...\n');

  try {
    const openaiService = new OpenAIService();
    console.log('✅ OpenAI service initialized');

    console.log('\nTesting connection...');
    const connectionTest = await openaiService.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ Connection successful!');
      console.log('Response:', connectionTest.response);
    } else {
      console.log('❌ Connection failed:', connectionTest.error);
      return;
    }

    console.log('\nTesting conversation...');
    const response = await openaiService.generateResponse(
      'Hi Lewis! What can you help me with?',
      []
    );
    
    console.log('\n📱 User: Hi Lewis! What can you help me with?');
    console.log('🤖 Lewis:', response);

    console.log('\n✅ OpenAI test complete!');
    
  } catch (error) {
    console.error('\n❌ OpenAI test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure you have a valid OpenAI API key in your .env file');
    console.error('2. Check that OPENAI_API_KEY is not set to "your_openai_api_key_here"');
    console.error('3. Verify your API key has credits at https://platform.openai.com/usage');
  }
}

testOpenAI();