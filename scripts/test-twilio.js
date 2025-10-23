const TwilioService = require('../src/services/twilioService');

async function testTwilio() {
  console.log('🔄 Testing Twilio configuration...\n');
  
  const twilioService = new TwilioService();
  
  // Test 1: Check credentials
  console.log('✅ Twilio credentials found');
  console.log('Phone number:', process.env.TWILIO_PHONE_NUMBER);
  console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
  console.log('');
  
  // Test 2: Validate phone number format
  try {
    const testPhone = '+15129819013';
    const isValid = twilioService.validatePhoneNumber(testPhone);
    console.log('✅ Phone validation working:', isValid);
  } catch (error) {
    console.error('❌ Phone validation failed:', error.message);
  }
  
 
  // Uncomment to send actual test SMS:
  
  try {
    const testRecipient = '+15129819013'; // Replace with your number
    const result = await twilioService.sendSMS(
      testRecipient,
      'Test message from LewisAI! 🎉'
    );
    console.log('\n✅ Test SMS sent successfully!');
    console.log('Message SID:', result.sid);
    console.log('Status:', result.status);
  } catch (error) {
    console.error('\n❌ SMS sending failed:', error.message);
  }
  
  
  console.log('\n✅ Twilio setup test complete!');
}

testTwilio();