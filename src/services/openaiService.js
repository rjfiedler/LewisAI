require('dotenv').config();
const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    
    if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file');
    }

    this.openai = new OpenAI({
      apiKey: this.apiKey
    });

    // System prompt that defines Lewis's personality
    this.systemPrompt = `You are Lewis, a friendly and helpful AI assistant communicating via SMS. 

Key personality traits:
- Warm, conversational, and approachable
- Concise responses (SMS-friendly, usually 1-2 sentences)
- Helpful and knowledgeable
- Remember context from previous messages in the conversation
- Use natural language, avoid being overly formal

Keep responses brief since this is SMS. If a topic requires a longer explanation, offer to break it into multiple messages.`;
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      // Build messages array with conversation history
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Add conversation history (last 10 messages for context)
      conversationHistory.slice(-10).forEach(msg => {
        messages.push({
          role: msg.direction === 'inbound' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      console.log('🤖 Generating AI response...');
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model, you can change to 'gpt-4' for better quality
        messages: messages,
        max_tokens: 200, // Keep responses concise for SMS
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content.trim();
      console.log('✅ AI response generated');
      
      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      }
      
      throw new Error('Failed to generate AI response: ' + error.message);
    }
  }

  async testConnection() {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "Hello" if you can hear me.' }],
        max_tokens: 10
      });
      
      return {
        success: true,
        message: 'OpenAI connection successful',
        response: completion.choices[0].message.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = OpenAIService;