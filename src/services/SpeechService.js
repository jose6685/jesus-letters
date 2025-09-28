/**
 * 語音播放服務
 * 使用 Web Speech API 實現文字轉語音功能
 */
class SpeechService {
  constructor() {
    this.synthesis = window.speechSynthesis
    this.currentUtterance = null
    this.isPlaying = false
    this.isPaused = false
    
    // 檢查瀏覽器支援
    this.isSupported = 'speechSynthesis' in window
    
    // 語音設定
    this.defaultSettings = {
      lang: 'zh-TW',
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0
    }
  }

  /**
   * 檢查瀏覽器是否支援語音合成
   */
  isSupported() {
    return this.isSupported
  }

  /**
   * 獲取可用的語音列表
   */
  getVoices() {
    return this.synthesis.getVoices()
  }

  /**
   * 獲取中文語音
   */
  getChineseVoices() {
    const voices = this.getVoices()
    return voices.filter(voice => 
      voice.lang.includes('zh') || 
      voice.lang.includes('cmn') ||
      voice.name.includes('Chinese')
    )
  }

  /**
   * 播放文字
   * @param {string} text - 要播放的文字
   * @param {object} options - 播放選項
   */
  speak(text, options = {}) {
    if (!this.isSupported) {
      console.warn('瀏覽器不支援語音合成功能')
      return Promise.reject(new Error('瀏覽器不支援語音合成功能'))
    }

    // 停止當前播放
    this.stop()

    // 清理文字（移除 HTML 標籤）
    const cleanText = this.cleanText(text)
    
    if (!cleanText.trim()) {
      return Promise.reject(new Error('沒有可播放的文字'))
    }

    return new Promise((resolve, reject) => {
      this.currentUtterance = new SpeechSynthesisUtterance(cleanText)
      
      // 設定語音參數
      const settings = { ...this.defaultSettings, ...options }
      this.currentUtterance.lang = settings.lang
      this.currentUtterance.rate = settings.rate
      this.currentUtterance.pitch = settings.pitch
      this.currentUtterance.volume = settings.volume

      // 選擇中文語音
      const chineseVoices = this.getChineseVoices()
      if (chineseVoices.length > 0) {
        this.currentUtterance.voice = chineseVoices[0]
      }

      // 事件監聽
      this.currentUtterance.onstart = () => {
        this.isPlaying = true
        this.isPaused = false
        console.log('開始播放語音')
      }

      this.currentUtterance.onend = () => {
        this.isPlaying = false
        this.isPaused = false
        this.currentUtterance = null
        console.log('語音播放結束')
        resolve()
      }

      this.currentUtterance.onerror = (event) => {
        this.isPlaying = false
        this.isPaused = false
        this.currentUtterance = null
        console.error('語音播放錯誤:', event.error)
        reject(new Error(`語音播放錯誤: ${event.error}`))
      }

      this.currentUtterance.onpause = () => {
        this.isPaused = true
        console.log('語音播放暫停')
      }

      this.currentUtterance.onresume = () => {
        this.isPaused = false
        console.log('語音播放恢復')
      }

      // 開始播放
      this.synthesis.speak(this.currentUtterance)
    })
  }

  /**
   * 暫停播放
   */
  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.synthesis.pause()
    }
  }

  /**
   * 恢復播放
   */
  resume() {
    if (this.isPlaying && this.isPaused) {
      this.synthesis.resume()
    }
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.isPlaying) {
      this.synthesis.cancel()
      this.isPlaying = false
      this.isPaused = false
      this.currentUtterance = null
    }
  }

  /**
   * 獲取播放狀態
   */
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isSupported: this.isSupported
    }
  }

  /**
   * 清理文字，移除 HTML 標籤和多餘空白
   * @param {string} text - 原始文字
   */
  cleanText(text) {
    if (!text) return ''
    
    return text
      // 移除 HTML 標籤
      .replace(/<[^>]*>/g, '')
      // 移除多餘的空白字符
      .replace(/\s+/g, ' ')
      // 移除首尾空白
      .trim()
      // 將常見的標點符號替換為適合語音的停頓
      .replace(/[。！？]/g, '。 ')
      .replace(/[，、]/g, '， ')
  }

  /**
   * 分段播放長文字
   * @param {string} text - 要播放的文字
   * @param {number} maxLength - 每段最大長度
   * @param {object} options - 播放選項
   */
  async speakInChunks(text, maxLength = 200, options = {}) {
    const cleanText = this.cleanText(text)
    const chunks = this.splitTextIntoChunks(cleanText, maxLength)
    
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].trim()) {
        await this.speak(chunks[i], options)
        // 短暫停頓
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
  }

  /**
   * 將文字分割成適當的段落
   * @param {string} text - 原始文字
   * @param {number} maxLength - 每段最大長度
   */
  splitTextIntoChunks(text, maxLength) {
    const sentences = text.split(/[。！？]/)
    const chunks = []
    let currentChunk = ''

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      if (currentChunk.length + trimmedSentence.length <= maxLength) {
        currentChunk += (currentChunk ? '。' : '') + trimmedSentence
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '。')
        }
        currentChunk = trimmedSentence
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk + '。')
    }

    return chunks
  }
}

// 創建單例實例
const speechService = new SpeechService()

export default speechService