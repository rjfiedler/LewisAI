# SMS AI Assistant

An SMS-based AI assistant powered by ChatGPT that responds to text messages with intelligent responses.

## Features

- 📱 SMS-based interaction via Twilio
- 🤖 Powered by OpenAI's ChatGPT
- 💾 Conversation history storage
- 🔒 Rate limiting for security
- 📊 PostgreSQL database for persistence

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Twilio account with phone number
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/sms-ai-assistant.git
cd sms-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your actual credentials

5. Set up the database:
```bash
# Create PostgreSQL database
createdb sms_assistant
```

6. Start the application:
```bash
# Development
npm run dev

# Production
npm start
```

## Configuration

### Twilio Setup
1. Log into Twilio Console
2. Get a phone number
3. Configure webhook URL: `https://your-domain.com/sms`

### Environment Variables
See `.env.example` for all required environment variables.

## Project Structure

```
├── src/
│   ├── handlers/       # Request handlers
│   ├── models/         # Database models
│   ├── services/       # External service integrations
│   ├── utils/          # Utility functions
│   └── app.js          # Application entry point
├── config/             # Configuration files
├── tests/              # Test files
└── docker-compose.yml  # Docker configuration
```

## API Endpoints

- `POST /sms` - Webhook endpoint for incoming SMS messages

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Deployment

The application can be deployed to:
- Heroku
- Railway
- Render
- DigitalOcean App Platform
- AWS EC2

See deployment guides in `/docs` (coming soon)

## Cost Estimates

For ~1000 messages/month:
- SMS (Twilio): ~$10-15
- OpenAI API: ~$5-10
- Hosting: ~$5-10
- Total: ~$20-35/month

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
