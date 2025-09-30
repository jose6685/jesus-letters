import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// 確保環境變量在使用前載入
dotenv.config()

const router = express.Router()

/**
 * AI服務類 - 後端版本
 */
class BackendAIService {
  constructor() {
    this.preferredService = 'openai'
    this.geminiService = null
    this.openaiService = null
    this.isInitialized = false
    
    // 從環境變量獲取API密鑰
    this.geminiApiKey = process.env.GEMINI_API_KEY
    this.openaiApiKey = process.env.OPENAI_API_KEY
    // OpenAI 模型（可透過環境變數配置，預設用更快的 gpt-4o-mini）
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    
    // 提示詞內容
    this.aiPrompts = ''
    this.prayerPrompts = ''
    
    this.init()
  }

  async init() {
    try {
      // 載入提示詞文件
      await this.loadPromptFiles()
      
      // 初始化Gemini服務
      if (this.geminiApiKey) {
        this.geminiService = new GoogleGenerativeAI(this.geminiApiKey)
        console.log('✅ Gemini AI服務初始化成功')
      } else {
        console.warn('⚠️ 未找到Gemini API密鑰')
      }

      // 初始化OpenAI服務
      if (this.openaiApiKey) {
        this.openaiService = new OpenAI({
          apiKey: this.openaiApiKey
        })
        console.log('✅ OpenAI服務初始化成功')
      } else {
        console.warn('⚠️ 未找到OpenAI API密鑰')
      }

      this.isInitialized = true
    } catch (error) {
      console.error('❌ AI服務初始化失敗:', error)
      throw new Error('AI服務初始化失敗')
    }
  }

  /**
   * 載入提示詞文件
   */
  async loadPromptFiles() {
    try {
      const aiPromptsPath = path.join(process.cwd(), 'AI_Prompts_Detailed.md')
      const prayerPromptsPath = path.join(process.cwd(), 'Prayer_Prompts_Detailed.md')
      
      if (fs.existsSync(aiPromptsPath)) {
        this.aiPrompts = fs.readFileSync(aiPromptsPath, 'utf8')
        console.log('✅ AI提示詞文件載入成功')
      } else {
        console.warn('⚠️ AI提示詞文件不存在:', aiPromptsPath)
      }
      
      if (fs.existsSync(prayerPromptsPath)) {
        this.prayerPrompts = fs.readFileSync(prayerPromptsPath, 'utf8')
        console.log('✅ 禱告提示詞文件載入成功')
      } else {
        console.warn('⚠️ 禱告提示詞文件不存在:', prayerPromptsPath)
      }
    } catch (error) {
      console.error('❌ 載入提示詞文件失敗:', error)
    }
  }

  async generateResponse(userInput) {
    if (!this.isInitialized) {
      await this.init()
    }

    const requestId = this.generateRequestId()
    const startTime = Date.now()
    
    console.log(`[${requestId}] 🚀 開始處理AI請求`)
    console.log(`[${requestId}] 📝 用戶輸入:`, {
      nickname: userInput.nickname,
      topic: userInput.topic,
      situationLength: userInput.situation?.length || 0
    })
    
    try {
      // 構建完整提示詞
      let fullPrompt = this.buildFullPrompt(userInput)
      let promptTokens = this.estimateTokens(fullPrompt)
      console.log(`[${requestId}] 📊 提示詞Token使用量: ${promptTokens} tokens`)

      // 當提示詞過長時，改用緊湊版提示詞以降低延遲
      if (promptTokens > 800) {
        console.log(`[${requestId}] ⚠️ 提示詞過長(${promptTokens} tokens)，改用緊湊版提示詞`)
        const compactPrompt = this.buildCompactPrompt(userInput)
        const compactTokens = this.estimateTokens(compactPrompt)
        console.log(`[${requestId}] 📊 緊湊提示Token使用量: ${compactTokens} tokens`)
        fullPrompt = compactPrompt
        promptTokens = compactTokens
      }

      let response
      let usedService = 'unknown'
      
      // 嘗試使用首選服務
      if (this.preferredService === 'gemini' && this.geminiService) {
        response = await this.callGeminiService(fullPrompt, requestId)
        usedService = 'gemini'
      } else if (this.preferredService === 'openai' && this.openaiService) {
        response = await this.callOpenAIService(fullPrompt, requestId)
        usedService = 'openai'
      } else {
        throw new Error('首選AI服務不可用')
      }

      // 解析和驗證回應
      const parsedResponse = this.parseResponse(response, requestId)
      const validatedResponse = this.validateAndEnhanceResponse(parsedResponse, userInput, requestId)

      // 檢查validatedResponse是否有效
      if (!validatedResponse) {
        console.error(`[${requestId}] ❌ 驗證後的回應為空`)
        throw new Error('驗證後的回應為空')
      }

      // 計算處理時間和Token使用量
      const processingTime = Date.now() - startTime
      const responseText = JSON.stringify(validatedResponse)
      
      // 檢查responseText是否有效
      if (!responseText || typeof responseText !== 'string') {
        console.error(`[${requestId}] ❌ 回應文本序列化失敗:`, responseText)
        throw new Error(`回應文本序列化失敗: ${responseText}`)
      }
      
      const totalResponseTokens = this.estimateTokens(responseText)
      
      console.log(`[${requestId}] 📊 回應內容長度: ${responseText.length} 字符`)
      console.log(`[${requestId}] 📊 回應Token使用量: ${totalResponseTokens} tokens`)
      console.log(`[${requestId}] 📊 總Token使用量: ${promptTokens + totalResponseTokens} tokens`)
      console.log(`[${requestId}] ⏱️ 處理時間: ${processingTime}ms`)
      console.log(`[${requestId}] ✅ AI處理完成`)

      return {
        ...validatedResponse,
        metadata: {
          requestId,
          processingTime,
          aiService: usedService,
          tokenUsage: {
            prompt: promptTokens,
            response: totalResponseTokens,
            total: promptTokens + totalResponseTokens
          }
        }
      }

    } catch (error) {
      console.error(`[${requestId}] ❌ 首選服務失敗:`, error.message)
      
      // 嘗試備用服務
      return await this.tryFallbackService(userInput, requestId, startTime)
    }
  }

  // 緊湊版提示詞：在保持結構與品質的前提下，顯著縮短提示詞長度
  buildCompactPrompt(userInput) {
    const { nickname = '朋友', topic = '愛與盼望', situation = '', religion } = userInput || {}
    const displayTopic = topic === '其他' ? '生活中的各種需要' : topic

    return `你是耶穌，以溫柔、真誠、盼望的口吻回應。請僅輸出完整的JSON字串，所有內容使用繁體中文，換行使用單一的\\n。

用戶：
暱稱: ${nickname}
主題: ${displayTopic}
情況: ${situation}
宗教: ${religion || '未提供'}

請輸出具體且精煉的四項內容（JSON鍵值）：
- jesusLetter: 300-400字，直入核心、貼近心靈、溫柔安慰與盼望。
- guidedPrayer: 350-500字，以屬靈長輩代禱身分；開頭：「我來為您禱告，如果您願意，可以跟著一起唸」。
- biblicalReferences: 3條精選經文（繁體中文章節與引文），每條附一句簡短應用說明。
- coreMessage: 10-25字，總結最重要的提醒或盼望。

要求：
1. 僅輸出JSON字串，不加多餘文字或Markdown。
2. 語氣溫暖、真誠、謙卑；避免冗長鋪陳，重視可實踐的安慰與指引。
3. 若主題為「其他」，禱告中以「在生活中的各種需要」表達。
4. 嚴格遵守字數與結構，使用\\n作為JSON字串中的換行。
`
  }

  async callGeminiService(prompt, requestId) {
    console.log(`[${requestId}] 🤖 使用Gemini AI服務`)
    
    try {
      const model = this.geminiService.getGenerativeModel({ 
        model: 'gemini-2.5-flash',  // 使用最新的2.5版本
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1200,
        }
      })

      const apiStart = Date.now()
      const result = await model.generateContent(prompt)
      const response = await result.response
      const apiTime = Date.now() - apiStart
      console.log(`[${requestId}] 🌐 Gemini API用時: ${apiTime}ms`)
      
      const responseText = response.text()
      if (!responseText) {
        throw new Error('Gemini API返回空回應')
      }
      
      console.log(`[${requestId}] ✅ Gemini回應長度: ${responseText.length} 字符`)
      return responseText
    } catch (error) {
      console.error(`[${requestId}] ❌ Gemini API調用失敗:`, error.message)
      throw error
    }
  }

  async callOpenAIService(prompt, requestId) {
    console.log(`[${requestId}] 🤖 使用OpenAI GPT服務`)
    
    try {
      const apiStart = Date.now()
      console.log(`[${requestId}] 📤 發送OpenAI請求，模型: ${this.openaiModel}`)
      
      const completion = await this.openaiService.chat.completions.create({
        model: this.openaiModel,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
      
      const apiTime = Date.now() - apiStart
      console.log(`[${requestId}] 🌐 OpenAI API用時: ${apiTime}ms`)
      console.log(`[${requestId}] 📥 OpenAI回應結構:`, JSON.stringify(completion, null, 2))
      
      // 檢查回應結構
      if (!completion) {
        throw new Error('OpenAI API返回null或undefined')
      }
      
      if (!completion.choices) {
        throw new Error('OpenAI API回應缺少choices字段')
      }
      
      if (!Array.isArray(completion.choices) || completion.choices.length === 0) {
        throw new Error('OpenAI API回應choices為空數組')
      }
      
      const firstChoice = completion.choices[0]
      if (!firstChoice) {
        throw new Error('OpenAI API回應第一個choice為空')
      }
      
      if (!firstChoice.message) {
        throw new Error('OpenAI API回應缺少message字段')
      }
      
      const response = firstChoice.message.content
      
      // 更嚴格的檢查response
      if (response === null || response === undefined || response === '') {
        throw new Error(`OpenAI API回應content無效: ${response}`)
      }
      
      if (typeof response !== 'string') {
        throw new Error(`OpenAI API回應content類型錯誤: ${typeof response}, 值: ${response}`)
      }
      
      console.log(`[${requestId}] ✅ OpenAI回應長度: ${response.length} 字符`)
      console.log(`[${requestId}] 📝 OpenAI回應內容預覽:`, response.substring(0, 200) + '...')
      return response
    } catch (error) {
      console.error(`[${requestId}] ❌ OpenAI API調用失敗:`, error.message)
      console.error(`[${requestId}] 📊 錯誤詳情:`, error)
      throw error
    }
  }

  async tryFallbackService(userInput, requestId, startTime) {
    console.log(`[${requestId}] 🔄 嘗試備用AI服務`)
    
    try {
      const fullPrompt = this.buildFullPrompt(userInput)
      let response
      let usedService = 'unknown'

      // 如果首選是Gemini，嘗試OpenAI
      if (this.preferredService === 'gemini' && this.openaiService) {
        response = await this.callOpenAIService(fullPrompt, requestId)
        usedService = 'openai-fallback'
      }
      // 如果首選是OpenAI，嘗試Gemini
      else if (this.preferredService === 'openai' && this.geminiService) {
        response = await this.callGeminiService(fullPrompt, requestId)
        usedService = 'gemini-fallback'
      }
      else {
        throw new Error('沒有可用的備用服務')
      }

      const parsedResponse = this.parseResponse(response, requestId)
      const validatedResponse = this.validateAndEnhanceResponse(parsedResponse, userInput, requestId)
      
      const processingTime = Date.now() - startTime
      console.log(`[${requestId}] ✅ 備用服務處理成功，耗時: ${processingTime}ms`)
      
      return {
        ...validatedResponse,
        metadata: {
          requestId,
          processingTime,
          aiService: usedService,
          fallback: true
        }
      }

    } catch (error) {
      console.error(`[${requestId}] ❌ 備用服務也失敗:`, error.message)
      
      // 返回預設回應
      return this.generateFallbackResponse(userInput, requestId, startTime)
    }
  }

  buildFullPrompt(userInput) {
    const { nickname, situation, topic, religion = '基督教' } = userInput
    
    // 使用詳細提示詞內容
    if (this.aiPrompts && this.aiPrompts.trim()) {
      // 替換提示詞中的變量
      let prompt = this.aiPrompts
        .replace(/\{nickname\}/g, nickname)
        .replace(/\{situation\}/g, situation)
        .replace(/\{topic\}/g, topic)
        .replace(/\{religion\}/g, religion)
      
      // 添加具體的回應格式要求
      prompt += `

## 當前用戶資訊：
- 暱稱：${nickname}
- 主題：${topic}
- 情況：${situation}
- 宗教背景：${religion}

請以耶穌的身份，按照上述詳細要求回應，並以JSON格式返回：
{
  "jesusLetter": "...",
  "guidedPrayer": "...",
  "coreMessage": "...",
  "biblicalReferences": [
    {
      "verse": "經文出處",
      "text": "經文內容",
      "context": "歷史背景",
      "meaning": "屬靈意義", 
      "application": "實際應用"
    }
  ]
}`
      
      return prompt
    }
    
    // 如果詳細提示詞未載入，使用增強版的內建提示詞
    return `你是耶穌基督，正在回覆一位名叫${nickname}的朋友的來信。

用戶情況：${situation}
關注主題：${topic}
宗教背景：${religion}

請按照以下格式回覆，並確保包含豐富的聖經引用和詳細內容：

## 回覆要求：

### jesusLetter (400-600字)
- 以耶穌的身份，用溫暖、智慧的語調回覆
- 針對用戶的具體情況給予安慰和指導
- 自然融入聖經教導和應許
- 展現對用戶處境的深度理解和同理心

### guidedPrayer (450-650字，包含四層面醫治禱告)
- 第一層：身體醫治 - 為身體健康、疾病得醫治禱告
- 第二層：情感醫治 - 為內心創傷、情緒困擾禱告  
- 第三層：關係醫治 - 為人際關係、家庭和睦禱告
- 第四層：靈性醫治 - 為靈命成長、與神關係禱告
- 每層禱告都要具體、深入，並引用相關聖經應許

### coreMessage (100-150字)
- 提煉核心信息和鼓勵
- 強調神的愛和應許

### biblicalReferences (必須5-7條)
每條引用包含：
- verse: 經文出處
- text: 經文內容
- context: 歷史背景
- meaning: 屬靈意義
- application: 實際應用

## 重要要求：
1. 必須包含5-7條聖經經文引用
2. 包含1-2個相關的聖經故事
3. 針對${religion}背景提供合適的屬靈指導
4. 語調溫和、智慧、充滿希望
5. 內容要個人化，直接回應用戶的具體需要

請以JSON格式回覆：
{
  "jesusLetter": "...",
  "guidedPrayer": "...", 
  "coreMessage": "...",
  "biblicalReferences": [...]
}`
  }

  parseResponse(response, requestId) {
    try {
      console.log(`[${requestId}] 🔍 開始解析AI回應`)
      console.log(`[${requestId}] 📝 原始回應:`, response)
      
      // 檢查輸入參數
      if (!response || typeof response !== 'string') {
        console.error(`[${requestId}] ❌ 無效的回應文本:`, response)
        throw new Error(`無效的回應文本: ${response}`)
      }
      
      // 檢查是否為分段響應並進行累積處理
      let accumulatedResponse = this.accumulateJsonChunks(response, requestId)
      
      // 清理回應文本
      let cleanedResponse = accumulatedResponse.trim()
      
      // 檢查清理後的回應
      if (!cleanedResponse) {
        console.error(`[${requestId}] ❌ 清理後的回應為空`)
        throw new Error('清理後的回應為空')
      }
      
      // 移除所有可能的 markdown 代碼塊標記
      cleanedResponse = cleanedResponse.replace(/^```+\s*json\s*/gi, '')
      cleanedResponse = cleanedResponse.replace(/\s*```+\s*$/g, '')
      cleanedResponse = cleanedResponse.replace(/```+json\s*/gi, '')
      cleanedResponse = cleanedResponse.replace(/```+/g, '')
      
      // 移除可能的前綴文字（如英文開頭）
      const jsonStartIndex = cleanedResponse.indexOf('{')
      if (jsonStartIndex > 0) {
        console.log(`[${requestId}] ⚠️ 發現JSON前有額外文字，移除前綴`)
        console.log(`[${requestId}] 📝 前綴內容:`, cleanedResponse.substring(0, jsonStartIndex))
        cleanedResponse = cleanedResponse.substring(jsonStartIndex)
      }
      
      // 找到JSON結束位置，移除後面的多餘內容
      const jsonEndIndex = cleanedResponse.lastIndexOf('}')
      if (jsonEndIndex > 0 && jsonEndIndex < cleanedResponse.length - 1) {
        console.log(`[${requestId}] ⚠️ 發現JSON後有額外文字，移除後綴`)
        cleanedResponse = cleanedResponse.substring(0, jsonEndIndex + 1)
      }
      
      console.log(`[${requestId}] 📝 清理後的回應:`, cleanedResponse)
      
      // 找到最後一個完整的JSON對象
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        let jsonStr = jsonMatch[0]
        
        // 修復常見的JSON格式問題
        jsonStr = this.fixJsonFormat(jsonStr, requestId)
        
        console.log(`[${requestId}] 📝 修復後的JSON:`, jsonStr)
        
        const parsed = JSON.parse(jsonStr)
        console.log(`[${requestId}] ✅ JSON解析成功`)
        return parsed
      }

      // 如果沒有找到JSON，嘗試提取內容
      console.log(`[${requestId}] ⚠️ 未找到JSON格式，嘗試提取內容`)
      return this.extractContentFromText(response)

    } catch (error) {
      console.error(`[${requestId}] ❌ 解析回應失敗:`, error.message)
      console.log(`[${requestId}] 📝 原始回應:`, response)
      
      // 嘗試手動提取結構化內容
      return this.extractStructuredContent(response, requestId)
    }
  }

  // 新增方法：累積和處理分段 JSON 響應
  accumulateJsonChunks(response, requestId) {
    console.log(`[${requestId}] 🔗 檢查是否為分段響應`)
    
    // 檢查是否包含分段標識符
    const hasJesusLetterChunk = response.includes('"jesusLetter"') && !response.includes('"guidedPrayer"')
    const hasGuidedPrayerChunk = response.includes('"guidedPrayer"') && !response.includes('"biblicalReferences"')
    const hasBiblicalReferencesChunk = response.includes('"biblicalReferences"') && !response.includes('"coreMessage"')
    const hasCoreMessageChunk = response.includes('"coreMessage"') && !response.includes('}')
    
    // 如果檢測到分段響應，嘗試重構完整的 JSON
    if (hasJesusLetterChunk || hasGuidedPrayerChunk || hasBiblicalReferencesChunk || hasCoreMessageChunk) {
      console.log(`[${requestId}] 🧩 檢測到分段響應，嘗試重構完整 JSON`)
      return this.reconstructCompleteJson(response, requestId)
    }
    
    // 檢查 JSON 是否不完整（缺少結束括號）
    const openBraces = (response.match(/\{/g) || []).length
    const closeBraces = (response.match(/\}/g) || []).length
    
    if (openBraces > closeBraces) {
      console.log(`[${requestId}] 🔧 檢測到不完整的 JSON，嘗試補全`)
      return this.completeIncompleteJson(response, requestId)
    }
    
    return response
  }

  // 重構完整的 JSON 從分段響應
  reconstructCompleteJson(response, requestId) {
    console.log(`[${requestId}] 🔨 重構完整 JSON`)
    
    // 提取各個字段的內容
    let jesusLetter = ''
    let guidedPrayer = ''
    let biblicalReferences = []
    let coreMessage = ''
    
    // 使用更寬鬆的正則表達式來匹配分段內容
    const jesusLetterMatch = response.match(/"jesusLetter"[:\s]*"([^"]*(?:\\.[^"]*)*)"/s)
    if (jesusLetterMatch) {
      jesusLetter = jesusLetterMatch[1] || ''
    }
    
    const guidedPrayerMatch = response.match(/"guidedPrayer"[:\s]*"([^"]*(?:\\.[^"]*)*)"/s)
    if (guidedPrayerMatch) {
      guidedPrayer = guidedPrayerMatch[1] || ''
    }
    
    const biblicalReferencesMatch = response.match(/"biblicalReferences"[:\s]*\[([^\]]*)\]/s)
    if (biblicalReferencesMatch) {
      const refs = biblicalReferencesMatch[1].match(/"([^"]*)"/g)
      if (refs) {
        biblicalReferences = refs.map(ref => ref.replace(/"/g, ''))
      }
    }
    
    const coreMessageMatch = response.match(/"coreMessage"[:\s]*"([^"]*(?:\\.[^"]*)*)"/s)
    if (coreMessageMatch) {
      coreMessage = coreMessageMatch[1] || ''
    }
    
    // 構建完整的 JSON 字符串
    const completeJson = {
      jesusLetter: jesusLetter || '親愛的朋友，我聽見了你的心聲，我愛你，我與你同在。',
      guidedPrayer: guidedPrayer || '親愛的天父，感謝你的愛和恩典，求你賜給我們平安和力量。',
      biblicalReferences: biblicalReferences.length > 0 ? biblicalReferences : ['約翰福音 3:16'],
      coreMessage: coreMessage || '神愛你，祂必與你同在'
    }
    
    console.log(`[${requestId}] ✅ 成功重構完整 JSON`)
    return JSON.stringify(completeJson)
  }

  // 補全不完整的 JSON
  completeIncompleteJson(response, requestId) {
    console.log(`[${requestId}] 🔧 補全不完整的 JSON`)
    
    let completedJson = response.trim()
    
    // 確保所有字符串字段都有結束引號
    const fieldPatterns = [
      /"jesusLetter"\s*:\s*"[^"]*$/,
      /"guidedPrayer"\s*:\s*"[^"]*$/,
      /"coreMessage"\s*:\s*"[^"]*$/
    ]
    
    fieldPatterns.forEach(pattern => {
      if (pattern.test(completedJson)) {
        completedJson += '"'
      }
    })
    
    // 確保 biblicalReferences 陣列完整
    if (/"biblicalReferences"\s*:\s*\[[^\]]*$/.test(completedJson)) {
      completedJson += ']'
    }
    
    // 確保 JSON 對象完整
    const openBraces = (completedJson.match(/\{/g) || []).length
    const closeBraces = (completedJson.match(/\}/g) || []).length
    
    for (let i = 0; i < openBraces - closeBraces; i++) {
      completedJson += '}'
    }
    
    console.log(`[${requestId}] ✅ JSON 補全完成`)
    return completedJson
  }

  fixJsonFormat(jsonStr, requestId) {
    console.log(`[${requestId}] 🔧 修復JSON格式`)
    console.log(`[${requestId}] 📝 原始JSON字符串:`, jsonStr.substring(0, 200) + '...')
    
    try {
      // 首先嘗試解析，如果成功就直接返回
      JSON.parse(jsonStr)
      console.log(`[${requestId}] ✅ JSON格式正確，無需修復`)
      return jsonStr
    } catch (error) {
      console.log(`[${requestId}] ⚠️ JSON格式有問題，開始修復:`, error.message)
    }
    
    let originalStr = jsonStr
    
    // 第一步：移除所有 markdown 代碼塊標記
    jsonStr = jsonStr.replace(/```json\s*/gi, '') // 移除開頭 ```json 標記
    jsonStr = jsonStr.replace(/```\s*$/gi, '') // 移除結尾 ``` 標記
    jsonStr = jsonStr.replace(/```/g, '') // 移除任何剩餘的 ``` 標記
    
    // 第二步：移除開頭的非JSON內容（但保留 { 開始的內容）
    const jsonStart = jsonStr.indexOf('{')
    if (jsonStart > 0) {
      jsonStr = jsonStr.substring(jsonStart)
    }
    
    // 第三步：移除結尾的非JSON內容（但保留到最後一個 } ）
    const jsonEnd = jsonStr.lastIndexOf('}')
    if (jsonEnd >= 0 && jsonEnd < jsonStr.length - 1) {
      jsonStr = jsonStr.substring(0, jsonEnd + 1)
    }
    
    // 第四步：處理字符串值內的換行符問題
    // 只處理字符串值內的換行符，不破壞JSON結構
    jsonStr = jsonStr.replace(/"([^"]*?)"/g, (match, content) => {
      // 在字符串內容中處理換行符
      let processedContent = content
        .replace(/\r\n/g, '\\n')  // Windows 換行符
        .replace(/\n/g, '\\n')    // Unix 換行符
        .replace(/\r/g, '\\n')    // Mac 換行符
        .replace(/\t/g, '\\t')    // 制表符
        .replace(/\\n\\n+/g, '\\n') // 將多個連續的 \n 轉換為單個 \n
      
      return `"${processedContent}"`
    })
    
    // 第五步：修復可能的尾隨逗號
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')
    
    // 第六步：確保字符串值被正確引用（處理未引用的值）
    jsonStr = jsonStr.replace(/:\s*([^",\{\[\]\}\s][^,\}\]]*?)(?=\s*[,\}])/g, (match, value) => {
      const trimmedValue = value.trim()
      // 檢查是否為布爾值、null或數字
      if (trimmedValue === 'true' || trimmedValue === 'false' || 
          trimmedValue === 'null' || /^-?\d+(\.\d+)?$/.test(trimmedValue)) {
        return match // 保持布爾值、null和數字不變
      }
      return `: "${trimmedValue}"`
    })
    
    console.log(`[${requestId}] 🔧 JSON修復完成`)
    console.log(`[${requestId}] 📝 修復後JSON字符串:`, jsonStr.substring(0, 200) + '...')
    
    // 最終驗證
    try {
      JSON.parse(jsonStr)
      console.log(`[${requestId}] ✅ JSON修復成功`)
      return jsonStr
    } catch (error) {
      console.log(`[${requestId}] ❌ JSON修復失敗:`, error.message)
      console.log(`[${requestId}] 📝 修復失敗的JSON:`, jsonStr)
      // 如果修復失敗，返回原始字符串讓後續處理
      return originalStr
    }
  }

  extractStructuredContent(response, requestId) {
    console.log(`[${requestId}] 🔧 嘗試手動提取結構化內容`)
    
    try {
      // 嘗試從文本中提取各個部分
      let jesusLetter = ''
      let guidedPrayer = ''
      let biblicalReferences = []
      let coreMessage = ''
      
      // 查找jesusLetter部分
      const jesusLetterMatch = response.match(/"jesusLetter":\s*"([^"]*(?:\\.[^"]*)*)"/)
      if (jesusLetterMatch) {
        jesusLetter = jesusLetterMatch[1]
          .replace(/\\n\\n/g, '') // 完全刪除雙換行符
          .replace(/\\n/g, '\n')  // 轉換單換行符
          .replace(/\\"/g, '"')   // 轉換引號
      }
      
      // 查找guidedPrayer部分
      const guidedPrayerMatch = response.match(/"guidedPrayer":\s*"([^"]*(?:\\.[^"]*)*)"/)
      if (guidedPrayerMatch) {
        guidedPrayer = guidedPrayerMatch[1]
          .replace(/\\n\\n/g, '') // 完全刪除雙換行符
          .replace(/\\n/g, '\n')  // 轉換單換行符
          .replace(/\\"/g, '"')   // 轉換引號
      }
      
      // 查找biblicalReferences部分
      const biblicalReferencesMatch = response.match(/"biblicalReferences":\s*\[(.*?)\]/)
      if (biblicalReferencesMatch) {
        const refs = biblicalReferencesMatch[1].match(/"([^"]*)"/g)
        if (refs) {
          biblicalReferences = refs.map(ref => ref.replace(/"/g, ''))
        }
      }
      
      // 查找coreMessage部分
      const coreMessageMatch = response.match(/"coreMessage":\s*"([^"]*(?:\\.[^"]*)*)"/)
      if (coreMessageMatch) {
        coreMessage = coreMessageMatch[1]
          .replace(/\\n\\n/g, '') // 完全刪除雙換行符
          .replace(/\\n/g, '\n')  // 轉換單換行符
          .replace(/\\"/g, '"')   // 轉換引號
      }
      
      console.log(`[${requestId}] ✅ 手動提取結構化內容成功`)
      return {
        jesusLetter: jesusLetter || '親愛的朋友，我聽見了你的心聲，我愛你，我與你同在。',
        guidedPrayer: guidedPrayer || '親愛的天父，感謝你的愛和恩典，求你賜給我們平安和力量。',
        biblicalReferences: biblicalReferences.length > 0 ? biblicalReferences : ['約翰福音 3:16'],
        coreMessage: coreMessage || '神愛你，祂必與你同在'
      }
      
    } catch (error) {
      console.error(`[${requestId}] ❌ 手動提取失敗:`, error.message)
      return this.createStructuredResponse(response)
    }
  }

  extractContentFromText(text) {
    return {
      jesusLetter: text.substring(0, Math.min(text.length, 800)),
      guidedPrayer: '親愛的天父，感謝你透過耶穌基督賜給我們的愛和恩典...',
      biblicalReferences: ['約翰福音 3:16', '詩篇 23:1', '腓立比書 4:13'],
      coreMessage: '神愛你，祂必與你同在'
    }
  }

  createStructuredResponse(text) {
    return {
      jesusLetter: text || '親愛的孩子，我看見了你的心，我愛你...',
      guidedPrayer: '親愛的天父，感謝你的愛和恩典，求你賜給我們智慧和力量。',
      biblicalReferences: ['約翰福音 3:16', '詩篇 23:1'],
      coreMessage: '神愛你，祂必與你同在'
    }
  }

  validateAndEnhanceResponse(response, userInput, requestId) {
    console.log(`[${requestId}] 🔍 開始驗證和增強回應`)
    const { nickname } = userInput

    // 確保必要欄位存在
    response.jesusLetter = response.jesusLetter || `親愛的${nickname}，我看見了你的困難，我愛你，我與你同在...`
    response.guidedPrayer = response.guidedPrayer || `我來為您禱告，如果您願意，可以跟著一起唸：

親愛的天父，

我們來到你的面前，感謝你賜給我們耶穌基督，讓我們可以透過祂來到你的面前。

我們為${nickname}祈求，在他/她面臨${userInput.topic}的挑戰時，求你賜給他/她智慧和力量。

求你的平安充滿${nickname}的心，讓他/她在困難中仍能經歷你的愛。

主啊，我們將一切都交託在你的手中，相信你必有最好的安排。`
    response.biblicalReferences = response.biblicalReferences || ['約翰福音 3:16']
    response.coreMessage = response.coreMessage || '神愛你，祂必與你同在'

    // 清理和分離內容，確保jesusLetter和guidedPrayer不會混合
    response.jesusLetter = this.cleanJesusLetter(response.jesusLetter)
    response.guidedPrayer = this.cleanGuidedPrayer(response.guidedPrayer)

    // 檢查內容長度並增強（縮小增補門檻以避免過度拉長）
    if (response.jesusLetter.length < 350) {
      response.jesusLetter = this.enhanceJesusLetter(response.jesusLetter, userInput)
    }

    if (response.guidedPrayer.length < 300) {
      response.guidedPrayer = this.enhanceGuidedPrayer(response.guidedPrayer, userInput, response.jesusLetter)
    }

    // 確保聖經引用數量符合新要求（5-7條）
    if (response.biblicalReferences.length < 5) {
      response.biblicalReferences = this.enhanceBiblicalReferences(response.biblicalReferences, userInput)
    }

    console.log(`[${requestId}] ✅ 回應驗證和增強完成`)
    
    // 確保聖經引用格式正確
    if (response.biblicalReferences) {
      response.biblicalReferences = response.biblicalReferences.map(ref => {
        if (typeof ref === 'string') {
          return {
            verse: ref,
            text: '請查閱聖經獲取完整經文',
            context: '相關背景',
            meaning: '屬靈意義',
            application: '實際應用'
          }
        }
        return {
          verse: ref.verse || '未知',
          text: ref.text || '請查閱聖經獲取完整經文',
          context: ref.context || '相關背景',
          meaning: ref.meaning || '屬靈意義',
          application: ref.application || '實際應用'
        }
      })
    }
    
    return response
  }

  enhanceBiblicalReferences(existingRefs, userInput) {
    const { topic } = userInput
    
    // 根據主題提供更多聖經引用，確保達到5-7條
    const topicReferences = {
      '工作': [
        { verse: '傳道書 3:1', text: '凡事都有定期，天下萬務都有定時。' },
        { verse: '箴言 16:3', text: '你所做的，要交託耶和華，你所謀的，就必成立。' },
        { verse: '歌羅西書 3:23', text: '無論做什麼，都要從心裡做，像是給主做的，不是給人做的。' },
        { verse: '腓立比書 4:19', text: '我的神必照他榮耀的豐富，在基督耶穌裡，使你們一切所需用的都充足。' },
        { verse: '以弗所書 2:10', text: '我們原是他的工作，在基督耶穌裡造成的，為要叫我們行善，就是神所預備叫我們行的。' }
      ],
      '感情': [
        { verse: '哥林多前書 13:4-7', text: '愛是恆久忍耐，又有恩慈；愛是不嫉妒；愛是不自誇，不張狂。' },
        { verse: '約翰一書 4:18', text: '愛裡沒有懼怕；愛既完全，就把懼怕除去。' },
        { verse: '以弗所書 4:32', text: '並要以恩慈相待，存憐憫的心，彼此饒恕，正如神在基督裡饒恕了你們一樣。' },
        { verse: '箴言 17:17', text: '朋友乃時常親愛，弟兄為患難而生。' },
        { verse: '羅馬書 12:10', text: '愛弟兄，要彼此親熱；恭敬人，要彼此推讓。' }
      ],
      '財富': [
        { verse: '馬太福音 6:26', text: '你們看那天上的飛鳥，也不種，也不收，也不積蓄在倉裡，你們的天父尚且養活牠。你們不比飛鳥貴重得多嗎？' },
        { verse: '提摩太前書 6:6', text: '然而，敬虔加上知足的心便是大利了。' },
        { verse: '希伯來書 13:5', text: '你們存心不可貪愛錢財，要以自己所有的為足；因為主曾說：我總不撇下你，也不丟棄你。' },
        { verse: '瑪拉基書 3:10', text: '萬軍之耶和華說：你們要將當納的十分之一全然送入倉庫，使我家有糧，以此試試我，是否為你們敞開天上的窗戶，傾福與你們，甚至無處可容。' },
        { verse: '箴言 3:9-10', text: '你要以財物和一切初熟的土產尊榮耶和華。這樣，你的倉房必充滿有餘；你的酒醡有新酒盈溢。' }
      ],
      '健康': [
        { verse: '以賽亞書 53:5', text: '哪知他為我們的過犯受害，為我們的罪孽壓傷。因他受的刑罰，我們得平安；因他受的鞭傷，我們得醫治。' },
        { verse: '詩篇 103:2-3', text: '我的心哪，你要稱頌耶和華！不可忘記他的一切恩惠！他赦免你的一切罪孽，醫治你的一切疾病。' },
        { verse: '雅各書 5:14-15', text: '你們中間有病了的呢，他就該請教會的長老來；他們可以奉主的名用油抹他，為他禱告。出於信心的祈禱要救那病人，主必叫他起來；他若犯了罪，也必蒙赦免。' },
        { verse: '約翰三書 1:2', text: '親愛的兄弟啊，我願你凡事興盛，身體健壯，正如你的靈魂興盛一樣。' },
        { verse: '出埃及記 15:26', text: '又說：你若留意聽耶和華─你神的話，又行我眼中看為正的事，留心聽我的誡命，守我一切的律例，我就不將所加與埃及人的疾病加在你身上，因為我─耶和華是醫治你的。' }
      ],
      '家庭': [
        { verse: '約書亞記 24:15', text: '至於我和我家，我們必定事奉耶和華。' },
        { verse: '以弗所書 6:1-3', text: '你們作兒女的，要在主裡聽從父母，這是理所當然的。要孝敬父母，使你得福，在世長壽。這是第一條帶應許的誡命。' },
        { verse: '箴言 22:6', text: '教養孩童，使他走當行的道，就是到老他也不偏離。' },
        { verse: '歌羅西書 3:20-21', text: '你們作兒女的，要凡事聽從父母，因為這是主所喜悅的。你們作父親的，不要惹兒女的氣，恐怕他們失了志氣。' },
        { verse: '詩篇 127:3', text: '兒女是耶和華所賜的產業；所懷的胎是他所給的賞賜。' }
      ],
      '信仰': [
        { verse: '希伯來書 11:1', text: '信就是所望之事的實底，是未見之事的確據。' },
        { verse: '羅馬書 10:17', text: '可見信道是從聽道來的，聽道是從基督的話來的。' },
        { verse: '雅各書 1:6', text: '只要憑著信心求，一點不疑惑；因為那疑惑的人，就像海中的波浪，被風吹動翻騰。' },
        { verse: '馬可福音 9:23', text: '耶穌對他說：你若能信，在信的人，凡事都能。' },
        { verse: '以弗所書 2:8-9', text: '你們得救是本乎恩，也因著信；這並不是出於自己，乃是神所賜的；也不是出於行為，免得有人自誇。' }
      ]
    }
    
    const additionalRefs = topicReferences[topic] || topicReferences['信仰']
    const combined = [...existingRefs, ...additionalRefs]
    
    // 確保返回5-7條不重複的引用
    const uniqueRefs = []
    const seenVerses = new Set()
    
    for (const ref of combined) {
      const verseKey = typeof ref === 'string' ? ref : ref.verse
      if (!seenVerses.has(verseKey) && uniqueRefs.length < 7) {
        seenVerses.add(verseKey)
        uniqueRefs.push(ref)
      }
    }
    
    // 如果還不夠5條，添加通用經文
    while (uniqueRefs.length < 5) {
      const fallbackRefs = [
        { verse: '約翰福音 3:16', text: '神愛世人，甚至將他的獨生子賜給他們，叫一切信他的，不致滅亡，反得永生。' },
        { verse: '羅馬書 8:28', text: '我們知道萬事都互相效力，叫愛神的人得益處，就是按他旨意被召的人。' },
        { verse: '腓立比書 4:13', text: '我靠著那加給我力量的，凡事都能做。' },
        { verse: '詩篇 23:1', text: '耶和華是我的牧者，我必不致缺乏。' },
        { verse: '以賽亞書 40:31', text: '但那等候耶和華的必從新得力。他們必如鷹展翅上騰；他們奔跑卻不困倦，行走卻不疲乏。' }
      ]
      
      for (const ref of fallbackRefs) {
        if (!seenVerses.has(ref.verse) && uniqueRefs.length < 7) {
          seenVerses.add(ref.verse)
          uniqueRefs.push(ref)
        }
      }
      break
    }
    
    return uniqueRefs.slice(0, 7) // 最多7條
  }



  cleanJesusLetter(letter) {
    if (!letter) return ''
    
    // 移除可能混入的禱告內容
    let cleaned = letter
      .replace(/我來為您禱告.*?阿們。/gs, '') // 移除禱告段落
      .replace(/親愛的天父.*?阿們。/gs, '') // 移除禱告段落
      .replace(/奉耶穌的名禱告.*?阿們。/gs, '') // 移除禱告結尾
      .replace(/如果您願意，可以跟著一起唸.*$/gs, '') // 移除禱告引導語
      .trim()
    
    return cleaned
  }

  cleanGuidedPrayer(prayer) {
    if (!prayer) return ''
    
    // 確保禱告內容以正確格式開始
    let cleaned = prayer.trim()
    
    // 如果不是以"我來為您禱告"開始，則添加
    if (!cleaned.startsWith('我來為您禱告')) {
      cleaned = '我來為您禱告，如果您願意，可以跟著一起唸：\n\n' + cleaned
    }
    
    return cleaned
  }

  enhanceJesusLetter(letter, userInput) {
    const { nickname, topic } = userInput
    
    const enhancement = `


我深深理解你在${topic}方面所面臨的挑戰。每一個困難都是成長的機會，每一次眼淚都被我珍藏。

記住，我曾說過："凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。"（馬太福音 11:28）你不是孤單的，我一直與你同在。

在這個過程中，請相信我的計劃是美好的。雖然現在可能看不清前路，但我會一步步引導你。就像牧羊人引導羊群一樣，我會帶領你走過這個困難時期。

願我的平安充滿你的心，願我的愛成為你的力量。

`

    return `${letter}${enhancement}`
  }

  enhanceGuidedPrayer(prayer, userInput, jesusLetter = '') {
    const { nickname, topic, situation } = userInput
    
    // 將topic轉換為具體的禱告主題並推測可能的隱藏需要
    const topicMapping = {
      '工作': {
        name: '工作',
        prayerContext: '工作上的需要',
        hiddenNeeds: '工作壓力、人際關係、職涯方向、工作與生活平衡的困擾'
      },
      '財富': {
        name: '財富', 
        prayerContext: '經濟上的需要',
        hiddenNeeds: '經濟壓力、理財焦慮、對未來的不安全感、物質與心靈的平衡'
      },
      '信仰': {
        name: '信仰',
        prayerContext: '信仰上的需要',
        hiddenNeeds: '靈性乾渴、信心軟弱、與神關係的疏遠、屬靈爭戰'
      },
      '感情': {
        name: '感情',
        prayerContext: '感情上的需要',
        hiddenNeeds: '關係中的傷痛、孤單感、對愛的渴望、過去的創傷'
      },
      '健康': {
        name: '健康',
        prayerContext: '健康上的需要',
        hiddenNeeds: '身體的痛苦、對疾病的恐懼、心理健康、家人的擔憂'
      },
      '家庭': {
        name: '家庭',
        prayerContext: '家庭上的需要',
        hiddenNeeds: '家庭衝突、代溝問題、責任重擔、對家人的擔心'
      },
      '其他': {
        name: '其他',
        prayerContext: '生活中的各種需要',
        hiddenNeeds: '內心深處的困擾、說不出的重擔、未來的不確定性'
      }
    }
    
    const topicInfo = topicMapping[topic] || { 
      name: topic, 
      prayerContext: '生活中的需要',
      hiddenNeeds: '內心的重擔和困擾' 
    }
    
    // 從耶穌回信中提取關鍵信息用於禱告
    let jesusInsight = ''
    if (jesusLetter) {
      // 簡單提取一些關鍵詞和概念
      if (jesusLetter.includes('平安')) jesusInsight += '求你賜給他/她內心的平安，'
      if (jesusLetter.includes('智慧')) jesusInsight += '求你賜給他/她屬天的智慧，'
      if (jesusLetter.includes('力量')) jesusInsight += '求你成為他/她的力量，'
      if (jesusLetter.includes('盼望')) jesusInsight += '求你賜給他/她活潑的盼望，'
      if (jesusLetter.includes('恩典')) jesusInsight += '讓他/她經歷你豐盛的恩典，'
    }
    
    const enhancement = `

我們來到你的面前，為在${topicInfo.prayerContext}向你祈求。

感謝你的愛從不改變，感謝你的恩典夠我們用。${jesusInsight}讓我們能夠在困難中看見你的作為。

主啊，雖然我們可能沒有詳細說出所有的困難，但你是無所不知的神，你深知我們在${topicInfo.name}方面可能面臨的挑戰，包括${topicInfo.hiddenNeeds}。求你親自安慰我們的心，醫治那些隱而未現的傷痛。

就如你透過耶穌向我們所說的話，我們也為此祈求：求你安慰我們的心，除去一切的憂慮和恐懼。讓你的平安如江河一般流淌在我們的心中。

天父，即使我們沒有說出口的重擔，你都看見了。求你親自背負我們的憂慮，讓我們知道不需要獨自承擔。無論是已經分享的困難，還是藏在心底的掙扎，都求你一一眷顧。

求你按著你在耶穌裡的應許，成就在我們身上。讓我們不僅聽見你的話語，更能經歷你話語的能力。

主啊，我們將這一切都交託在你的手中，包括那些說不出來的嘆息和眼淚，相信你必有最好的安排。求你繼續引導和保守我們，讓我們在每一天都能感受到你的同在和愛。`

    return prayer + '\n' + enhancement
  }

  generateFallbackResponse(userInput, requestId, startTime) {
    console.log(`[${requestId}] 🆘 生成預設回應`)
    
    const { nickname, topic } = userInput
    const processingTime = Date.now() - startTime
    
    // 推測不同主題可能的隱藏需要
    const topicInsights = {
      '工作': '工作壓力、人際關係或職涯方向',
      '財富': '經濟壓力或對未來的不安全感',
      '信仰': '靈性乾渴或與神關係的疏遠',
      '感情': '關係中的傷痛或孤單感',
      '健康': '身體的痛苦或對疾病的恐懼',
      '家庭': '家庭衝突或對家人的擔心',
      '其他': '內心深處的困擾'
    }
    
    const hiddenConcerns = topicInsights[topic] || '內心的重擔'
    
    return {
      jesusLetter: `親愛的${nickname}，

雖然現在我無法給你詳細的回應，但我想讓你知道，我愛你，我看見你在${topic}方面的困擾。

無論你正在經歷什麼，請記住你不是孤單的。我一直與你同在，我的愛永不改變。

在困難的時候，請來到我面前，將你的重擔卸給我。我會給你力量，我會給你平安。

相信我對你的計劃是美好的，雖然現在可能看不清楚，但我會一步步引導你。

愛你的耶穌`,

      guidedPrayer: `我來為您禱告，如果您願意，可以跟著一起唸：

親愛的天父，

我們來到你的面前，感謝你賜給我們耶穌基督，讓我們可以透過祂來到你的面前。

我們為${nickname}祈求，在他/她面臨${topic}的挑戰時，求你賜給他/她智慧和力量。

主啊，雖然${nickname}可能沒有詳細說出所有的困難，但你是無所不知的神，你深知他/她可能面臨的${hiddenConcerns}。求你親自安慰他/她的心，醫治那些隱而未現的傷痛。

就如你透過耶穌向${nickname}所說的話，我們也為他/她祈求：求你的平安充滿他/她的心，讓他/她在困難中仍能經歷你的愛和同在。

天父，即使${nickname}沒有說出口的重擔，你都看見了。求你親自背負他/她的憂慮，讓他/她知道不需要獨自承擔。無論是已經分享的困難，還是藏在心底的掙扎，都求你一一眷顧。

求你按著你在耶穌裡的應許，成就在${nickname}身上。讓他/她不僅聽見你的話語，更能經歷你話語的能力。

主啊，我們將一切都交託在你的手中，包括那些說不出來的嘆息和眼淚，相信你必有最好的安排。求你繼續引導和保守${nickname}，讓他/她在每一天都能感受到你的同在和愛。`,

      biblicalReferences: [
        '馬太福音 11:28 - 凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。',
        '詩篇 23:1 - 耶和華是我的牧者，我必不致缺乏。',
        '腓立比書 4:13 - 我靠著那加給我力量的，凡事都能做。'
      ],

      coreMessage: '神愛你，祂必與你同在，永不離棄你。',

      metadata: {
        requestId,
        processingTime,
        aiService: 'fallback',
        fallback: true,
        error: 'AI服務暫時不可用'
      }
    }
  }

  estimateTokens(text) {
    if (!text) return 0
    // 簡單估算：中文字符約1.5個token，英文單詞約1個token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    return Math.ceil(chineseChars * 1.5 + englishWords)
  }

  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  getServiceStatus() {
    return {
      gemini: !!this.geminiService,
      openai: !!this.openaiService,
      initialized: this.isInitialized,
      preferredService: this.preferredService,
      openaiModel: this.openaiModel
    }
  }
}

// 創建AI服務實例
const aiService = new BackendAIService()

// POST /api/ai/generate - 生成AI回應
router.post('/generate', async (req, res, next) => {
  try {
    const { userInput } = req.body

    // 驗證必要欄位
    if (!userInput || !userInput.nickname || !userInput.situation || !userInput.topic) {
      return res.status(400).json({
        error: '缺少必要欄位',
        required: ['nickname', 'situation', 'topic'],
        received: Object.keys(userInput || {})
      })
    }

    // 驗證內容長度
    if (userInput.situation.length > 2000) {
      return res.status(400).json({
        error: '情況描述過長',
        maxLength: 2000,
        currentLength: userInput.situation.length
      })
    }

    // 生成AI回應
    const aiResponse = await aiService.generateResponse(userInput)

    res.json({
      success: true,
      data: {
        userInput,
        aiResponse
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI生成失敗:', error)
    next(error)
  }
})

// GET /api/ai/status - 獲取AI服務狀態
router.get('/status', (req, res) => {
  try {
    const status = aiService.getServiceStatus()
    
    res.json({
      success: true,
      data: {
        ...status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    })
  } catch (error) {
    console.error('❌ 獲取AI狀態失敗:', error)
    res.status(500).json({
      error: '獲取服務狀態失敗',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /api/ai/test - 測試AI服務
router.post('/test', async (req, res, next) => {
  try {
    const testInput = {
      nickname: '測試用戶',
      topic: '信仰',
      situation: '這是一個測試請求，用於驗證AI服務是否正常工作。',
      religion: '基督徒'
    }

    const startTime = Date.now()
    const aiResponse = await aiService.generateResponse(testInput)
    const responseTime = Date.now() - startTime

    res.json({
      success: true,
      data: {
        testResult: 'AI服務正常',
        responseTime: `${responseTime}ms`,
        aiService: aiResponse.metadata?.aiService || 'unknown',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ AI測試失敗:', error)
    next(error)
  }
})

export default router