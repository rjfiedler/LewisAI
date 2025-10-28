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
- When analyzing images, be descriptive but concise

Keep responses brief since this is SMS. If a topic requires a longer explanation, offer to break it into multiple messages.`;
  }

  async generateResponse(userMessage, conversationHistory = [], imageUrl = null) {
    try {
      // Build messages array with conversation history
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Add conversation history (last 10 messages for context, but skip images to save tokens)
      conversationHistory.slice(-10).forEach(msg => {
        messages.push({
          role: msg.direction === 'inbound' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // Add current user message with optional image
      if (imageUrl) {
        console.log('🖼️  Processing message with image...');
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: userMessage || 'What do you see in this image?'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'auto' // Can be 'low', 'high', or 'auto'
              }
            }
          ]
        });
      } else {
        messages.push({
          role: 'user',
          content: userMessage
        });
      }

      console.log('🤖 Generating AI response...');
      console.log('📝 Context being sent to OpenAI:');
      console.log('  - Conversation history messages:', conversationHistory.length);
      console.log('  - Current message:', userMessage);
      console.log('  - Has image:', !!imageUrl);
      console.log('  - Total messages to API:', messages.length);
      
      const startTime = Date.now();
      
      // Use gpt-4o for vision (supports images), gpt-4o-mini doesn't support images well
      const model = imageUrl ? 'gpt-4o' : 'gpt-4o-mini';
      
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: imageUrl ? 300 : 200, // More tokens for image descriptions
        temperature: 0.7,
      });

      const responseTime = Date.now() - startTime;
      const response = completion.choices[0].message.content.trim();
      
      console.log('✅ AI response generated');
      console.log('  Response:', response);
      console.log('  Model used:', model);
      console.log('  Tokens used - Prompt:', completion.usage.prompt_tokens);
      console.log('  Tokens used - Completion:', completion.usage.completion_tokens);
      console.log('  Tokens used - Total:', completion.usage.total_tokens);
      console.log('  Response time:', responseTime + 'ms');
      
      // Calculate cost (gpt-4o is more expensive than gpt-4o-mini)
      let estimatedCost;
      if (model === 'gpt-4o') {
        // GPT-4o pricing: $2.50 per 1M input tokens, $10 per 1M output tokens
        estimatedCost = (completion.usage.prompt_tokens * 0.0000025) + 
                       (completion.usage.completion_tokens * 0.00001);
      } else {
        // GPT-4o-mini pricing: $0.15 per 1M input, $0.60 per 1M output
        estimatedCost = (completion.usage.prompt_tokens * 0.00000015) + 
                       (completion.usage.completion_tokens * 0.0000006);
      }
      
      console.log('  Estimated cost: $' + estimatedCost.toFixed(6));
      
      return response;
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
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
        response: completion.choices[0].message.content,
        usage: completion.usage
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