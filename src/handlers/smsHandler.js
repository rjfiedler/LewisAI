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
      const { From, Body, MessageSid, To } = req.body;
      
      console.log('\n📨 Incoming SMS:');
      console.log('  From:', From);
      console.log('  To:', To);
      console.log('  Message:', Body);
      console.log('  SID:', MessageSid);

      // Get or create conversation
      const conversation = await this.databaseService.getOrCreateConversation(From);
      console.log('  Conversation ID:', conversation.id);

      // Save incoming message to database
      await this.databaseService.saveMessage(conversation.id, {
        messageSid: MessageSid,
        direction: 'inbound',
        content: Body,
        fromNumber: From,
        toNumber: To,
        status: 'received'
      });

      // Get conversation history for context
      const history = await this.databaseService.getConversationHistory(conversation.id, 10);
      
      // Generate AI response
      console.log('🤖 Generating AI response...');
      const aiResponse = await this.openaiService.generateResponse(Body, history);
      console.log('  Response:', aiResponse);

      // Send response via SMS
      const sendResult = await this.twilioService.sendSMS(From, aiResponse);

      // Save outgoing message to database
      await this.databaseService.saveMessage(conversation.id, {
        messageSid: sendResult.sid,
        direction: 'outbound',
        content: aiResponse,
        fromNumber: To,
        toNumber: From,
        status: sendResult.status
      });

      // Update conversation timestamp
      await this.databaseService.updateConversationTimestamp(conversation.id);

      console.log('✅ Message processed successfully\n');

      res.status(200).json({ 
        success: true, 
        message: 'SMS processed' 
      });
    } catch (error) {
      console.error('❌ Error handling SMS:', error);
      
      // Try to send an error message to the user
      try {
        await this.twilioService.sendSMS(
          req.body.From,
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
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: to, message'
        });
      }

      const result = await this.twilioService.sendSMS(to, message);

      // Optionally save to database
      const conversation = await this.databaseService.getOrCreateConversation(to);
      await this.databaseService.saveMessage(conversation.id, {
        messageSid: result.sid,
        direction: 'outbound',
        content: message,
        fromNumber: process.env.TWILIO_PHONE_NUMBER,
        toNumber: to,
        status: result.status
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
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