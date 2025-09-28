#!/bin/bash

# JesusLetter Deployment Script
set -e

echo "🚀 Starting JesusLetter deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Application Configuration
APP_NAME=JesusLetter
APP_VERSION=1.0.0
NODE_ENV=production
PORT=3001

# AI Service API Keys (Please update with your actual keys)
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Server Configuration
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-jwt-secret-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=JesusLetter
VITE_APP_VERSION=1.0.0
EOF
    echo "⚠️  Please update the API keys in .env file before running the application"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:3001/api"
    echo "❤️  Health Check: http://localhost:3001/api/health"
    echo ""
    echo "📋 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi