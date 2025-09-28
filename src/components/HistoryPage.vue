<template>
  <div class="history-page">
    <div class="history-container">
      <!-- 頁面標題 -->
      <div class="page-header">
        <h2>歷史記錄</h2>
        <p>回顧你與耶穌的心靈對話</p>
      </div>

      <!-- 搜索和篩選 -->
      <div class="search-section">
        <div class="search-bar">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索信件內容..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="filter-section">
          <select v-model="selectedTopic" class="filter-select">
            <option value="">所有主題</option>
            <option value="工作">工作</option>
            <option value="感情">感情</option>
            <option value="健康">健康</option>
            <option value="家庭">家庭</option>
            <option value="財富">財富</option>
            <option value="信仰">信仰</option>
            <option value="其他">其他</option>
          </select>

          <select v-model="sortOrder" class="filter-select">
            <option value="newest">最新優先</option>
            <option value="oldest">最舊優先</option>
          </select>
        </div>
      </div>

      <!-- 統計信息 -->
      <div class="stats-section">
        <div class="stat-card">
          <div class="stat-number">{{ filteredLetters.length }}</div>
          <div class="stat-label">篇信件</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ uniqueTopics.length }}</div>
          <div class="stat-label">個主題</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ daysSinceFirst }}</div>
          <div class="stat-label">天使用</div>
        </div>
      </div>

      <!-- 信件列表 -->
      <div class="letters-section">
        <div v-if="filteredLetters.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>{{ searchQuery || selectedTopic ? '沒有找到匹配的記錄' : '還沒有任何記錄' }}</h3>
          <p>{{ searchQuery || selectedTopic ? '試試調整搜索條件' : '開始你的第一次分享吧' }}</p>
          <button v-if="!searchQuery && !selectedTopic" @click="handleNewShare" class="new-share-btn">
            開始分享
          </button>
        </div>

        <div v-else class="letters-list">
          <div
            v-for="letter in paginatedLetters"
            :key="letter.id"
            class="letter-card"
            @click="handleLetterClick(letter)"
          >
            <div class="letter-header">
              <div class="letter-info">
                <span class="letter-topic">{{ letter.topic }}</span>
                <span class="letter-date">{{ formatDate(letter.createdAt) }}</span>
              </div>
              <div class="letter-actions">
                <button @click.stop="handleExportLetter(letter)" class="action-btn export-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
                <button @click.stop="handleDeleteLetter(letter)" class="action-btn delete-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M19,6V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V6M8,6V4A2,2 0 0,1 10,2H14A2,2 0 0,1 16,4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="letter-preview">
              <div class="situation-preview">
                {{ letter.situation.substring(0, 120) }}{{ letter.situation.length > 120 ? '...' : '' }}
              </div>
              
              <div class="response-preview">
                <strong>耶穌的回應：</strong>
                {{ letter.jesusLetter.substring(0, 100) }}{{ letter.jesusLetter.length > 100 ? '...' : '' }}
              </div>
            </div>

            <div class="letter-footer">
              <div class="letter-nickname">{{ letter.nickname }}</div>
              <div class="read-more">點擊查看完整內容 →</div>
            </div>
          </div>
        </div>

        <!-- 分頁 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            上一頁
          </button>
          
          <div class="page-info">
            第 {{ currentPage }} 頁，共 {{ totalPages }} 頁
          </div>
          
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            下一頁
          </button>
        </div>
      </div>

      <!-- 批量操作 -->
      <div v-if="letters.length > 0" class="bulk-actions">
        <button @click="handleExportAll" class="bulk-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          匯出全部
        </button>
        
        <button @click="handleBackupAll" class="bulk-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 4H20V16A2 2 0 0 1 18 18H6A2 2 0 0 1 4 16V4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 12V8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 20V18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          備份 (JSON)
        </button>
        
        <button @click="handleClearAll" class="bulk-btn danger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19,6V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V6M8,6V4A2,2 0 0,1 10,2H14A2,2 0 0,1 16,4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          清空全部
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useLetterStore } from '../services/LetterStore.js'

export default {
  name: 'HistoryPage',
  emits: ['view-letter', 'back', 'new-share', 'letter-selected'],
  setup(props, { emit }) {
    const { letters, deleteLetter } = useLetterStore()
    const searchQuery = ref('')
    const selectedTopic = ref('')
    const sortOrder = ref('newest')
    const currentPage = ref(1)
    const itemsPerPage = 10

    // 載入數據
    onMounted(() => {
      // 數據已通過全局存儲自動載入
    })

    // 篩選後的信件
    const filteredLetters = computed(() => {
      let filtered = letters.value

      // 搜索篩選
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(letter => 
          letter.situation.toLowerCase().includes(query) ||
          letter.jesusLetter.toLowerCase().includes(query) ||
          letter.nickname.toLowerCase().includes(query)
        )
      }

      // 主題篩選
      if (selectedTopic.value) {
        filtered = filtered.filter(letter => letter.topic === selectedTopic.value)
      }

      // 排序
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt)
        const dateB = new Date(b.createdAt)
        return sortOrder.value === 'newest' ? dateB - dateA : dateA - dateB
      })

      return filtered
    })

    // 分頁後的信件
    const paginatedLetters = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredLetters.value.slice(start, end)
    })

    // 總頁數
    const totalPages = computed(() => {
      return Math.ceil(filteredLetters.value.length / itemsPerPage)
    })

    // 唯一主題
    const uniqueTopics = computed(() => {
      const topics = new Set(letters.value.map(letter => letter.topic))
      return Array.from(topics)
    })

    // 使用天數
    const daysSinceFirst = computed(() => {
      if (letters.value.length === 0) return 0
      const firstDate = new Date(Math.min(...letters.value.map(l => new Date(l.createdAt))))
      const today = new Date()
      const diffTime = Math.abs(today - firstDate)
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    })

    // 格式化日期
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = now - date
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        return '今天 ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
      } else if (diffDays === 1) {
        return '昨天'
      } else if (diffDays < 7) {
        return `${diffDays}天前`
      } else {
        return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
      }
    }

    // 清除搜索
    const clearSearch = () => {
      searchQuery.value = ''
    }

    // 點擊信件
    const handleLetterClick = (letter) => {
      emit('letter-selected', letter)
    }

    // 匯出單個信件
    const handleExportLetter = (letter) => {
      const content = `
來自耶穌的信
日期：${new Date(letter.createdAt).toLocaleString('zh-TW')}
收信人：${letter.nickname}
主題：${letter.topic}

原始分享：
${letter.situation}

耶穌的回信：
${letter.jesusLetter}

引導式禱告：
${letter.guidedPrayer}

${letter.biblicalReferences ? `相關經文：\n${letter.biblicalReferences.join('\n')}` : ''}

${letter.coreMessage ? `核心信息：\n${letter.coreMessage}` : ''}
      `.trim()

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `耶穌的信_${letter.nickname}_${new Date(letter.createdAt).toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    // 刪除信件
    const handleDeleteLetter = (letter) => {
      if (confirm('確定要刪除這封信件嗎？')) {
        deleteLetter(letter.id)
      }
    }

    // 匯出全部
    const handleExportAll = () => {
      if (letters.value.length === 0) return

      let allContent = '耶穌的信 - 完整記錄\n'
      allContent += '=' .repeat(50) + '\n\n'

      letters.value.forEach((letter, index) => {
        allContent += `第 ${index + 1} 封信\n`
        allContent += `-`.repeat(30) + '\n'
        allContent += `日期：${new Date(letter.createdAt).toLocaleString('zh-TW')}\n`
        allContent += `收信人：${letter.nickname}\n`
        allContent += `主題：${letter.topic}\n\n`
        allContent += `原始分享：\n${letter.situation}\n\n`
        allContent += `耶穌的回信：\n${letter.jesusLetter}\n\n`
        allContent += `引導式禱告：\n${letter.guidedPrayer}\n\n`
        
        if (letter.biblicalReferences && letter.biblicalReferences.length > 0) {
          allContent += `相關經文：\n${letter.biblicalReferences.join('\n')}\n\n`
        }
        
        if (letter.coreMessage) {
          allContent += `核心信息：\n${letter.coreMessage}\n\n`
        }
        
        allContent += '\n' + '='.repeat(50) + '\n\n'
      })

      const blob = new Blob([allContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `耶穌的信_完整記錄_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    // 清空全部
    const handleClearAll = () => {
      if (confirm('確定要清空所有記錄嗎？此操作無法撤銷。')) {
        letters.value = []
        localStorage.setItem('jesus-letters', JSON.stringify([]))
        currentPage.value = 1
      }
    }

    // 備份全部（JSON）
    const handleBackupAll = () => {
      if (letters.value.length === 0) return

      const backup = {
        version: '3.0',
        exportDate: new Date().toISOString(),
        letters: letters.value,
        theme: localStorage.getItem('jesus-letters-theme') || null,
        visited: localStorage.getItem('jesus-letters-visited') || null
      }

      const json = JSON.stringify(backup, null, 2)
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().replace(/[:.-]/g, '').slice(0, 15)
      a.href = url
      a.download = `jesus_letters_backup_${ts}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    // 開始新分享
    const handleNewShare = () => {
      emit('new-share')
    }

    // 載入數據
    onMounted(() => {
      // 數據已通過全局存儲自動載入
    })

    return {
      letters,
      searchQuery,
      selectedTopic,
      sortOrder,
      currentPage,
      filteredLetters,
      paginatedLetters,
      totalPages,
      uniqueTopics,
      daysSinceFirst,
      formatDate,
      clearSearch,
      handleLetterClick,
      handleExportLetter,
      handleDeleteLetter,
      handleExportAll,
      handleBackupAll,
      handleClearAll,
      handleNewShare
    }
  }
}
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 1rem;
}

.history-container {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, var(--primary-color), #357ABD);
  color: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-medium);
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.page-header p {
  opacity: 0.9;
  font-size: 1rem;
}

.search-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.search-bar {
  position: relative;
  margin-bottom: 1rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid var(--border-color);
  border-radius: 50px;
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: var(--transition);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: var(--transition);
}

.clear-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.filter-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: var(--transition);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  text-align: center;
  border: 1px solid var(--border-color);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.letters-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.2rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.new-share-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.new-share-btn:hover {
  background: #357ABD;
  transform: translateY(-2px);
}

.letters-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.letter-card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: var(--transition);
}

.letter-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
  border-color: var(--primary-color);
}

.letter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.letter-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.letter-topic {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 500;
}

.letter-date {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.letter-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  padding: 0.5rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.delete-btn:hover {
  border-color: var(--error-color);
  color: var(--error-color);
}

.letter-preview {
  margin-bottom: 1rem;
}

.situation-preview {
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 0.75rem;
  font-style: italic;
}

.response-preview {
  color: var(--text-primary);
  line-height: 1.5;
  font-size: 0.9rem;
}

.letter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.letter-nickname {
  font-weight: 600;
  color: var(--text-primary);
}

.read-more {
  color: var(--primary-color);
  font-size: 0.9rem;
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.page-btn {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.bulk-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.bulk-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition);
}

.bulk-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.bulk-btn.danger:hover {
  background: var(--error-color);
  border-color: var(--error-color);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .history-page {
    padding: 0.5rem;
  }
  
  .filter-section {
    grid-template-columns: 1fr;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
  
  .letter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .letter-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .letter-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .bulk-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1.5rem 1rem;
  }
  
  .search-section {
    padding: 1rem;
  }
  
  .letters-section {
    padding: 1rem;
  }
  
  .letter-card {
    padding: 1rem;
  }
  
  .pagination {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>