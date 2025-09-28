<template>
  <div class="home-page">
    <div class="home-container">
      <!-- 歡迎區域 -->
      <div class="welcome-section">
        <div class="greeting">
          <h2>{{ getGreeting() }}</h2>
          <p>當你遇到困難 徬徨無助 想找尋方向 或想幫助他人 或想為人禱告卻不知如何開口 你還在算命嗎?! 來..來 ..不用銀....不用錢...試試這個!</p>
        </div>
        <div class="date-info">
          <span class="date">{{ getCurrentDate() }}</span>
        </div>
      </div>

      <!-- 快速操作卡片 -->
      <div class="quick-actions">
        <div class="action-card primary" @click="handleNewLetter">
          <div class="card-icon">✍️</div>
          <div class="card-content">
            <h3>我有新煩惱</h3>
            <p>無論是工作、感情、健康、財富、課業、是喜、是憂、人際關係或是為你關心的人大小事都可以在這裡提問。你會收到一封來信 為你指引 道路 真理 生命 !</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="action-card secondary" @click="handleViewHistory">
          <div class="card-icon">📚</div>
          <div class="card-content">
            <h3>查看歷史記錄</h3>
            <p>回顧過往的屬靈對話</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>

      <!-- 統計信息 -->
      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-number">{{ totalLetters }}</div>
          <div class="stat-label">總信件數</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ daysUsed }}</div>
          <div class="stat-label">使用天數</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ thisMonthLetters }}</div>
          <div class="stat-label">本月信件</div>
        </div>
      </div>

      <!-- 最近的信件預覽 -->
      <div class="recent-section" v-if="recentLetters.length > 0">
        <h3 class="section-title">最近的對話</h3>
        <div class="recent-letters">
          <div 
            class="recent-letter-card"
            v-for="letter in recentLetters.slice(0, 3)"
            :key="letter.id"
            @click="viewLetter(letter)"
          >
            <div class="letter-date">{{ formatDate(letter.createdAt) }}</div>
            <div class="letter-topic">{{ letter.topic }}</div>
            <div class="letter-preview">{{ getPreview(letter.situation) }}</div>
          </div>
        </div>
      </div>

      <!-- 每日經文 -->
      <div class="verse-section">
        <h3 class="section-title">今日經文</h3>
        <div class="verse-card">
          <div class="verse-text">{{ dailyVerse.text }}</div>
          <div class="verse-reference">{{ dailyVerse.reference }}</div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div class="empty-state" v-if="totalLetters === 0">
        <div class="empty-icon">💌</div>
        <h3>開始你的屬靈之旅</h3>
        <p>你會收到一封來信 為你指引道路 真理 生命</p>
        <button class="empty-action-btn" @click="handleNewLetter">
          立即開始
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useLetterStore } from '../services/LetterStore.js'

export default {
  name: 'HomePage',
  emits: ['new-letter', 'view-history', 'view-letter'],
  setup(props, { emit }) {
    const { letters, totalLetters, recentLetters, daysUsed, thisMonthLetters } = useLetterStore()
    
    const dailyVerse = ref({
      text: "你們要將一切的憂慮卸給神，因為他顧念你們。",
      reference: "彼得前書 5:7"
    })

    // 載入數據
    onMounted(() => {
      loadDailyVerse()
    })

    const loadDailyVerse = () => {
      const verses = [
        { text: "你們要將一切的憂慮卸給神，因為他顧念你們。", reference: "彼得前書 5:7" },
        { text: "我靠著那加給我力量的，凡事都能做。", reference: "腓立比書 4:13" },
        { text: "神愛世人，甚至將他的獨生子賜給他們。", reference: "約翰福音 3:16" },
        { text: "你們祈求，就給你們；尋找，就尋見。", reference: "馬太福音 7:7" },
        { text: "我將這些事告訴你們，是要叫你們在我裡面有平安。", reference: "約翰福音 16:33" }
      ]
      
      const today = new Date().getDate()
      dailyVerse.value = verses[today % verses.length]
    }

    // 計算屬性已從 LetterStore 導入
    // const totalLetters = computed(() => letters.value.length)
    // const recentLetters = computed(() => { ... })
    // const daysUsed = computed(() => { ... })
    // const thisMonthLetters = computed(() => { ... })

    // 方法
    const getGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 6) return "夜深了，平安回家最好 上班也賺飽飽"
      if (hour < 12) return "早安，每個早晨都是新的"
      if (hour < 18) return "午安，你也可以把日記丟給我 我來為你禱告"
      return "晚安，給家人一個笑臉吧..."
    }

    const getCurrentDate = () => {
      const now = new Date()
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      }
      return now.toLocaleDateString('zh-TW', options)
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return "今天"
      if (diffDays === 2) return "昨天"
      if (diffDays <= 7) return `${diffDays - 1}天前`
      
      return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
    }

    const getPreview = (text) => {
      return text.length > 50 ? text.substring(0, 50) + '...' : text
    }

    const handleNewLetter = () => {
      emit('new-letter')
    }

    const handleViewHistory = () => {
      emit('view-history')
    }

    const viewLetter = (letter) => {
      emit('view-letter', letter)
    }

    return {
      letters,
      dailyVerse,
      totalLetters,
      recentLetters,
      daysUsed,
      thisMonthLetters,
      getGreeting,
      getCurrentDate,
      formatDate,
      getPreview,
      handleNewLetter,
      handleViewHistory,
      viewLetter
    }
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 1rem;
}

.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.welcome-section {
  background: linear-gradient(135deg, var(--primary-color), #357ABD);
  color: white;
  padding: 2rem;
  border-radius: var(--border-radius-lg);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-medium);
}

.greeting h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.greeting p {
  opacity: 0.9;
  font-size: 1rem;
}

.date-info {
  text-align: right;
}

.date {
  font-size: 0.9rem;
  opacity: 0.8;
}

.quick-actions {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.action-card.primary {
  background: linear-gradient(135deg, #F5A623, #F7931E);
  color: white;
  border: none;
}

.action-card.secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.card-content p {
  font-size: 0.9rem;
  opacity: 0.8;
}

.card-arrow {
  font-size: 1.5rem;
  opacity: 0.6;
  transition: var(--transition);
}

.action-card:hover .card-arrow {
  transform: translateX(5px);
  opacity: 1;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  text-align: center;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.recent-section,
.verse-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.recent-letters {
  display: grid;
  gap: 0.75rem;
}

.recent-letter-card {
  background: var(--bg-primary);
  padding: 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
}

.recent-letter-card:hover {
  transform: translateX(5px);
  box-shadow: var(--shadow-medium);
}

.letter-date {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.letter-topic {
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.letter-preview {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.verse-card {
  background: linear-gradient(135deg, #7ED321, #5CB85C);
  color: white;
  padding: 1.5rem;
  border-radius: var(--border-radius-lg);
  text-align: center;
  box-shadow: var(--shadow-medium);
}

.verse-text {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-style: italic;
}

.verse-reference {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.3rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.empty-action-btn {
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

.empty-action-btn:hover {
  background: #357ABD;
  transform: translateY(-2px);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .home-page {
    padding: 0.5rem;
  }
  
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-item {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .welcome-section {
    padding: 1.5rem;
  }
  
  .greeting h2 {
    font-size: 1.3rem;
  }
  
  .action-card {
    padding: 1.25rem;
  }
  
  .card-content h3 {
    font-size: 1.1rem;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>