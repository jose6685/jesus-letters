<template>
  <div class="letter-page">
    <div class="letter-container">
      <!-- 頁面標題 -->
      <div class="page-header">
        <button class="back-btn" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          返回
        </button>
        <h2>來自耶穌的信</h2>
        <div class="letter-date">{{ formatDate(letter.createdAt) }}</div>
      </div>

      <!-- 用戶分享摘要 -->
      <div class="share-summary">
        <div class="summary-header">
          <div class="user-info">
            <span class="nickname">{{ letter.nickname }}</span>
            <span class="topic-tag">{{ letter.topic }}</span>
          </div>
        </div>
        <div class="situation-preview">
          {{ letter.situation.substring(0, 100) }}{{ letter.situation.length > 100 ? '...' : '' }}
        </div>
      </div>

      <!-- 耶穌的回信 -->
      <div class="jesus-letter-section">
        <div class="section-header">
          <div class="section-icon">✉️</div>
          <h3>耶穌的回信</h3>
        </div>
        <div class="letter-content">
          <div class="letter-text" v-html="formatLetterText(letter.jesusLetter)"></div>
        </div>
      </div>

      <!-- 引導式禱告 -->
      <div v-if="letter.guidedPrayer" class="prayer-section">
        <div class="section-header">
          <div class="section-icon">🙏</div>
          <h3>我來為您禱告</h3>
          <button 
            class="voice-btn" 
            @click="handleVoiceToggle" 
            :title="voiceStatus.isPlaying ? (voiceStatus.isPaused ? '恢復播放' : '暫停播放') : '播放禱告語音'"
          >
            <svg v-if="!voiceStatus.isPlaying || voiceStatus.isPaused" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <polygon points="5,3 19,12 5,21" fill="currentColor"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
              <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
            </svg>
            <span class="voice-btn-text">{{ (voiceStatus.isPlaying && !voiceStatus.isPaused) ? '暫停' : '播放' }}</span>
          </button>
        </div>
        <div class="prayer-content">
          <div class="prayer-note">如果您願意，可以跟著一起唸：</div>
          <div class="prayer-text" v-html="formatPrayerText(letter.guidedPrayer)"></div>
        </div>
      </div>

      <!-- 聖經經文 -->
      <div v-if="normalizedBiblicalReferences.length > 0" class="scripture-section">
        <div class="section-header">
          <div class="section-icon">📖</div>
          <h3>相關經文</h3>
        </div>
        <div class="scripture-list">
          <div 
            v-for="(reference, index) in normalizedBiblicalReferences" 
            :key="index"
            class="scripture-item"
          >
            {{ reference }}
          </div>
        </div>
      </div>

      <!-- 核心信息 -->
      <div v-if="letter.coreMessage" class="core-message-section">
        <div class="section-header">
          <div class="section-icon">💝</div>
          <h3>核心信息</h3>
        </div>
        <div class="core-message">
          {{ letter.coreMessage }}
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="letter-actions">
        <button class="action-btn share-btn" @click="handleShare">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 12V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="16,6 12,2 8,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          分享
        </button>
        
        <button class="action-btn export-btn" @click="handleExport">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          匯出
        </button>
        
        <button class="action-btn save-btn" @click="handleSave">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H16L21 8V19A2 2 0 0 1 19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="17,21 17,13 7,13 17,21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="7,3 7,8 15,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          保存
        </button>
      </div>

      <!-- 新分享按鈕 -->
      <div class="new-share-section">
        <button class="new-share-btn" @click="handleNewShare">
          <span class="btn-icon">✨</span>
          又想到新煩惱
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import speechService from '@/services/SpeechService.js'

export default {
  name: 'LetterPage',
  props: {
    letter: {
      type: Object,
      required: true
    }
  },
  emits: ['back', 'new-share'],
  setup(props, { emit }) {
    // 語音播放狀態
    const voiceStatus = reactive({
      isPlaying: false,
      isPaused: false
    })

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 格式化信件文本（添加段落分隔）
    const formatLetterText = (text) => {
      if (!text) return ''
      return text
        .replace(/\n\n+/g, '\n')  // 將多個連續換行符替換為單個換行符
        .split('\n')
        .filter(line => line.trim())  // 過濾空行
        .map(line => `<p>${line.trim()}</p>`)
        .join('')
    }

    // 去重並規整禱告文本（移除內容中的前言說明，追加結尾）
    const sanitizePrayerText = (text = '') => {
      if (!text) return ''
      const lines = text
        .replace(/\r\n/g, '\n')
        .replace(/\n\n+/g, '\n')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)

      const filtered = lines.filter(l => {
        if (!l) return false
        const isIntro = (
          l.startsWith('我來為您禱告') ||
          l.startsWith('如果您願意，可以跟著一起唸')
        )
        return !isIntro
      })

      let result = filtered.join('\n')

      // 若無結尾，自動追加一次
      const hasAmen = /奉耶穌的名禱告/.test(result) || /阿們[。\.!]?$/.test(result)
      if (!hasAmen) {
        result = `${result}\n\n奉耶穌的名禱告，阿們。`
      }

      return result
    }

    // 格式化禱告文本
    const formatPrayerText = (text) => {
      const cleaned = sanitizePrayerText(text)
      if (!cleaned) return ''
      return cleaned
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const trimmed = line.trim()
          if (trimmed.includes('奉耶穌的名禱告') || /阿們[。\.!]?$/.test(trimmed)) {
            return `<p class="amen">${trimmed}</p>`
          }
          return `<p>${trimmed}</p>`
        })
        .join('')
    }

    // 經文標準化：避免字串被逐字渲染
    const normalizeRefs = (refs) => {
      if (!refs) return []
      if (Array.isArray(refs)) {
        return refs
          .map(r => (typeof r === 'string' ? r.trim() : String(r)))
          .filter(Boolean)
      }
      if (typeof refs === 'string') {
        // 嘗試 JSON 解析
        try {
          const parsed = JSON.parse(refs)
          if (Array.isArray(parsed)) {
            return parsed
              .map(r => (typeof r === 'string' ? r.trim() : String(r)))
              .filter(Boolean)
          }
        } catch (_) {}
        // 以常見分隔符拆分
        return refs
          .replace(/\r\n/g, '\n')
          .split(/[\n,;、，；]+/)
          .map(s => s.trim())
          .filter(Boolean)
      }
      return []
    }

    const normalizedBiblicalReferences = computed(() => normalizeRefs(props.letter?.biblicalReferences))

    // 返回上一頁
    const handleBack = () => {
      emit('back')
    }

    // 分享功能
    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: '來自耶穌的信',
            text: `${props.letter.nickname}收到了來自耶穌的信`,
            url: window.location.href
          })
        } catch (error) {
          console.log('分享取消或失敗')
        }
      } else {
        // 備用分享方式
        const text = `來自耶穌的信\n\n${props.letter.jesusLetter.substring(0, 200)}...`
        navigator.clipboard.writeText(text).then(() => {
          alert('內容已複製到剪貼板')
        })
      }
    }

    // 匯出功能
    const handleExport = () => {
      const refsForExport = normalizeRefs(props.letter.biblicalReferences)
      const content = `
來自耶穌的信
日期：${formatDate(props.letter.createdAt)}
收信人：${props.letter.nickname}
主題：${props.letter.topic}

原始分享：
${props.letter.situation}

耶穌的回信：
${props.letter.jesusLetter}

我來為您禱告：
${sanitizePrayerText(props.letter.guidedPrayer)}

${refsForExport.length ? `相關經文：\n${refsForExport.join('\n')}` : ''}

${props.letter.coreMessage ? `核心信息：\n${props.letter.coreMessage}` : ''}
      `.trim()

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `耶穌的信_${props.letter.nickname}_${new Date(props.letter.createdAt).toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    // 保存功能
    const handleSave = () => {
      // 保存到本地存儲
      const savedLetters = JSON.parse(localStorage.getItem('jesus-letters') || '[]')
      const existingIndex = savedLetters.findIndex(l => l.id === props.letter.id)
      
      if (existingIndex === -1) {
        savedLetters.unshift(props.letter)
        localStorage.setItem('jesus-letters', JSON.stringify(savedLetters))
        alert('信件已保存到歷史記錄')
      } else {
        alert('信件已存在於歷史記錄中')
      }
    }

    // 開始新分享
    const handleNewShare = () => {
      emit('new-share')
    }

    // 語音播放/暫停單鍵切換
    const handleVoiceToggle = async () => {
      if (!props.letter.guidedPrayer) return

      // 正在播放 -> 暫停
      if (voiceStatus.isPlaying && !voiceStatus.isPaused) {
        speechService.pause()
        voiceStatus.isPaused = true
        return
      }

      // 已暫停 -> 恢復
      if (voiceStatus.isPlaying && voiceStatus.isPaused) {
        speechService.resume()
        voiceStatus.isPaused = false
        return
      }

      // 未播放 -> 開始播放（不等待Promise，避免暫停時觸發中斷錯誤）
      voiceStatus.isPlaying = true
      voiceStatus.isPaused = false
      const speechText = sanitizePrayerText(props.letter.guidedPrayer)
      speechService
        .speak(speechText)
        .then(() => {
          voiceStatus.isPlaying = false
          voiceStatus.isPaused = false
        })
        .catch((error) => {
          const msg = String(error && error.message || '')
          // 某些瀏覽器在暫停/中斷時會回傳 interrupted，視為非致命錯誤
          if (msg.includes('interrupted') || msg.includes('canceled')) {
            console.warn('語音被中斷/取消：', msg)
            // 保持狀態同步（通常已不是播放中）
            voiceStatus.isPlaying = false
            voiceStatus.isPaused = false
            return
          }
          console.error('語音播放失敗:', error)
          alert('語音播放失敗，請稍後再試')
          voiceStatus.isPlaying = false
          voiceStatus.isPaused = false
        })
    }

    return {
      voiceStatus,
      formatDate,
      formatLetterText,
      formatPrayerText,
      handleBack,
      handleShare,
      handleExport,
      handleSave,
      normalizedBiblicalReferences,
      handleNewShare,
      handleVoiceToggle
    }
  }
}
</script>

<style scoped>
.letter-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 1rem;
}

.letter-container {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.page-header {
  background: linear-gradient(135deg, var(--primary-color), #357ABD);
  color: white;
  padding: 1.5rem;
  border-radius: var(--border-radius-lg);
  margin-bottom: 1.5rem;
  position: relative;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: var(--transition);
  margin-bottom: 1rem;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.letter-date {
  opacity: 0.9;
  font-size: 0.9rem;
}

.share-summary {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nickname {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.topic-tag {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 500;
}

.situation-preview {
  color: var(--text-secondary);
  line-height: 1.5;
  font-style: italic;
}

.jesus-letter-section,
.prayer-section,
.scripture-section,
.core-message-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
  position: relative;
}

.section-icon {
  font-size: 1.5rem;
}

.section-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.voice-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: var(--transition);
  margin-left: auto;
}

.voice-btn:hover:not(:disabled) {
  background: #357ABD;
  transform: translateY(-1px);
}

.voice-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.voice-btn-text {
  font-size: 0.8rem;
}

@media (max-width: 480px) {
  .voice-btn-text {
    display: none;
  }
}

.prayer-note {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-left: auto;
}

.letter-content,
.prayer-content {
  line-height: 1.8;
  color: var(--text-primary);
}

.letter-content :deep(p),
.prayer-content :deep(p) {
  margin-bottom: 1rem;
  text-align: justify;
}

.prayer-content :deep(.amen) {
  text-align: center;
  font-weight: 600;
  color: var(--primary-color);
  margin-top: 1.5rem;
  font-style: italic;
}

.scripture-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scripture-item {
  background: var(--bg-tertiary);
  padding: 1rem;
  border-radius: var(--border-radius);
  border-left: 4px solid var(--primary-color);
  font-style: italic;
  line-height: 1.6;
  word-break: keep-all !important;
  white-space: normal !important;
  display: block !important;
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  flex-direction: unset !important;
  flex-wrap: unset !important;
}

.scripture-item * {
  display: inline !important;
  word-break: keep-all !important;
  white-space: normal !important;
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
}

.core-message {
  background: linear-gradient(135deg, rgba(126, 211, 33, 0.1), rgba(74, 144, 226, 0.1));
  padding: 1.5rem;
  border-radius: var(--border-radius);
  border: 1px solid rgba(126, 211, 33, 0.3);
  font-weight: 500;
  text-align: center;
  color: var(--text-primary);
  line-height: 1.6;
}

.letter-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition);
}

.action-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  transform: translateY(-2px);
}

.new-share-section {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.new-share-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, var(--success-color), #22C55E);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-medium);
}

.new-share-btn:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-large);
}

.btn-icon {
  font-size: 1.2rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .letter-page {
    padding: 0.5rem;
  }
  
  .jesus-letter-section,
  .prayer-section,
  .scripture-section,
  .core-message-section {
    padding: 1.5rem;
  }
  
  .letter-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-btn {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1rem;
  }
  
  .page-header h2 {
    font-size: 1.3rem;
  }
  
  .share-summary {
    padding: 1rem;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .jesus-letter-section,
  .prayer-section,
  .scripture-section,
  .core-message-section {
    padding: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .voice-btn {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
</style>