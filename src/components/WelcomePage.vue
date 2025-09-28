<template>
  <div class="welcome-page">
    <div class="welcome-container">
      <!-- 頂部圖標和標題 -->
      <div class="welcome-header">
        <div class="app-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="url(#gradient)" />
            <path d="M40 15C32.5 15 26.25 21.25 26.25 28.75V35H22.5C20.75 35 19.375 36.375 19.375 38.125V61.25C19.375 63 20.75 64.375 22.5 64.375H57.5C59.25 64.375 60.625 63 60.625 61.25V38.125C60.625 36.375 59.25 35 57.5 35H53.75V28.75C53.75 21.25 47.5 15 40 15ZM40 20C44.75 20 48.75 24 48.75 28.75V35H31.25V28.75C31.25 24 35.25 20 40 20Z" fill="white"/>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4A90E2"/>
                <stop offset="1" stop-color="#357ABD"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="app-title">耶穌的信 3.0</h1>
        <p class="app-subtitle">與耶穌進行心靈對話</p>
      </div>

      <!-- 功能介紹 -->
      <div class="features-section">
        <div class="feature-card">
          <div class="feature-icon">💝</div>
          <h3>我要問事</h3>
          <p>向耶穌分享你的困擾、感恩或疑問，獲得個人化的屬靈指導</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📖</div>
          <h3>聖經智慧</h3>
          <p>基於聖經教導的回應，幫助你在信仰中成長</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🙏</div>
          <h3>代禱服務</h3>
          <p>個人化的代禱文，建立穩定的禱告習慣</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📚</div>
          <h3>記錄管理</h3>
          <p>保存和回顧過往的屬靈對話，見證成長軌跡</p>
        </div>
      </div>

      <!-- 開始按鈕 -->
      <div class="action-section">
        <button class="start-btn" @click="handleStart">
          <span class="btn-icon">✨</span>
          開始心靈對話
        </button>
        
        <p class="privacy-note">
          我們重視您的隱私，所有對話內容都會安全保護
        </p>
      </div>

      <!-- 版本信息 -->
      <div class="version-info">
        <p>版本 3.0.0 | Jesus Letters Team</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WelcomePage',
  emits: ['start'],
  methods: {
    handleStart() {
      this.$emit('start')
    }
  }
}
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}

.welcome-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: float 20s linear infinite;
}

@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(-50px, -50px) rotate(360deg); }
}

.welcome-container {
  max-width: 500px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 1;
}

.welcome-header {
  margin-bottom: 3rem;
}

.app-icon {
  margin-bottom: 1.5rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.app-subtitle {
  font-size: 1.2rem;
  color: rgba(255,255,255,0.9);
  font-weight: 300;
}

.features-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: rgba(255,255,255,0.15);
  /* Fallback for browsers that don't support backdrop-filter */
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(10px);
  /* Webkit prefix for better compatibility */
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  background: rgba(255,255,255,0.2);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.feature-card p {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.8);
  line-height: 1.5;
}

.action-section {
  margin-bottom: 2rem;
}

.start-btn {
  background: linear-gradient(45deg, #F5A623, #F7931E);
  border: none;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(245, 166, 35, 0.4);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 166, 35, 0.6);
}

.start-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.1rem;
}

.privacy-note {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.7);
  max-width: 300px;
  margin: 0 auto;
  line-height: 1.4;
}

.version-info {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.6);
  margin-top: 2rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .welcome-page {
    padding: 1rem;
  }
  
  .app-title {
    font-size: 2rem;
  }
  
  .app-subtitle {
    font-size: 1rem;
  }
  
  .features-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .feature-card {
    padding: 1.25rem;
  }
  
  .start-btn {
    font-size: 1.1rem;
    padding: 0.875rem 2rem;
  }
}

@media (max-width: 480px) {
  .app-icon svg {
    width: 60px;
    height: 60px;
  }
  
  .app-title {
    font-size: 1.75rem;
  }
  
  .feature-card {
    padding: 1rem;
  }
  
  .feature-card h3 {
    font-size: 1rem;
  }
  
  .feature-card p {
    font-size: 0.85rem;
  }
}
</style>