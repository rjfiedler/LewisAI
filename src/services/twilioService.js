require('dotenv').config();
const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      throw new Error('Missing Twilio credentials in environment variables');
    }

    this.client = twilio(this.accountSid, this.authToken);
  }

  validatePhoneNumber(phoneNumber) {
    // Basic E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  async sendSMS(to, message) {
    try {
      if (!this.validatePhoneNumber(to)) {
        throw new Error('Invalid phone number format. Must be in E.164 format (e.g., +1234567890)');
      }

      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });

      console.log('SMS sent successfully:', result.sid);
      return {
        success: true,
        sid: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async getAccountBalance() {
    try {
      const balance = await this.client.balance.fetch();
      return {
        balance: balance.balance,
        currency: balance.currency
      };
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  async getMessageStatus(messageSid) {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      console.error('Error fetching message status:', error);
      throw error;
    }
  }
}

module.exports = TwilioService;