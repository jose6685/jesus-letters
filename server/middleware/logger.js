/**
 * 日誌記錄中間件
 */

/**
 * 請求日誌記錄器
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now()
  const requestId = generateRequestId()
  
  // 將請求ID添加到請求對象
  req.id = requestId
  
  // 記錄請求開始
  console.log(`📥 [${requestId}] ${req.method} ${req.originalUrl} - IP: ${req.ip} - 開始處理`)
  
  // 記錄請求詳情（開發環境）
  if (process.env.NODE_ENV === 'development') {
    console.log(`📋 [${requestId}] 請求詳情:`, {
      headers: filterSensitiveHeaders(req.headers),
      query: req.query,
      body: filterSensitiveBody(req.body),
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    })
  }

  // 監聽回應完成
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode
    const statusEmoji = getStatusEmoji(statusCode)
    
    console.log(`📤 [${requestId}] ${req.method} ${req.originalUrl} - ${statusEmoji} ${statusCode} - ${duration}ms`)
    
    // 記錄慢請求
    if (duration > 5000) {
      console.warn(`🐌 [${requestId}] 慢請求警告: ${duration}ms - ${req.method} ${req.originalUrl}`)
    }
    
    // 記錄錯誤狀態碼
    if (statusCode >= 400) {
      console.error(`❌ [${requestId}] 錯誤回應: ${statusCode} - ${req.method} ${req.originalUrl}`)
    }
  })

  // 監聽回應錯誤
  res.on('error', (error) => {
    const duration = Date.now() - startTime
    console.error(`💥 [${requestId}] 回應錯誤: ${error.message} - ${duration}ms`)
  })

  next()
}

/**
 * API日誌記錄器（更詳細）
 */
export function apiLogger(req, res, next) {
  const startTime = Date.now()
  const requestId = req.id || generateRequestId()
  
  // 記錄API請求
  console.log(`🔌 [${requestId}] API請求: ${req.method} ${req.originalUrl}`)
  
  // 記錄請求大小
  const contentLength = req.get('Content-Length')
  if (contentLength) {
    console.log(`📏 [${requestId}] 請求大小: ${contentLength} bytes`)
  }

  // 攔截回應數據
  const originalSend = res.send
  res.send = function(data) {
    const duration = Date.now() - startTime
    
    // 記錄回應信息
    console.log(`📊 [${requestId}] API回應:`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? Buffer.byteLength(data, 'utf8') : 0
    })
    
    // 記錄回應數據（開發環境且非敏感路徑）
    if (process.env.NODE_ENV === 'development' && !isSensitivePath(req.path)) {
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data
        console.log(`📋 [${requestId}] 回應數據:`, filterSensitiveResponse(responseData))
      } catch (error) {
        console.log(`📋 [${requestId}] 回應數據: [無法解析]`)
      }
    }
    
    return originalSend.call(this, data)
  }

  next()
}

/**
 * 錯誤日誌記錄器
 */
export function errorLogger(error, req, res, next) {
  const requestId = req.id || generateRequestId()
  
  console.error(`💥 [${requestId}] 錯誤發生:`, {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })
  
  // 記錄錯誤統計
  logErrorStats(error, req)
  
  next(error)
}

/**
 * 性能監控日誌
 */
export function performanceLogger(req, res, next) {
  const startTime = process.hrtime.bigint()
  const requestId = req.id || generateRequestId()
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint()
    const duration = Number(endTime - startTime) / 1000000 // 轉換為毫秒
    
    // 記錄性能指標
    const performanceData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: Math.round(duration * 100) / 100, // 保留兩位小數
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
    
    console.log(`⚡ [${requestId}] 性能指標:`, performanceData)
    
    // 性能警告
    if (duration > 10000) {
      console.warn(`🚨 [${requestId}] 性能警告: 請求耗時 ${Math.round(duration)}ms`)
    }
  })
  
  next()
}

/**
 * 安全日誌記錄器
 */
export function securityLogger(req, res, next) {
  const requestId = req.id || generateRequestId()
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /<.*>/,
    /union.*select/i,
    /drop.*table/i
  ]
  
  // 檢查可疑請求
  const requestString = JSON.stringify({
    url: req.originalUrl,
    query: req.query,
    body: req.body,
    headers: req.headers
  })
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString))
  
  if (isSuspicious) {
    console.warn(`🛡️ [${requestId}] 可疑請求檢測:`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    })
  }
  
  // 記錄異常IP
  if (isAbnormalIP(req.ip)) {
    console.warn(`🚫 [${requestId}] 異常IP訪問: ${req.ip}`)
  }
  
  next()
}

/**
 * 生成請求ID
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

/**
 * 獲取狀態碼對應的表情符號
 */
function getStatusEmoji(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return '✅'
  if (statusCode >= 300 && statusCode < 400) return '↩️'
  if (statusCode >= 400 && statusCode < 500) return '❌'
  if (statusCode >= 500) return '💥'
  return '❓'
}

/**
 * 過濾敏感請求頭
 */
function filterSensitiveHeaders(headers) {
  const filtered = { ...headers }
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token']
  
  sensitiveHeaders.forEach(header => {
    if (filtered[header]) {
      filtered[header] = '[已隱藏]'
    }
  })
  
  return filtered
}

/**
 * 過濾敏感請求體
 */
function filterSensitiveBody(body) {
  if (!body || typeof body !== 'object') return body
  
  const filtered = { ...body }
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret']
  
  sensitiveFields.forEach(field => {
    if (filtered[field]) {
      filtered[field] = '[已隱藏]'
    }
  })
  
  return filtered
}

/**
 * 過濾敏感回應數據
 */
function filterSensitiveResponse(response) {
  if (!response || typeof response !== 'object') return response
  
  const filtered = { ...response }
  const sensitiveFields = ['apiKey', 'token', 'secret', 'password']
  
  sensitiveFields.forEach(field => {
    if (filtered[field]) {
      filtered[field] = '[已隱藏]'
    }
  })
  
  return filtered
}

/**
 * 檢查是否為敏感路徑
 */
function isSensitivePath(path) {
  const sensitivePaths = ['/api/auth', '/api/admin', '/api/config']
  return sensitivePaths.some(sensitivePath => path.startsWith(sensitivePath))
}

/**
 * 檢查是否為異常IP
 */
function isAbnormalIP(ip) {
  // 簡單的異常IP檢測邏輯
  const abnormalPatterns = [
    /^10\./, // 內網IP（根據需要調整）
    /^192\.168\./, // 內網IP
    /^172\.16\./ // 內網IP
  ]
  
  // 這裡可以添加更複雜的異常檢測邏輯
  return false // 暫時返回false
}

/**
 * 記錄錯誤統計
 */
function logErrorStats(error, req) {
  // 這裡可以實現錯誤統計邏輯
  // 例如：記錄到數據庫、發送到監控系統等
  console.log(`📈 錯誤統計: ${error.name} - ${req.method} ${req.originalUrl}`)
}

/**
 * 日誌級別配置
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

/**
 * 根據環境設置日誌級別
 */
export function getLogLevel() {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return LOG_LEVELS.WARN
    case 'test':
      return LOG_LEVELS.ERROR
    default:
      return LOG_LEVELS.DEBUG
  }
}

/**
 * 條件日誌記錄
 */
export function conditionalLog(level, message, data = null) {
  const currentLevel = getLogLevel()
  
  if (level <= currentLevel) {
    const timestamp = new Date().toISOString()
    const levelName = Object.keys(LOG_LEVELS)[level]
    
    console.log(`[${timestamp}] [${levelName}] ${message}`, data || '')
  }
}