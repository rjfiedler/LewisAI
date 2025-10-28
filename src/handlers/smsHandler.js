const TwilioService = require('../services/twilioService');
const DatabaseService = require('../services/databaseService');
const OpenAIService = require('../services/openaiService');

class SMSHandler {
  constructor() {
    this.twilioService = new TwilioService();
    this.databaseService = new DatabaseService();
    this.openaiService = new OpenAIService();
  }

  async handleIncomingMessage(req, res) {
    try {
      const { From, Body, MessageSid, To, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
      
      // Detect if it's WhatsApp or SMS
      const isWhatsApp = From.startsWith('whatsapp:');
      const cleanFrom = From.replace('whatsapp:', '');
      const cleanTo = To.replace('whatsapp:', '');
      
      console.log('\n📨 Incoming Message:');
      console.log('  Type:', isWhatsApp ? 'WhatsApp' : 'SMS');
      console.log('  From:', cleanFrom);
      console.log('  To:', cleanTo);
      console.log('  Message:', Body || '(no text)');
      console.log('  SID:', MessageSid);
      console.log('  Media Count:', NumMedia || 0);

      // Handle media if present
      let mediaInfo = null;
      let imageUrl = null;
      
      if (NumMedia && parseInt(NumMedia) > 0) {
        console.log('  📷 Media detected!');
        console.log('    Type:', MediaContentType0);
        console.log('    URL:', MediaUrl0);
        
        mediaInfo = {
          url: MediaUrl0,
          contentType: MediaContentType0
        };

        // If it's an image, prepare it for OpenAI Vision
        if (MediaContentType0 && MediaContentType0.startsWith('image/')) {
          console.log('    ✅ Image will be analyzed by AI');
          // Twilio media URLs require authentication, but OpenAI can't access them directly
          // We need to add auth token to the URL
          imageUrl = `${MediaUrl0}?${new URLSearchParams({
            AccountSid: process.env.TWILIO_ACCOUNT_SID,
            AuthToken: process.env.TWILIO_AUTH_TOKEN
          })}`;
          
          // Actually, better approach: construct the authenticated URL properly
          const mediaUrlParts = MediaUrl0.split('.com');
          imageUrl = `https://${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}@api.twilio.com${mediaUrlParts[1]}`;
        }
      }

      // Get or create conversation (using clean phone number)
      const conversation = await this.databaseService.getOrCreateConversation(cleanFrom);
      console.log('  Conversation ID:', conversation.id);

      // Save incoming message to database
      const messageContent = Body || (mediaInfo ? '📷 [Image]' : '(empty message)');
      await this.databaseService.saveMessage(conversation.id, {
        messageSid: MessageSid,
        direction: 'inbound',
        content: messageContent,
        fromNumber: cleanFrom,
        toNumber: cleanTo,
        status: 'received',
        mediaUrl: mediaInfo ? mediaInfo.url : null,
        mediaType: mediaInfo ? mediaInfo.contentType : null
      });

      // Get conversation history for context
      const history = await this.databaseService.getConversationHistory(conversation.id, 10);
      
      // Generate AI response
      console.log('🤖 Generating AI response...');
      let prompt = Body || 'What do you see in this image?';
      
      // Pass the image URL to OpenAI if it's an image
      const aiResponse = await this.openaiService.generateResponse(
        prompt, 
        history,
        imageUrl // This enables vision!
      );
      
      console.log('  Response:', aiResponse);

      // Send response (use same format - WhatsApp or SMS)
      const responseNumber = isWhatsApp ? `whatsapp:${cleanFrom}` : cleanFrom;
      const sendResult = await this.twilioService.sendSMS(responseNumber, aiResponse);

      // Save outgoing message to database
      await this.databaseService.saveMessage(conversation.id, {
        messageSid: sendResult.sid,
        direction: 'outbound',
        content: aiResponse,
        fromNumber: cleanTo,
        toNumber: cleanFrom,
        status: sendResult.status
      });

      // Update conversation timestamp
      await this.databaseService.updateConversationTimestamp(conversation.id);

      console.log('✅ Message processed successfully\n');

      res.status(200).json({ 
        success: true, 
        message: 'Message processed' 
      });
    } catch (error) {
      console.error('❌ Error handling message:', error);
      
      // Try to send an error message to the user
      try {
        const cleanFrom = req.body.From.replace('whatsapp:', '');
        const isWhatsApp = req.body.From.startsWith('whatsapp:');
        const responseNumber = isWhatsApp ? `whatsapp:${cleanFrom}` : cleanFrom;
        
        await this.twilioService.sendSMS(
          responseNumber,
          "Sorry, I'm having trouble processing your message right now. Please try again later."
        );
      } catch (sendError) {
        console.error('Failed to send error message:', sendError);
      }

      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const { to, message, mediaUrl } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: to, message'
        });
      }

      // Send with optional media
      const result = await this.twilioService.sendSMS(to, message, mediaUrl);

      // Optionally save to database
      const cleanTo = to.replace('whatsapp:', '');
      const conversation = await this.databaseService.getOrCreateConversation(cleanTo);
      await this.databaseService.saveMessage(conversation.id, {
        messageSid: result.sid,
        direction: 'outbound',
        content: message,
        fromNumber: process.env.TWILIO_PHONE_NUMBER,
        toNumber: cleanTo,
        status: result.status,
        mediaUrl: mediaUrl || null
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getConversationHistory(req, res) {
    try {
      const { phoneNumber } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const conversation = await this.databaseService.getOrCreateConversation(phoneNumber);
      const history = await this.databaseService.getConversationHistory(conversation.id, limit);

      res.status(200).json({
        success: true,
        data: {
          conversation,
          messages: history
        }
      });
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = SMSHandler;