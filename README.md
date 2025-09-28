# JesusLetter - AI-Powered Letter Writing Application

A modern web application that helps users write personalized letters using AI assistance from Gemini and OpenAI.

## Features

- 🤖 AI-powered letter writing with Gemini and OpenAI integration
- 📱 Responsive design with modern UI
- 🔒 Secure API with rate limiting and CORS protection
- 🚀 Easy deployment with Docker
- ⚡ Fast development with Vite and Express
- 📊 Health monitoring and logging

## Tech Stack

### Frontend
- **Vite** - Fast build tool and development server
- **Vanilla JavaScript** - Lightweight and fast
- **CSS3** - Modern styling with responsive design
- **Service Worker** - Offline capabilities

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **Express Rate Limit** - Rate limiting middleware
- **CORS** - Cross-origin resource sharing

### AI Services
- **Google Gemini API** - Advanced AI text generation
- **OpenAI API** - GPT-powered text generation

## Quick Start

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose (for deployment)
- API keys for Gemini and/or OpenAI

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd JesusLtter
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development servers**
   
   Frontend (Terminal 1):
   ```bash
   npm run dev
   ```
   
   Backend (Terminal 2):
   ```bash
   npm run server
   ```

5. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3002/api
   - Health Check: http://localhost:3002/api/health

### Production Deployment

#### Using Docker (Recommended)

1. **Quick deployment**
   ```bash
   # On Windows
   deploy.bat
   
   # On Linux/Mac
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Manual Docker deployment**
   ```bash
   # Build and start containers
   docker-compose up --build -d
   
   # View logs
   docker-compose logs -f
   
   # Stop containers
   docker-compose down
   ```

#### Manual Deployment

1. **Build frontend**
   ```bash
   npm run build
   ```

2. **Start backend**
   ```bash
   NODE_ENV=production node server/app.js
   ```

3. **Serve frontend**
   Use any static file server to serve the `dist` directory.

## Environment Variables

Create a `.env` file in the root directory:

```env
# Application Configuration
APP_NAME=JesusLetter
APP_VERSION=1.0.0
NODE_ENV=development
PORT=3002

# AI Service API Keys
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Server Configuration
CORS_ORIGIN=http://localhost:3001
JWT_SECRET=your-jwt-secret-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3002/api
VITE_APP_NAME=JesusLetter
VITE_APP_VERSION=1.0.0
```

## API Endpoints

### Health Check
- `GET /api/health` - Application health status

### AI Services
- `GET /api/ai/status` - AI services status
- `POST /api/ai/generate` - Generate AI content

## Project Structure

```
JesusLtter/
├── src/                    # Frontend source code
│   ├── config/            # Configuration files
│   ├── js/                # JavaScript modules
│   ├── css/               # Stylesheets
│   └── index.html         # Main HTML file
├── server/                # Backend source code
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   └── app.js            # Main server file
├── dist/                 # Built frontend files
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile.frontend   # Frontend Docker configuration
├── Dockerfile.backend    # Backend Docker configuration
├── nginx.conf           # Nginx configuration
├── deploy.sh            # Linux/Mac deployment script
├── deploy.bat           # Windows deployment script
└── package.json         # Node.js dependencies
```

## Development

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server

### Code Style

- Use ES6+ features
- Follow consistent naming conventions
- Add comments for complex logic
- Use meaningful variable and function names

## Security Features

- **Helmet.js** - Sets various HTTP headers for security
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Prevents API abuse
- **Input Validation** - Validates and sanitizes user input
- **Environment Variables** - Sensitive data protection

## Monitoring and Logging

- **Morgan** - HTTP request logging
- **Health Check Endpoint** - Application status monitoring
- **Error Handling** - Comprehensive error handling and logging
- **Docker Health Checks** - Container health monitoring

## Troubleshooting

### Common Issues

1. **Port conflicts**
   - Change ports in `.env` file
   - Kill processes using the ports

2. **API key errors**
   - Verify API keys in `.env` file
   - Check API key permissions and quotas

3. **Docker issues**
   - Ensure Docker is running
   - Check Docker Compose version compatibility

4. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install --legacy-peer-deps`
   - Check Node.js version compatibility

### Logs

- **Development**: Check browser console and terminal output
- **Production**: Use `docker-compose logs -f` for container logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review the logs for error messages
- Open an issue on the repository

---

Made with ❤️ for better communication through AI-assisted letter writing.