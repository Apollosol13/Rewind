# REWND Backend API 🚀

Backend server for REWND app - handles image compression, monitoring, and background jobs.

## 🎯 Features

- **Image Processing**: 88% quality compression, auto-resize to 1200px
- **Monitoring**: P95 latency tracking, auth failure alerts
- **Background Jobs**: Daily notifications, cleanup tasks
- **Rate Limiting**: Spam protection and abuse prevention
- **Health Checks**: Server status and metrics endpoints

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Railway Pro account
- Supabase project

### Local Development

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Run the server**:
```bash
npm run dev
```

Server runs on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed system metrics

### Photos
- `POST /api/photos/upload` - Upload and compress photos
- `GET /api/photos/test` - Test endpoint

### Monitoring
- `GET /api/monitoring/metrics` - Prometheus metrics
- `GET /api/monitoring/test` - Test endpoint

## 🔧 Environment Variables

See `.env.example` for all configuration options.

### Required:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key from Supabase

### Optional:
- `PORT` - Server port (default: 3000)
- `COMPRESSION_QUALITY` - Image quality 0-100 (default: 88)
- `ALERT_P95_MS` - P95 latency alert threshold (default: 2500)

## 🚢 Railway Deployment

1. **Connect to Railway**:
```bash
railway login
railway link
```

2. **Set environment variables** in Railway dashboard

3. **Deploy**:
```bash
git push railway main
```

Railway will automatically:
- Install dependencies
- Run health checks
- Start the server
- Provide a public URL

## 📊 Monitoring

Health check endpoint: `https://your-app.railway.app/health`

Railway will automatically monitor:
- Uptime
- Response times
- Error rates
- Memory/CPU usage

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── server.js           # Express app entry
│   ├── routes/             # API routes
│   ├── services/           # Business logic (coming soon)
│   ├── jobs/               # Background jobs (coming soon)
│   └── middleware/         # Custom middleware (coming soon)
├── package.json
├── railway.json            # Railway configuration
└── README.md
```

## 🔐 Security

- Helmet.js for security headers
- CORS configuration for Expo apps
- Rate limiting (100 req/15min per IP)
- Environment-based secrets
- Request size limits (10MB)

## 📈 Performance

- Compression middleware for responses
- Response time logging
- Graceful shutdown handling
- Health check endpoints for Railway

## 🐛 Debugging

View logs:
```bash
railway logs
```

## 📝 License

MIT
