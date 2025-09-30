/**
 * 錯誤處理中間件
 */

/**
 * 404 錯誤處理器
 */
export function notFoundHandler(req, res, next) {
  const error = new Error(`找不到路徑: ${req.originalUrl}`)
  error.status = 404
  error.code = 'NOT_FOUND'
  
  console.log(`❌ 404錯誤 - ${req.method} ${req.originalUrl} - IP: ${req.ip}`)
  
  res.status(404).json({
    error: '找不到請求的資源',
    message: `路徑 ${req.originalUrl} 不存在`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  })
}

/**
 * 全局錯誤處理器
 */
export function globalErrorHandler(err, req, res, next) {
  // 若回應已發送，交給下一個錯誤處理器避免重複回應
  if (res.headersSent) {
    return next(err)
  }

  // 設置默認錯誤狀態碼
  let statusCode = err.status || err.statusCode || 500
  const errorCode = err.code || 'INTERNAL_ERROR'
  
  // 記錄錯誤日誌
  console.error(`❌ 錯誤發生:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })

  // 根據錯誤類型處理
  const isClientError = statusCode >= 400 && statusCode < 500
  let errorResponse = {
    error: isClientError ? '請求錯誤' : '服務器內部錯誤',
    message: err.message || (isClientError ? '請求不合法' : '發生未知錯誤'),
    code: errorCode,
    timestamp: new Date().toISOString(),
    requestId: req.id || generateRequestId()
  }

  // 根據不同錯誤類型自定義回應
  switch (errorCode) {
    case 'VALIDATION_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '輸入驗證失敗',
        details: err.details || []
      }
      break

    case 'AI_SERVICE_ERROR':
      errorResponse = {
        ...errorResponse,
        error: 'AI服務暫時不可用',
        message: '請稍後再試，或聯繫技術支持',
        suggestion: '檢查網絡連接或稍後重試'
      }
      break

    case 'RATE_LIMIT_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '請求過於頻繁',
        retryAfter: err.retryAfter || 60
      }
      break

    case 'AUTHENTICATION_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '身份驗證失敗',
        message: '請檢查您的憑證'
      }
      break

    case 'AUTHORIZATION_ERROR':
      errorResponse = {
        ...errorResponse,
        error: '權限不足',
        message: '您沒有執行此操作的權限'
      }
      break

    default:
      // 生產環境：僅對 5xx 隱藏細節；4xx 保留具體訊息
      if (process.env.NODE_ENV === 'production') {
        if (!isClientError) {
          errorResponse.message = '服務器內部錯誤，請稍後再試'
        }
        delete errorResponse.stack
      } else {
        errorResponse.stack = err.stack
        errorResponse.details = {
          name: err.name,
          message: err.message,
          stack: err.stack
        }
      }
  }

  // 特殊錯誤處理
  if (err.name === 'ValidationError') {
    statusCode = 400
    errorResponse.error = '輸入驗證失敗'
    errorResponse.message = err.message || '請求參數驗證失敗'
    errorResponse.details = Object.values(err.errors || {}).map(e => e.message)
  }

  if (err.name === 'CastError') {
    statusCode = 400
    errorResponse.error = '無效的數據格式'
    errorResponse.message = '請檢查輸入的數據格式'
  }

  if (err.code === 11000) {
    statusCode = 409
    errorResponse.error = '數據衝突'
    errorResponse.message = '該數據已存在'
  }

  // 發送錯誤回應
  res.status(statusCode).json(errorResponse)
}

/**
 * 異步錯誤捕獲包裝器
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 創建自定義錯誤
 */
export class CustomError extends Error {
  constructor(message, statusCode = 500, code = 'CUSTOM_ERROR', details = null) {
    super(message)
    this.name = 'CustomError'
    this.statusCode = statusCode
    this.status = statusCode
    this.code = code
    this.details = details
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * AI服務錯誤
 */
export class AIServiceError extends CustomError {
  constructor(message, details = null) {
    super(message, 503, 'AI_SERVICE_ERROR', details)
    this.name = 'AIServiceError'
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends CustomError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

/**
 * 速率限制錯誤
 */
export class RateLimitError extends CustomError {
  constructor(message, retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * 未處理的Promise拒絕處理器
 */
export function handleUnhandledRejection() {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未處理的Promise拒絕:', reason)
    console.error('Promise:', promise)
    
    // 記錄錯誤但不退出進程（在生產環境中可能需要退出）
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 生產環境檢測到未處理的Promise拒絕，考慮重啟服務')
    }
  })
}

/**
 * 未捕獲異常處理器
 */
export function handleUncaughtException() {
  process.on('uncaughtException', (error) => {
    console.error('❌ 未捕獲的異常:', error)
    
    // 記錄錯誤並優雅退出
    console.error('🚨 服務器將在5秒後關閉...')
    
    setTimeout(() => {
      process.exit(1)
    }, 5000)
  })
}

/**
 * 生成請求ID
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

/**
 * 錯誤日誌記錄器
 */
export function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    context
  }

  console.error('📝 錯誤日誌:', JSON.stringify(errorLog, null, 2))
  
  // 在生產環境中，這裡可以發送到日誌服務
  if (process.env.NODE_ENV === 'production') {
    // 發送到外部日誌服務（如 Winston, Sentry 等）
  }
}

/**
 * 健康檢查錯誤處理
 */
export function healthCheckErrorHandler(error) {
  console.error('❌ 健康檢查錯誤:', error.message)
  
  return {
    status: 'unhealthy',
    error: error.message,
    timestamp: new Date().toISOString(),
    code: error.code || 'HEALTH_CHECK_ERROR'
  }
}