// API配置
export const API_CONFIG = {
  // 後端API基礎URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api',
  
  // API端點
  ENDPOINTS: {
    // AI服務
    AI_GENERATE: '/ai/generate',
    AI_STATUS: '/ai/status',
    AI_TEST: '/ai/test',
    
    // 健康檢查
    HEALTH: '/health',
    HEALTH_DETAILED: '/health/detailed',
    HEALTH_READY: '/health/ready',
    HEALTH_LIVE: '/health/live'
  },
  
  // 請求配置
  TIMEOUT: 30000, // 30秒超時
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒重試延遲
  
  // 請求頭
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}

// API請求工具函數
export class APIClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  // 通用請求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      method: 'GET',
      headers: { ...API_CONFIG.HEADERS },
      timeout: this.timeout,
      ...options
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API請求失敗: ${url}`, error)
      throw error
    }
  }

  // GET請求
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url)
  }

  // POST請求
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT請求
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE請求
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    })
  }
}

// 創建API客戶端實例
export const apiClient = new APIClient()

// AI服務API
export const aiAPI = {
  // 生成AI回復
  async generate(data) {
    return apiClient.post(API_CONFIG.ENDPOINTS.AI_GENERATE, data)
  },

  // 獲取AI服務狀態
  async getStatus() {
    return apiClient.get(API_CONFIG.ENDPOINTS.AI_STATUS)
  },

  // 測試AI服務
  async test() {
    return apiClient.get(API_CONFIG.ENDPOINTS.AI_TEST)
  }
}

// 健康檢查API
export const healthAPI = {
  // 基本健康檢查
  async check() {
    return apiClient.get(API_CONFIG.ENDPOINTS.HEALTH)
  },

  // 詳細健康檢查
  async detailed() {
    return apiClient.get(API_CONFIG.ENDPOINTS.HEALTH_DETAILED)
  },

  // 就緒檢查
  async ready() {
    return apiClient.get(API_CONFIG.ENDPOINTS.HEALTH_READY)
  },

  // 存活檢查
  async live() {
    return apiClient.get(API_CONFIG.ENDPOINTS.HEALTH_LIVE)
  }
}