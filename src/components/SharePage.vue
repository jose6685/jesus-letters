<template>
  <div class="share-page">
    <div class="share-container">
      <!-- 頁面標題 -->
      <div class="page-header">
        <h2>聽聽看耶穌怎麼說</h2>
        <p>無論是困擾、感恩或疑問 記錄下來，他必成為你 腳前的燈 路上的光 夜間的歌</p>
      </div>

      <!-- 分享表單 -->
      <form @submit.prevent="handleSubmit" class="share-form">
        <!-- 提問內容區塊 -->
        <div class="form-section">
          <h3 class="section-title">提問內容</h3>
          
          <div class="form-group">
            <label for="nickname">暱稱 *</label>
            <input
              type="text"
              id="nickname"
              v-model="formData.nickname"
              placeholder="請輸入你的暱稱"
              required
              maxlength="20"
            />
          </div>



          <div class="form-group">
            <label for="religion">宗教信仰</label>
            <select id="religion" v-model="formData.religion">
              <option value="">請選擇</option>
              <option value="基督徒">基督徒</option>
              <option value="天主教徒">天主教徒</option>
              <option value="猶太教">猶太教</option>
              <option value="佛教">佛教</option>
              <option value="道教">道教</option>
              <option value="伊斯蘭教">伊斯蘭教</option>
              <option value="印度教">印度教</option>
              <option value="神道教">神道教</option>
              <option value="摩門教">摩門教</option>
              <option value="統一教">統一教</option>
              <option value="一貫道">一貫道</option>
              <option value="無固定信仰">無固定信仰</option>
              <option value="非基督徒">非基督徒</option>
              <option value="其他宗教">其他宗教</option>
              <option value="無宗教信仰">無宗教信仰</option>
            </select>
          </div>
        </div>

        <!-- 分享內容區塊 -->
        <div class="form-section">
          <h3 class="section-title">我要提問</h3>
          
          <div class="form-group">
            <label>主題 * (可複選)</label>
            <div class="checkbox-group">
              <div class="checkbox-item">
                <input type="checkbox" id="topic-work" value="工作" v-model="formData.topics">
                <label for="topic-work">工作</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-love" value="感情" v-model="formData.topics">
                <label for="topic-love">感情</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-health" value="健康" v-model="formData.topics">
                <label for="topic-health">健康</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-family" value="家庭" v-model="formData.topics">
                <label for="topic-family">家庭</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-wealth" value="財富" v-model="formData.topics">
                <label for="topic-wealth">財富</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-faith" value="信仰" v-model="formData.topics">
                <label for="topic-faith">信仰</label>
              </div>
              <div class="checkbox-item">
                <input type="checkbox" id="topic-other" value="其他" v-model="formData.topics">
                <label for="topic-other">其他</label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="situation">具體情況(概述與事件關鍵詞亦可) *</label>
            <textarea
              id="situation"
              v-model="formData.situation"
              placeholder="請詳細描述你想分享的情況、困擾或感恩..."
              required
              rows="8"
              maxlength="2000"
            ></textarea>
            <div class="char-count">
              {{ formData.situation.length }}/2000
            </div>
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="handleBack">
            取消
          </button>
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="isSubmitting || !isFormValid"
          >
            <span v-if="isSubmitting" class="loading-spinner"></span>
            {{ isSubmitting ? '發送中...' : '誠心地發送' }}
          </button>
        </div>
      </form>

      <!-- 隱私提示 -->
      <div class="privacy-notice">
        <div class="notice-icon">🔒</div>
        <div class="notice-content">
          <h4>隱私保護</h4>
          <p>你的分享內容將被安全處理，我們重視並保護你的隱私。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { API_CONFIG } from '@/config/api.js'

export default {
  name: 'SharePage',
  emits: ['letter-sent', 'back'],
  setup(props, { emit }) {
    const isSubmitting = ref(false)
    
    const formData = ref({
      nickname: '',
      religion: '',
      topics: [],
      situation: ''
    })

    // 表單驗證
    const isFormValid = computed(() => {
      return formData.value.nickname.trim() && 
             formData.value.topics.length > 0 && 
             formData.value.situation.trim().length >= 10
    })

    // 處理表單提交
    const handleSubmit = async () => {
      if (!isFormValid.value || isSubmitting.value) return

      isSubmitting.value = true

      try {
        // 準備發送數據
        const requestData = {
          userInput: {
            nickname: formData.value.nickname,
            situation: formData.value.situation,
            topic: formData.value.topics.join(', '), // 將陣列轉換為字符串
            religion: formData.value.religion
          }
        }

        // 發送到後端API（使用統一的 API 配置）
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AI_GENERATE}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        // 從正確的數據結構中提取AI響應
        const aiResponse = result.data.aiResponse

        // 創建信件對象
        const letterData = {
          id: generateId(),
          nickname: requestData.userInput.nickname,
          topic: requestData.userInput.topic,
          situation: requestData.userInput.situation,
          jesusLetter: aiResponse.jesusLetter,
          guidedPrayer: aiResponse.guidedPrayer,
          biblicalReferences: processBiblicalReferences(aiResponse.biblicalReferences),
          coreMessage: aiResponse.coreMessage || '',
          createdAt: new Date().toISOString()
        }

        // 發送成功事件
        emit('letter-sent', letterData)

        // 重置表單
        resetForm()

      } catch (error) {
        console.error('發送信件失敗:', error)
        alert('發送失敗，請檢查網絡連接後重試')
      } finally {
        isSubmitting.value = false
      }
    }

    // 處理聖經經文引用：統一為字串陣列，避免一字一欄
    const processBiblicalReferences = (references) => {
      if (!references) return []

      // 若為陣列：允許元素為字串或物件
      if (Array.isArray(references)) {
        return references
          .map(ref => {
            if (typeof ref === 'string') return ref.trim()
            const text = (ref && (ref.text || ref.content)) ? (ref.text || ref.content) : ''
            const reference = ref && (ref.reference || ref.ref) ? (ref.reference || ref.ref) : ''
            const combined = [reference, text].filter(Boolean).join(' - ')
            return combined.trim()
          })
          .filter(ref => ref && ref.length > 0)
      }

      // 若為字串：嘗試JSON解析，否則以常見分隔符分割
      if (typeof references === 'string') {
        try {
          const parsed = JSON.parse(references)
          if (Array.isArray(parsed)) {
            return parsed
              .map(r => (typeof r === 'string' ? r.trim() : JSON.stringify(r)))
              .filter(r => r && r.length > 0)
          }
        } catch (e) {
          // 使用換行/頓號/逗號/分號等分隔
          return references
            .split(/(?:\r?\n|[、，,；;]+)+/)
            .map(ref => ref.trim())
            .filter(ref => ref.length > 0)
        }
      }

      return []
    }

    // 生成唯一ID
    const generateId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }

    // 重置表單
    const resetForm = () => {
      formData.value = {
        nickname: '',
        religion: '',
        topics: [],
        situation: ''
      }
    }

    // 返回上一頁
    const handleBack = () => {
      emit('back')
    }

    return {
      formData,
      isSubmitting,
      isFormValid,
      handleSubmit,
      handleBack,
      processBiblicalReferences
    }
  }
}
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 1rem;
}

.share-container {
  max-width: 600px;
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

.share-form {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
}

.form-section {
  margin-bottom: 2rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-color);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

input,
select,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  font-family: inherit;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: var(--transition);
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

.char-count {
  text-align: right;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

/* 複選框樣式 */
.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-item input[type="checkbox"] {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.checkbox-item label {
  margin: 0;
  cursor: pointer;
  font-weight: normal;
  color: var(--text-secondary);
  transition: var(--transition);
}

.checkbox-item input[type="checkbox"]:checked + label {
  color: var(--primary-color);
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #357ABD;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.privacy-notice {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba(126, 211, 33, 0.1);
  border: 1px solid rgba(126, 211, 33, 0.3);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-top: 1.5rem;
}

.notice-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notice-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.notice-content p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .share-page {
    padding: 0.5rem;
  }
  
  .share-form {
    padding: 1.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1.5rem 1rem;
  }
  
  .page-header h2 {
    font-size: 1.3rem;
  }
  
  .share-form {
    padding: 1rem;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
}
</style>