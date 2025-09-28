import { ref, computed } from 'vue'

// 全局響應式信件存儲
const letters = ref([])

// 載入信件數據
const loadLetters = () => {
  const savedLetters = localStorage.getItem('jesus-letters')
  if (savedLetters) {
    letters.value = JSON.parse(savedLetters)
  }
}

// 保存信件
const saveLetter = (letterData) => {
  const existingIndex = letters.value.findIndex(l => l.id === letterData.id)
  
  if (existingIndex >= 0) {
    letters.value[existingIndex] = letterData
  } else {
    letters.value.unshift(letterData)
  }
  
  // 同步到 localStorage
  localStorage.setItem('jesus-letters', JSON.stringify(letters.value))
}

// 刪除信件
const deleteLetter = (letterId) => {
  const index = letters.value.findIndex(l => l.id === letterId)
  if (index >= 0) {
    letters.value.splice(index, 1)
    localStorage.setItem('jesus-letters', JSON.stringify(letters.value))
  }
}

// 計算屬性
const totalLetters = computed(() => letters.value.length)

const recentLetters = computed(() => {
  return letters.value
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
})

const daysUsed = computed(() => {
  if (letters.value.length === 0) return 0
  
  const dates = new Set()
  letters.value.forEach(letter => {
    const date = new Date(letter.createdAt).toDateString()
    dates.add(date)
  })
  return dates.size
})

const thisMonthLetters = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return letters.value.filter(letter => {
    const letterDate = new Date(letter.createdAt)
    return letterDate.getMonth() === currentMonth && 
           letterDate.getFullYear() === currentYear
  }).length
})

// 初始化
loadLetters()

// 導出響應式存儲
export const useLetterStore = () => {
  return {
    letters,
    totalLetters,
    recentLetters,
    daysUsed,
    thisMonthLetters,
    loadLetters,
    saveLetter,
    deleteLetter
  }
}