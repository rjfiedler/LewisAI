require('dotenv').config();
const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || null;

    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      throw new Error('Missing Twilio credentials in environment variables');
    }

    this.client = twilio(this.accountSid, this.authToken);
  }

  validatePhoneNumber(phoneNumber) {
    // Support both regular and WhatsApp formats
    const cleanNumber = phoneNumber.replace('whatsapp:', '');
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(cleanNumber);
  }

  async sendSMS(to, message, mediaUrl = null) {
    try {
      // Check if it's WhatsApp or SMS
      const isWhatsApp = to.startsWith('whatsapp:');
      const cleanNumber = to.replace('whatsapp:', '');
      
      if (!this.validatePhoneNumber(to)) {
        throw new Error('Invalid phone number format. Must be in E.164 format (e.g., +1234567890)');
      }

      // Determine the 'from' number
      let fromNumber;
      if (isWhatsApp) {
        if (!this.whatsappNumber) {
          throw new Error('WhatsApp number not configured. Add TWILIO_WHATSAPP_NUMBER to .env file');
        }
        fromNumber = `whatsapp:${this.whatsappNumber}`;
      } else {
        fromNumber = this.phoneNumber;
      }

      const messageData = {
        body: message,
        from: fromNumber,
        to: to
      };

      // Add media if provided
      if (mediaUrl) {
        messageData.mediaUrl = [mediaUrl];
        console.log('📎 Sending with media:', mediaUrl);
      }

      console.log('📤 Sending message:');
      console.log('  From:', fromNumber);
      console.log('  To:', to);
      console.log('  Type:', isWhatsApp ? 'WhatsApp' : 'SMS');

      const result = await this.client.messages.create(messageData);

      console.log('✅ Message sent successfully:', result.sid);
      return {
        success: true,
        sid: result.sid,
        status: result.status,
        to: to,
        isWhatsApp: isWhatsApp
      };
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  async getMessageStatus(messageSid) {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        numMedia: message.numMedia
      };
    } catch (error) {
      console.error('Error fetching message status:', error);
      throw error;
    }
  }

  async downloadMedia(mediaUrl) {
    try {
      // Add authentication for Twilio media URLs
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const response = await fetch(mediaUrl, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Error downloading media:', error);
      throw error;
    }
  }
}

module.exports = TwilioService;