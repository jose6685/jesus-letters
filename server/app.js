import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// 導入路由
import aiRoutes from './routes/ai.js'
import healthRoutes from './routes/health.js'

// 導入中間件
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/logger.js'

// 配置環境變量
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3002

// 安全中間件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://api.openai.com"]
    }
  }
}))

// CORS配置（支援以環境變數 ALLOWED_ORIGINS 覆蓋生產環境允許來源，逗號分隔）
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS
const defaultProdOrigins = [
  'https://your-domain.com', 
  'https://your-app.netlify.app',
  'https://jesus-letters-3-tb724zmns-jose6685-6249s-projects.vercel.app'
]
const devOrigins = [
  'http://localhost:5173', 
  'http://127.0.0.1:5173', 
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://localhost:4173',
  'https://jesus-letters-3-tb724zmns-jose6685-6249s-projects.vercel.app'
]
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (allowedOriginsEnv ? allowedOriginsEnv.split(',').map(s => s.trim()).filter(Boolean) : defaultProdOrigins)
  : devOrigins

const corsOptions = {
  origin: (origin, callback) => {
    // 允許無來源（如同源或非瀏覽器請求）
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error(`Not allowed by CORS: ${origin}`))
  },
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // 生產環境限制更嚴格
  message: {
    error: '請求過於頻繁，請稍後再試',
    retryAfter: '15分鐘'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳過健康檢查端點
    return req.path === '/api/health'
  }
})
app.use('/api/', limiter)

// AI請求特殊限制（更嚴格）
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分鐘
  max: process.env.NODE_ENV === 'production' ? 3 : 10,
  message: {
    error: 'AI請求過於頻繁，請稍後再試',
    retryAfter: '1分鐘'
  }
})
app.use('/api/ai/', aiLimiter)

// 基本中間件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 自定義中間件
app.use(requestLogger)

// 靜態文件服務（如果需要）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')))
}

// 路由設置
app.use('/api/health', healthRoutes)
app.use('/api/ai', aiRoutes)

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '耶穌的信 3.0 API',
    version: '3.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      ai: '/api/ai/generate'
    }
  })
})

// 404處理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '端點不存在',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

// 錯誤處理中間件（必須放在最後）
app.use(notFoundHandler)
app.use(globalErrorHandler)

// 優雅關閉處理
process.on('SIGTERM', () => {
  console.log('🛑 收到SIGTERM信號，正在優雅關閉服務器...')
  server.close(() => {
    console.log('✅ 服務器已關閉')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 收到SIGINT信號，正在優雅關閉服務器...')
  server.close(() => {
    console.log('✅ 服務器已關閉')
    process.exit(0)
  })
})

// 未捕獲的異常處理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕獲的異常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未處理的Promise拒絕:', reason)
  console.error('Promise:', promise)
  process.exit(1)
})

export default app