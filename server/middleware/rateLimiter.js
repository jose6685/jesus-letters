import rateLimit from 'express-rate-limit'

/**
 * 通用速率限制器
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100, // 每個IP最多100個請求
  message: {
    error: '請求過於頻繁，請稍後再試',
    retryAfter: '15分鐘後重試'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ 速率限制觸發 - IP: ${req.ip}, Path: ${req.path}`)
    res.status(429).json({
      error: '請求過於頻繁',
      message: '您的請求次數已達到限制，請稍後再試',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      limit: req.rateLimit.limit,
      remaining: req.rateLimit.remaining
    })
  }
})

/**
 * AI服務專用速率限制器（更嚴格）
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分鐘
  max: 10, // 每個IP每分鐘最多10個AI請求
  message: {
    error: 'AI請求過於頻繁，請稍後再試',
    retryAfter: '1分鐘後重試'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ AI速率限制觸發 - IP: ${req.ip}, Path: ${req.path}`)
    res.status(429).json({
      error: 'AI請求過於頻繁',
      message: 'AI服務請求次數已達到限制，請稍後再試',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      limit: req.rateLimit.limit,
      remaining: req.rateLimit.remaining,
      suggestion: '請等待1分鐘後再次嘗試，或檢查您的請求是否過於頻繁'
    })
  },
  skip: (req) => {
    // 跳過健康檢查和狀態查詢
    return req.path.includes('/status') || req.path.includes('/health')
  }
})

/**
 * 健康檢查專用速率限制器（寬鬆）
 */
export const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分鐘
  max: 60, // 每個IP每分鐘最多60個健康檢查請求
  message: {
    error: '健康檢查請求過於頻繁',
    retryAfter: '1分鐘後重試'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`⚠️ 健康檢查速率限制觸發 - IP: ${req.ip}, Path: ${req.path}`)
    res.status(429).json({
      error: '健康檢查請求過於頻繁',
      message: '健康檢查請求次數已達到限制，請稍後再試',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    })
  }
})

/**
 * 創建自定義速率限制器
 */
export function createCustomLimiter(options = {}) {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15分鐘
    max: 100,
    message: {
      error: '請求過於頻繁，請稍後再試'
    },
    standardHeaders: true,
    legacyHeaders: false
  }

  return rateLimit({
    ...defaultOptions,
    ...options,
    handler: (req, res) => {
      console.log(`⚠️ 自定義速率限制觸發 - IP: ${req.ip}, Path: ${req.path}`)
      res.status(429).json({
        error: options.message?.error || '請求過於頻繁',
        message: '您的請求次數已達到限制，請稍後再試',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        limit: req.rateLimit.limit,
        remaining: req.rateLimit.remaining
      })
    }
  })
}

/**
 * 速率限制中間件工廠
 */
export const rateLimiters = {
  general: generalLimiter,
  ai: aiLimiter,
  health: healthLimiter,
  custom: createCustomLimiter
}