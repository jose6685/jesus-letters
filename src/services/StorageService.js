/**
 * 本地存儲服務
 * 管理用戶的對話記錄、應用設置和數據持久化
 */
class StorageService {
  constructor() {
    this.storageKey = 'jesusLetters'
    this.settingsKey = 'jesusLettersSettings'
    this.statsKey = 'jesusLettersStats'
    
    // 初始化存儲
    this.initStorage()
  }

  /**
   * 初始化存儲
   */
  initStorage() {
    try {
      // 檢查localStorage是否可用
      if (!this.isLocalStorageAvailable()) {
        console.warn('⚠️ localStorage不可用，使用內存存儲')
        this.useMemoryStorage = true
        this.memoryStorage = new Map()
        return
      }

      // 初始化默認數據結構
      if (!localStorage.getItem(this.storageKey)) {
        localStorage.setItem(this.storageKey, JSON.stringify([]))
      }

      if (!localStorage.getItem(this.settingsKey)) {
        const defaultSettings = {
          theme: 'light',
          language: 'zh-TW',
          notifications: true,
          autoSave: true,
          exportFormat: 'txt'
        }
        localStorage.setItem(this.settingsKey, JSON.stringify(defaultSettings))
      }

      if (!localStorage.getItem(this.statsKey)) {
        const defaultStats = {
          totalLetters: 0,
          daysUsed: 0,
          monthlyLetters: 0,
          firstUseDate: new Date().toISOString(),
          lastUseDate: new Date().toISOString(),
          topicCounts: {}
        }
        localStorage.setItem(this.statsKey, JSON.stringify(defaultStats))
      }

      console.log('✅ 存儲服務初始化成功')
    } catch (error) {
      console.error('❌ 存儲服務初始化失敗:', error)
      this.useMemoryStorage = true
      this.memoryStorage = new Map()
    }
  }

  /**
   * 檢查localStorage是否可用
   */
  isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * 保存對話記錄
   * @param {Object} letterData - 對話數據
   * @returns {Promise<string>} 記錄ID
   */
  async saveLetter(letterData) {
    try {
      const letterId = this.generateId()
      const timestamp = new Date().toISOString()
      
      const letterRecord = {
        id: letterId,
        timestamp,
        userInput: letterData.userInput,
        aiResponse: letterData.aiResponse,
        metadata: {
          processingTime: letterData.processingTime || 0,
          aiService: letterData.aiService || 'unknown',
          version: '3.0'
        }
      }

      // 獲取現有記錄
      const letters = await this.getAllLetters()
      letters.unshift(letterRecord) // 新記錄放在最前面

      // 保存更新後的記錄
      await this.setItem(this.storageKey, letters)

      // 更新統計數據
      await this.updateStats(letterData.userInput.topic)

      console.log(`✅ 對話記錄已保存: ${letterId}`)
      return letterId

    } catch (error) {
      console.error('❌ 保存對話記錄失敗:', error)
      throw new Error('保存失敗')
    }
  }

  /**
   * 獲取所有對話記錄
   * @returns {Promise<Array>} 對話記錄數組
   */
  async getAllLetters() {
    try {
      const letters = await this.getItem(this.storageKey, [])
      return Array.isArray(letters) ? letters : []
    } catch (error) {
      console.error('❌ 獲取對話記錄失敗:', error)
      return []
    }
  }

  /**
   * 根據ID獲取特定對話記錄
   * @param {string} letterId - 記錄ID
   * @returns {Promise<Object|null>} 對話記錄
   */
  async getLetterById(letterId) {
    try {
      const letters = await this.getAllLetters()
      return letters.find(letter => letter.id === letterId) || null
    } catch (error) {
      console.error('❌ 獲取對話記錄失敗:', error)
      return null
    }
  }

  /**
   * 搜索對話記錄
   * @param {string} query - 搜索關鍵詞
   * @param {Object} filters - 篩選條件
   * @returns {Promise<Array>} 搜索結果
   */
  async searchLetters(query = '', filters = {}) {
    try {
      const letters = await this.getAllLetters()
      
      let filteredLetters = letters

      // 按主題篩選
      if (filters.topic && filters.topic !== 'all') {
        filteredLetters = filteredLetters.filter(letter => 
          letter.userInput.topic === filters.topic
        )
      }

      // 按日期範圍篩選
      if (filters.startDate) {
        const startDate = new Date(filters.startDate)
        filteredLetters = filteredLetters.filter(letter => 
          new Date(letter.timestamp) >= startDate
        )
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        filteredLetters = filteredLetters.filter(letter => 
          new Date(letter.timestamp) <= endDate
        )
      }

      // 關鍵詞搜索
      if (query.trim()) {
        const searchQuery = query.toLowerCase()
        filteredLetters = filteredLetters.filter(letter => {
          const searchableText = [
            letter.userInput.nickname || '',
            letter.userInput.situation || '',
            letter.aiResponse.jesusLetter || '',
            letter.aiResponse.guidedPrayer || '',
            letter.aiResponse.coreMessage || ''
          ].join(' ').toLowerCase()
          
          return searchableText.includes(searchQuery)
        })
      }

      // 排序
      const sortBy = filters.sortBy || 'date'
      const sortOrder = filters.sortOrder || 'desc'

      filteredLetters.sort((a, b) => {
        let comparison = 0
        
        switch (sortBy) {
          case 'date':
            comparison = new Date(a.timestamp) - new Date(b.timestamp)
            break
          case 'topic':
            comparison = (a.userInput.topic || '').localeCompare(b.userInput.topic || '')
            break
          case 'nickname':
            comparison = (a.userInput.nickname || '').localeCompare(b.userInput.nickname || '')
            break
        }

        return sortOrder === 'desc' ? -comparison : comparison
      })

      return filteredLetters

    } catch (error) {
      console.error('❌ 搜索對話記錄失敗:', error)
      return []
    }
  }

  /**
   * 刪除對話記錄
   * @param {string} letterId - 記錄ID
   * @returns {Promise<boolean>} 是否成功
   */
  async deleteLetter(letterId) {
    try {
      const letters = await this.getAllLetters()
      const filteredLetters = letters.filter(letter => letter.id !== letterId)
      
      if (filteredLetters.length === letters.length) {
        console.warn(`⚠️ 未找到要刪除的記錄: ${letterId}`)
        return false
      }

      await this.setItem(this.storageKey, filteredLetters)
      console.log(`✅ 對話記錄已刪除: ${letterId}`)
      return true

    } catch (error) {
      console.error('❌ 刪除對話記錄失敗:', error)
      return false
    }
  }

  /**
   * 清空所有對話記錄
   * @returns {Promise<boolean>} 是否成功
   */
  async clearAllLetters() {
    try {
      await this.setItem(this.storageKey, [])
      
      // 重置統計數據
      const defaultStats = {
        totalLetters: 0,
        daysUsed: 0,
        monthlyLetters: 0,
        firstUseDate: new Date().toISOString(),
        lastUseDate: new Date().toISOString(),
        topicCounts: {}
      }
      await this.setItem(this.statsKey, defaultStats)

      console.log('✅ 所有對話記錄已清空')
      return true

    } catch (error) {
      console.error('❌ 清空對話記錄失敗:', error)
      return false
    }
  }

  /**
   * 獲取統計數據
   * @returns {Promise<Object>} 統計數據
   */
  async getStats() {
    try {
      const stats = await this.getItem(this.statsKey, {})
      const letters = await this.getAllLetters()

      // 實時計算統計數據
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const monthlyLetters = letters.filter(letter => {
        const letterDate = new Date(letter.timestamp)
        return letterDate.getMonth() === currentMonth && 
               letterDate.getFullYear() === currentYear
      }).length

      // 計算使用天數
      const usedDates = new Set()
      letters.forEach(letter => {
        const date = new Date(letter.timestamp).toDateString()
        usedDates.add(date)
      })

      // 計算主題統計
      const topicCounts = {}
      letters.forEach(letter => {
        const topic = letter.userInput.topic || '其他'
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      })

      return {
        totalLetters: letters.length,
        daysUsed: usedDates.size,
        monthlyLetters,
        firstUseDate: stats.firstUseDate || (letters.length > 0 ? letters[letters.length - 1].timestamp : new Date().toISOString()),
        lastUseDate: letters.length > 0 ? letters[0].timestamp : new Date().toISOString(),
        topicCounts
      }

    } catch (error) {
      console.error('❌ 獲取統計數據失敗:', error)
      return {
        totalLetters: 0,
        daysUsed: 0,
        monthlyLetters: 0,
        firstUseDate: new Date().toISOString(),
        lastUseDate: new Date().toISOString(),
        topicCounts: {}
      }
    }
  }

  /**
   * 更新統計數據
   * @param {string} topic - 主題
   */
  async updateStats(topic) {
    try {
      const stats = await this.getItem(this.statsKey, {})
      
      stats.totalLetters = (stats.totalLetters || 0) + 1
      stats.lastUseDate = new Date().toISOString()
      
      if (!stats.firstUseDate) {
        stats.firstUseDate = stats.lastUseDate
      }

      // 更新主題統計
      if (!stats.topicCounts) {
        stats.topicCounts = {}
      }
      stats.topicCounts[topic] = (stats.topicCounts[topic] || 0) + 1

      await this.setItem(this.statsKey, stats)

    } catch (error) {
      console.error('❌ 更新統計數據失敗:', error)
    }
  }

  /**
   * 獲取應用設置
   * @returns {Promise<Object>} 設置對象
   */
  async getSettings() {
    try {
      return await this.getItem(this.settingsKey, {})
    } catch (error) {
      console.error('❌ 獲取設置失敗:', error)
      return {}
    }
  }

  /**
   * 保存應用設置
   * @param {Object} settings - 設置對象
   * @returns {Promise<boolean>} 是否成功
   */
  async saveSettings(settings) {
    try {
      const currentSettings = await this.getSettings()
      const updatedSettings = { ...currentSettings, ...settings }
      
      await this.setItem(this.settingsKey, updatedSettings)
      console.log('✅ 設置已保存')
      return true

    } catch (error) {
      console.error('❌ 保存設置失敗:', error)
      return false
    }
  }

  /**
   * 匯出數據
   * @param {string} format - 匯出格式 (json, csv)
   * @returns {Promise<string>} 匯出的數據
   */
  async exportData(format = 'json') {
    try {
      const letters = await this.getAllLetters()
      const stats = await this.getStats()
      const settings = await this.getSettings()

      const exportData = {
        version: '3.0',
        exportDate: new Date().toISOString(),
        letters,
        stats,
        settings
      }

      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(exportData, null, 2)
        
        case 'csv':
          return this.convertToCSV(letters)
        
        default:
          throw new Error(`不支持的匯出格式: ${format}`)
      }

    } catch (error) {
      console.error('❌ 匯出數據失敗:', error)
      throw error
    }
  }

  /**
   * 匯入數據
   * @param {string} data - 匯入的數據
   * @param {boolean} merge - 是否合併現有數據
   * @returns {Promise<boolean>} 是否成功
   */
  async importData(data, merge = false) {
    try {
      const importData = JSON.parse(data)
      
      if (!importData.letters || !Array.isArray(importData.letters)) {
        throw new Error('無效的數據格式')
      }

      if (merge) {
        // 合併數據
        const existingLetters = await this.getAllLetters()
        const mergedLetters = [...importData.letters, ...existingLetters]
        
        // 去重（基於ID）
        const uniqueLetters = mergedLetters.filter((letter, index, self) => 
          index === self.findIndex(l => l.id === letter.id)
        )
        
        await this.setItem(this.storageKey, uniqueLetters)
      } else {
        // 覆蓋數據
        await this.setItem(this.storageKey, importData.letters)
      }

      // 匯入設置（如果存在）
      if (importData.settings) {
        await this.saveSettings(importData.settings)
      }

      console.log('✅ 數據匯入成功')
      return true

    } catch (error) {
      console.error('❌ 匯入數據失敗:', error)
      return false
    }
  }

  /**
   * 轉換為CSV格式
   * @param {Array} letters - 對話記錄
   * @returns {string} CSV字符串
   */
  convertToCSV(letters) {
    const headers = ['日期', '暱稱', '主題', '情況描述', '耶穌的信', '引導式禱告', '核心信息']
    const csvRows = [headers.join(',')]

    letters.forEach(letter => {
      const row = [
        new Date(letter.timestamp).toLocaleString('zh-TW'),
        `"${(letter.userInput.nickname || '').replace(/"/g, '""')}"`,
        `"${(letter.userInput.topic || '').replace(/"/g, '""')}"`,
        `"${(letter.userInput.situation || '').replace(/"/g, '""')}"`,
        `"${(letter.aiResponse.jesusLetter || '').replace(/"/g, '""')}"`,
        `"${(letter.aiResponse.guidedPrayer || '').replace(/"/g, '""')}"`,
        `"${(letter.aiResponse.coreMessage || '').replace(/"/g, '""')}"`
      ]
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }

  /**
   * 通用存儲方法
   */
  async setItem(key, value) {
    if (this.useMemoryStorage) {
      this.memoryStorage.set(key, value)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }

  /**
   * 通用獲取方法
   */
  async getItem(key, defaultValue = null) {
    if (this.useMemoryStorage) {
      return this.memoryStorage.get(key) || defaultValue
    } else {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    }
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 獲取存儲使用情況
   */
  getStorageInfo() {
    try {
      if (this.useMemoryStorage) {
        return {
          type: 'memory',
          size: this.memoryStorage.size,
          available: true
        }
      }

      // 計算localStorage使用量
      let totalSize = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length
        }
      }

      return {
        type: 'localStorage',
        usedBytes: totalSize,
        usedKB: Math.round(totalSize / 1024),
        available: this.isLocalStorageAvailable()
      }

    } catch (error) {
      return {
        type: 'unknown',
        available: false,
        error: error.message
      }
    }
  }
}

// 創建單例實例
const storageService = new StorageService()

export default storageService