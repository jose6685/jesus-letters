<template>
  <div id="app" class="app-container">
    <!-- 頂部導航 -->
    <header class="app-header" v-if="currentView !== 'welcome'">
      <div class="header-content">
        <button 
          class="back-btn" 
          @click="goBack"
          v-if="currentView !== 'home'"
        >
          ← 返回
        </button>
        <h1 class="app-title">{{ getPageTitle() }}</h1>
        <div class="header-actions">
          <button 
            class="theme-toggle" 
            @click="toggleTheme"
            :title="isDarkMode ? '切換到淺色模式' : '切換到深色模式'"
          >
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>
    </header>

    <!-- 主要內容區域 -->
    <main class="app-main">
      <!-- 歡迎頁面 -->
      <WelcomePage 
        v-if="currentView === 'welcome'"
        @start="goToHome"
      />
      
      <!-- 首頁 -->
      <HomePage 
        v-else-if="currentView === 'home'"
        @new-letter="goToShare"
        @view-history="goToHistory"
      />
      
      <!-- 分享頁面 -->
      <SharePage 
        v-else-if="currentView === 'share'"
        @letter-sent="onLetterSent"
        @back="goToHome"
      />
      
      <!-- 回信頁面 -->
      <LetterPage 
        v-else-if="currentView === 'letter'"
        :letter="currentLetter"
        @back="goToHome"
        @save="saveLetter"
        @new-share="goToShare"
      />
      
      <!-- 歷史記錄頁面 -->
      <HistoryPage 
        v-else-if="currentView === 'history'"
        @view-letter="viewLetter"
        @letter-selected="viewLetter"
        @back="goToHome"
        @new-share="goToShare"
      />
    </main>

    <!-- 底部導航 -->
    <nav class="bottom-nav" v-if="currentView !== 'welcome' && currentView !== 'letter'">
      <button 
        class="nav-item"
        :class="{ active: currentView === 'home' }"
        @click="goToHome"
      >
        <span class="nav-icon">🏠</span>
        <span class="nav-label">首頁</span>
      </button>
      <button 
        class="nav-item"
        :class="{ active: currentView === 'share' }"
        @click="goToShare"
      >
        <span class="nav-icon">✍️</span>
        <span class="nav-label">我有新煩惱</span>
      </button>
      <button 
        class="nav-item"
        :class="{ active: currentView === 'history' }"
        @click="goToHistory"
      >
        <span class="nav-icon">📚</span>
        <span class="nav-label">記錄</span>
      </button>
    </nav>

    <!-- 載入遮罩 -->
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useLetterStore } from './services/LetterStore.js'
import WelcomePage from './components/WelcomePage.vue'
import HomePage from './components/HomePage.vue'
import SharePage from './components/SharePage.vue'
import LetterPage from './components/LetterPage.vue'
import HistoryPage from './components/HistoryPage.vue'

export default {
  name: 'App',
  components: {
    WelcomePage,
    HomePage,
    SharePage,
    LetterPage,
    HistoryPage
  },
  setup() {
    const { saveLetter } = useLetterStore()
    const currentView = ref('welcome')
    const currentLetter = ref(null)
    const isLoading = ref(false)
    const loadingMessage = ref('載入中...')
    const isDarkMode = ref(false)
    const viewHistory = ref([])

    // 檢查是否首次訪問
    onMounted(() => {
      // 直接跳到首頁，跳過歡迎頁面
      currentView.value = 'home'
      
      // 載入主題設置
      const savedTheme = localStorage.getItem('jesus-letters-theme')
      if (savedTheme === 'dark') {
        isDarkMode.value = true
        document.body.classList.add('dark-mode')
      }
    })

    // 導航方法
    const goToHome = () => {
      currentView.value = 'home'
      localStorage.setItem('jesus-letters-visited', 'true')
    }

    const goToShare = () => {
      viewHistory.value.push(currentView.value)
      currentView.value = 'share'
    }

    const goToHistory = () => {
      viewHistory.value.push(currentView.value)
      currentView.value = 'history'
    }

    const goBack = () => {
      if (viewHistory.value.length > 0) {
        currentView.value = viewHistory.value.pop()
      } else {
        currentView.value = 'home'
      }
    }

    // 處理信件發送
    const onLetterSent = (letterData) => {
      // 保存信件到存儲
      saveLetter(letterData)
      currentLetter.value = letterData
      currentView.value = 'letter'
    }

    // 查看歷史信件
    const viewLetter = (letterData) => {
      currentLetter.value = letterData
      viewHistory.value.push(currentView.value)
      currentView.value = 'letter'
    }

    // 保存信件 - 使用全局存儲
    const saveLetterHandler = (letterData) => {
      saveLetter(letterData)
    }

    // 主題切換
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value
      document.body.classList.toggle('dark-mode', isDarkMode.value)
      localStorage.setItem('jesus-letters-theme', isDarkMode.value ? 'dark' : 'light')
    }

    // 獲取頁面標題
    const getPageTitle = () => {
      const titles = {
        home: '聽聽看耶穌怎麼說',
        share: '我要問事',
        letter: '耶穌的回信',
        history: '歷史記錄'
      }
      return titles[currentView.value] || '聽聽看耶穌怎麼說'
    }

    return {
      currentView,
      currentLetter,
      isLoading,
      loadingMessage,
      isDarkMode,
      goToHome,
      goToShare,
      goToHistory,
      goBack,
      onLetterSent,
      viewLetter,
      saveLetter: saveLetterHandler,
      toggleTheme,
      getPageTitle
    }
  }
}
</script>

<style>
:root {
  --primary-color: #4A90E2;
  --secondary-color: #F5A623;
  --success-color: #7ED321;
  --danger-color: #D0021B;
  --warning-color: #F5A623;
  --info-color: #50E3C2;
  
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8F9FA;
  --bg-tertiary: #E9ECEF;
  
  --border-color: #DEE2E6;
  --shadow-light: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-medium: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-heavy: 0 8px 16px rgba(0,0,0,0.2);
  
  --border-radius: 8px;
  --border-radius-lg: 12px;
  --transition: all 0.3s ease;
}

.dark-mode {
  --text-primary: #FFFFFF;
  --text-secondary: #CCCCCC;
  --text-muted: #999999;
  
  --bg-primary: #1A1A1A;
  --bg-secondary: #2D2D2D;
  --bg-tertiary: #404040;
  
  --border-color: #404040;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
  transition: var(--transition);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.app-header {
  background: var(--primary-color);
  color: white;
  padding: 1rem;
  box-shadow: var(--shadow-medium);
  position: sticky;
  position: -webkit-sticky; /* Safari compatibility */
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: var(--transition);
}

.back-btn:hover {
  background: rgba(255,255,255,0.3);
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  flex: 1;
  text-align: center;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.theme-toggle {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  background: rgba(255,255,255,0.3);
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  display: flex;
  padding: 0.5rem;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  border-radius: var(--border-radius);
}

.nav-item:hover,
.nav-item.active {
  color: var(--primary-color);
  background: rgba(74, 144, 226, 0.1);
}

.nav-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: var(--border-radius-lg);
  text-align: center;
  box-shadow: var(--shadow-heavy);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .app-header {
    padding: 0.75rem 1rem;
  }
  
  .app-title {
    font-size: 1.1rem;
  }
  
  .back-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}

/* 滾動條樣式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>