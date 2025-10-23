require('dotenv').config();
const express = require('express');
const SMSHandler = require('./handlers/smsHandler');
const RateLimiter = require('./utils/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize handlers
const smsHandler = new SMSHandler();
const rateLimiter = new RateLimiter(5, 60000); // 5 requests per minute

// Rate limiting middleware
const checkRateLimit = (req, res, next) => {
  const identifier = req.body.From || req.ip;
  
  if (rateLimiter.isRateLimited(identifier)) {
    console.log('⚠️  Rate limit exceeded for:', identifier);
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.'
    });
  }
  
  next();
};

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'LewisAI SMS Service',
    status: 'running',
    version: '1.0.0',
    features: [
      'SMS messaging via Twilio',
      'AI responses via OpenAI',
      'Conversation history storage',
      'Rate limiting'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Twilio webhook for incoming SMS
app.post('/sms/webhook', checkRateLimit, (req, res) => {
  smsHandler.handleIncomingMessage(req, res);
});

// API endpoint to send SMS
app.post('/sms/send', checkRateLimit, (req, res) => {
  smsHandler.sendMessage(req, res);
});

// Get conversation history
app.get('/conversations/:phoneNumber', (req, res) => {
  smsHandler.getConversationHistory(req, res);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 LewisAI SMS Service started');
  console.log('📱 Server running on port:', PORT);
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  / - Service info');
  console.log('  GET  /health - Health check');
  console.log('  POST /sms/webhook - Twilio webhook');
  console.log('  POST /sms/send - Send SMS');
  console.log('  GET  /conversations/:phoneNumber - Get conversation history');
  console.log('');
  console.log('✅ All services initialized and ready!');
});

module.exports = app;