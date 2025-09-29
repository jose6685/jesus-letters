// @ts-nocheck
const fs = require('fs')
const path = require('path')

/**
 * 簡化版 AI 服務
 * 專注於核心功能，提供穩定的 AI 回應生成
 */
export default class SimplifiedAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY
    this.baseURL = 'https://api.openai.com/v1/chat/completions'
    // 可由環境變數設定；預設使用更快且便宜的 gpt-4o-mini
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    this.maxRetries = 3
    this.timeout = 30000
    
    // 載入外部提示文件
    this.loadPromptFiles()
    
    console.log('🤖 SimplifiedAIService 初始化完成')
  }

  /**
   * 載入外部提示文件內容
   */
  loadPromptFiles() {
    try {
      const aiPromptsPath = path.join(__dirname, '../../AI_Prompts_Detailed.md')
      const prayerPromptsPath = path.join(__dirname, '../../Prayer_Prompts_Detailed.md')
      
      this.aiPrompts = fs.existsSync(aiPromptsPath) ? fs.readFileSync(aiPromptsPath, 'utf8') : ''
      this.prayerPrompts = fs.existsSync(prayerPromptsPath) ? fs.readFileSync(prayerPromptsPath, 'utf8') : ''
      
      console.log('✅ 成功載入外部提示文件')
    } catch (error) {
      console.warn('⚠️ 載入外部提示文件失敗:', error.message)
      this.aiPrompts = ''
      this.prayerPrompts = ''
    }
  }

  /**
   * 生成 AI 回應
   */
  async generateResponse(userInput) {
    const requestId = this.generateRequestId()
    console.log(`[${requestId}] 🚀 開始處理請求`)
    
    try {
      // 主要服務
      const response = await this.callPrimaryService(userInput, requestId)
      return response
    } catch (error) {
      console.error(`[${requestId}] ❌ 主要服務失敗:`, error.message)
      
      // 備用服務
      try {
        const fallbackResponse = await this.callFallbackService(userInput, requestId)
        return fallbackResponse
      } catch (fallbackError) {
        console.error(`[${requestId}] ❌ 備用服務也失敗:`, fallbackError.message)
        return this.generateFallbackResponse(userInput, requestId)
      }
    }
  }

  /**
   * 主要 AI 服務
   */
  async callPrimaryService(userInput, requestId) {
    const startTime = Date.now()
    
    try {
      const prompt = this.buildPrompt(userInput)
      console.log(`[${requestId}] 📝 提示詞構建完成`)
      
      const response = await this.makeAPICall(prompt, requestId)
      const processingTime = Date.now() - startTime
      
      console.log(`[${requestId}] ⏱️ 主要服務處理時間: ${processingTime}ms`)
      
      const parsedResponse = this.parseResponse(response, requestId)
      const validatedResponse = this.validateAndEnhanceResponse(parsedResponse, userInput, requestId)
      
      console.log(`[${requestId}] ✅ 主要服務處理成功`)
      return validatedResponse
      
    } catch (error) {
      console.error(`[${requestId}] ❌ 主要服務錯誤:`, error.message)
      throw error
    }
  }

  /**
   * 備用 AI 服務
   */
  async callFallbackService(userInput, requestId) {
    const startTime = Date.now()
    
    try {
      console.log(`[${requestId}] 🔄 啟動備用服務`)
      
      // 使用簡化的提示詞
      const simplifiedPrompt = this.buildSimplifiedPrompt(userInput)
      const response = await this.makeAPICall(simplifiedPrompt, requestId)
      
      const processingTime = Date.now() - startTime
      console.log(`[${requestId}] ⏱️ 備用服務處理時間: ${processingTime}ms`)
      
      const parsedResponse = this.parseResponse(response, requestId)
      const validatedResponse = this.validateAndEnhanceResponse(parsedResponse, userInput, requestId)
      
      console.log(`[${requestId}] ✅ 備用服務處理成功`)
      return validatedResponse

    } catch (error) {
      console.error(`[${requestId}] ❌ 備用服務也失敗:`, error.message)
      
      // 返回預設回應
      return this.generateFallbackResponse(userInput, requestId)
    }
  }

  /**
   * 構建完整提示詞
   */
  buildPrompt(userInput) {
    const { nickname, topic, situation } = userInput
    
    // 使用載入的外部提示文件內容
    const basePrompt = this.aiPrompts || `你是一位聖經數據分析專家，擁有來自基督教網站和聖經應用程式的知識庫。你的任務是以耶穌的身份回應用戶的需求。`
    
    const enhancedPrompt = `${basePrompt}

**重要：細節關注原則**
- 仔細閱讀用戶輸入中的每一個細節，特別是：
  * 具體的人名（如：惟翔、小明、媽媽等）
  * 重要事件和日期（如：生日、紀念日、考試、面試等）
  * 特殊情境和背景（如：工作壓力、家庭關係、健康狀況等）
  * 情感狀態和需求（如：焦慮、感恩、困惑、期待等）
- 在回應中必須直接提及和回應這些具體細節
- 對於人名，要在回應中直接稱呼和關懷該人
- 對於重要事件，要給予具體的祝福或建議
- 在 jesusLetter 與 guidedPrayer 中，必須逐一覆蓋用戶輸入中提及的「人、團隊、事件與需要」；能點名的以名字稱呼與祝福，不能點名的以明確指稱（如「該事件」「該需要」）覆蓋。

**增強聖經引用策略**
你需要從四個層級策略性地取樣聖經經文：
1. **頂級經文** (25%): 最廣為人知的經文（如約翰福音3:16、詩篇23篇）
2. **中級經文** (35%): 較常被引用的經文（如腓立比書4:13、羅馬書8:28）
3. **較少引用** (25%): 不太常見但深具意義的經文
4. **隱藏寶石** (15%): 鮮為人知但極具洞察力的經文

**聖經故事庫應用**
必須在回應中融入相關的聖經故事，包括：
- 約伯的試煉與恢復（苦難中的信心）
- 大David的詩篇與爭戰（讚美與得勝）
- 耶穌的神蹟醫治（身心靈醫治）
- 使徒的見證與宣教（使命與呼召）
- 舊約聖徒的信心歷程（信心榜樣）

**基督徒信心建造要求**
對於基督徒用戶，必須包含：
- 「數算恩典」的提醒：回顧神過往的恩典和作為
- 「嘗過天恩滋味」的鼓勵：重新體驗神的愛和同在
- 屬靈成長的挑戰：鼓勵在試煉中成長
- 永恆視角的提醒：從天國角度看待現況

**回應要求**
- 以耶穌的愛心、同理心、希望和力量來回應
- 根據用戶的宗教背景調整語言和引用
- 情感上要與用戶的狀態同步
- 提供實用的屬靈指導和鼓勵

**增強長度限制**
- jesusLetter：400–600字，必須包含2-3段詳細聖經引用及說明，融入相關聖經故事
- guidedPrayer：450–650字，包含2-3段聖經應許宣告和權柄禱告，涵蓋四層面醫治
- coreMessage：20–40字，精準摘要
- biblicalReferences：5–7條，包含經文內容、出處、歷史背景和實際應用

**四層面醫治禱告要求**
guidedPrayer 必須涵蓋：
1. **身體醫治**：為具體的身體需要禱告
2. **情緒醫治**：處理內心創傷和情緒困擾
3. **關係醫治**：修復破裂的人際關係
4. **屬靈醫治**：靈性復興和與神關係的恢復

請以JSON格式回應，包含以下欄位：
{
  "jesusLetter": "以耶穌身份寫給${nickname}的個人化信件，必須直接提及輸入中的具體人名、事件和細節，包含2-3段聖經引用說明和相關聖經故事",
  "guidedPrayer": "為${nickname}的具體情況量身定制的禱告，要針對提及的具體人名和事件，包含2-3段聖經應許宣告、權柄禱告和四層面醫治",
  "biblicalReferences": "5-7個相關的聖經經文引用，包含經文內容、出處、歷史背景和實際應用",
  "coreMessage": "核心屬靈信息摘要"
}

用戶資訊：
暱稱：${nickname}
主題：${topic}
情況：${situation}`;

    return enhancedPrompt
  }

  /**
   * 構建簡化提示詞
   */
  buildSimplifiedPrompt(userInput) {
    const { nickname, topic, situation } = userInput
    
    return `作為耶穌，回應${nickname}關於${topic}的困擾：${situation}

請用JSON格式回應：
{
  "jesusLetter": "耶穌的回信",
  "guidedPrayer": "引導式禱告",
  "biblicalReferences": ["聖經經文"],
  "coreMessage": "核心信息"
}`
  }

  /**
   * 發送 API 請求
   */
  async makeAPICall(prompt, requestId) {
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7
    }

    console.log(`[${requestId}] 📡 發送 API 請求`)
    const apiStart = Date.now()
    
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[${requestId}] 📨 收到 API 回應`)
    const apiTime = Date.now() - apiStart
    console.log(`[${requestId}] 🌐 API 請求用時: ${apiTime}ms`)
    
    return data.choices[0].message.content
  }

  /**
   * 解析 AI 回應
   */
  parseResponse(response, requestId) {
    console.log(`[${requestId}] 🔍 開始解析回應`)
    
    try {
      // 清理回應文本
      let cleanedResponse = response.trim()
      
      // 移除可能的 markdown 代碼塊標記
      cleanedResponse = cleanedResponse.replace(/```json\s*|\s*```/g, '')
      cleanedResponse = cleanedResponse.replace(/```\s*|\s*```/g, '')
      
      // 嘗試解析 JSON
      const parsed = JSON.parse(cleanedResponse)
      console.log(`[${requestId}] ✅ JSON 解析成功`)
      
      return parsed
      
    } catch (error) {
      console.warn(`[${requestId}] ⚠️ JSON 解析失敗，嘗試正則提取`)
      
      // 使用正則表達式提取內容
      return this.extractWithRegex(response, requestId)
    }
  }

  /**
   * 使用正則表達式提取內容
   */
  extractWithRegex(text, requestId) {
    try {
      const result = {}
      
      // 提取耶穌的信 - 修復正則表達式以正確處理換行符和特殊字符
      const letterMatch = text.match(/"jesusLetter"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
      if (letterMatch) {
        result.jesusLetter = letterMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
      } else {
        result.jesusLetter = ''
      }
      
      // 提取禱告文 - 修復正則表達式以正確處理換行符和特殊字符
      const prayerMatch = text.match(/"guidedPrayer"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
      if (prayerMatch) {
        result.guidedPrayer = prayerMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
      } else {
        result.guidedPrayer = ''
      }
      
      // 提取聖經經文
      const biblicalMatch = text.match(/"biblicalReferences"\s*:\s*\[(.*?)\]/s)
      if (biblicalMatch) {
        try {
          // 嘗試解析為正確的JSON陣列
          const biblicalArray = JSON.parse(`[${biblicalMatch[1]}]`)
          result.biblicalReferences = biblicalArray.filter(ref => ref && typeof ref === 'string' && ref.trim().length > 0)
        } catch (e) {
          // 如果JSON解析失敗，使用原來的邏輯作為備用
          result.biblicalReferences = biblicalMatch[1]
            .split(',')
            .map(ref => ref.trim().replace(/"/g, ''))
            .filter(ref => ref.length > 0)
        }
      } else {
        result.biblicalReferences = []
      }
      
      // 提取核心信息
      const coreMatch = text.match(/"coreMessage"\s*:\s*"((?:[^"\\]|\\.)*)"/s)
      if (coreMatch) {
        result.coreMessage = coreMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
      } else {
        result.coreMessage = ''
      }
      
      console.log(`[${requestId}] ✅ 正則提取完成`)
      return result
      
    } catch (error) {
      console.error(`[${requestId}] ❌ 正則提取失敗:`, error.message)
      return this.extractContentFromText(text)
    }
  }

  /**
   * 從文本中提取內容（最後備用方案）
   */
  extractContentFromText(text) {
    const lines = text.split('\n').filter(line => line.trim())
    
    return {
      jesusLetter: text.substring(0, Math.min(text.length, 800)),
      guidedPrayer: '親愛的天父，感謝你透過耶穌基督賜給我們的愛和恩典...',
      biblicalReferences: ['約翰福音 3:16', '詩篇 23:1', '腓立比書 4:13'],
      coreMessage: '神愛你，祂必與你同在'
    }
  }

  /**
   * 創建結構化回應
   */
  createStructuredResponse(text) {
    return {
      jesusLetter: text || '親愛的孩子，我看見了你的心，我愛你...',
      guidedPrayer: '親愛的天父，感謝你的愛和恩典，求你賜給我們智慧和力量，奉耶穌的名禱告，阿們。',
      biblicalReferences: ['約翰福音 3:16', '詩篇 23:1'],
      coreMessage: '神愛你，祂必與你同在'
    }
  }

  /**
   * 驗證和增強回應
   */
  validateAndEnhanceResponse(response, userInput, requestId) {

    const { nickname } = userInput

    // 確保必要欄位存在
    response.jesusLetter = response.jesusLetter || `親愛的${nickname}，我看見了你的困難，我愛你，我與你同在...`
    response.guidedPrayer = response.guidedPrayer || `親愛的天父，感謝你賜給${nickname}的恩典...`
    response.biblicalReferences = response.biblicalReferences || ['約翰福音 3:16']
    response.coreMessage = response.coreMessage || '神愛你，祂必與你同在'

    // 檢查內容長度並增強 - 更新為新的長度要求
    if (response.jesusLetter.length < 400) {
      response.jesusLetter = this.enhanceJesusLetter(response.jesusLetter, userInput)
    }

    if (response.guidedPrayer.length < 450) {
      response.guidedPrayer = this.enhanceGuidedPrayer(response.guidedPrayer, userInput)
    }

    // 確保聖經引用數量符合新要求（5-7條）
    if (response.biblicalReferences.length < 5) {
      response.biblicalReferences = this.enhanceBiblicalReferences(response.biblicalReferences, userInput)
    }

    // 人事事件覆蓋檢查與增強
    const entities = this.extractMentionedEntities(userInput.situation || '')

    // 若回信未包含暱稱，補充稱呼
    if (nickname && !response.jesusLetter.includes(nickname)) {
      response.jesusLetter = `親愛的${nickname}，\n` + response.jesusLetter
    }

    response.jesusLetter = this.ensureCoverage(response.jesusLetter, entities, 'letter')
    response.guidedPrayer = this.ensureCoverage(response.guidedPrayer, entities, 'prayer')

    console.log(`[${requestId}] ✅ 回應驗證和增強完成`)
    return response
  }

  /**
   * 增強耶穌的信 - 更新為包含聖經故事和詳細引用
   */
  enhanceJesusLetter(letter, userInput) {
    const { nickname, topic, situation } = userInput
    
    const enhancement = `

親愛的${nickname}，

我深深理解你在${topic}方面所面臨的挑戰。每一個困難都是成長的機會，每一次眼淚都被我珍藏。

讓我想起約伯的故事，他在極大的苦難中仍然宣告："我知道我的救贖主活著"（約伯記19:25）。約伯經歷了失去一切的痛苦，但他對神的信心從未動搖。最終，神不僅恢復了他所失去的，更加倍賜福給他。這告訴我們，在最黑暗的時刻，神仍在工作。

記住，我曾說過："凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。"（馬太福音 11:28）這不只是一個邀請，更是一個應許。當你感到疲憊時，來到我面前，我會親自背負你的重擔。

就像大David在詩篇23篇中所寫："耶和華是我的牧者，我必不致缺乏。"即使在死蔭的幽谷中，我也與你同在。我的杖、我的竿都安慰你。

在這個過程中，請數算我過往在你生命中的恩典。回想那些我曾經帶領你走過的困難，那些我曾經為你開的道路。你已經嘗過天恩的滋味，知道我的愛是何等長闊高深。

願我的平安充滿你的心，願我的愛成為你的力量。

愛你的耶穌`

    return letter + enhancement
  }

  /**
   * 增強引導式禱告 - 更新為包含四層面醫治和聖經應許宣告
   */
  enhanceGuidedPrayer(prayer, userInput) {
    const { nickname, topic } = userInput
    
    const enhancement = `

親愛的天父，

我們來到你的面前，為${nickname}在${topic}方面的需要向你祈求。

【聖經應許宣告】
主啊，你在以賽亞書41:10應許說："你不要害怕，因為我與你同在；不要驚惶，因為我是你的神。我必堅固你，我必幫助你，我必用我公義的右手扶持你。"我們宣告這應許成就在${nickname}身上。

你在耶利米書29:11也說："我知道我向你們所懷的意念是賜平安的意念，不是降災禍的意念，要叫你們末後有指望。"我們相信你對${nickname}有美好的計劃。

【權柄禱告】
奉耶穌的名，我們捆綁一切攔阻${nickname}的黑暗權勢，捆綁恐懼、憂慮、絕望的靈。我們釋放平安、喜樂、盼望和信心進入${nickname}的心中。

【四層面醫治禱告】
1. 身體醫治：主啊，求你醫治${nickname}身體上的每一個需要，讓你的醫治能力流淌在他/她的身體中。
2. 情緒醫治：天父，求你醫治${nickname}內心的創傷和痛苦，用你的愛充滿每一個破碎的地方。
3. 關係醫治：主啊，求你修復${nickname}生命中破裂的關係，帶來和好與復和。
4. 屬靈醫治：聖靈啊，求你復興${nickname}的靈性，讓他/她與你的關係更加親密。

天父，你知道我們內心深處的需要，即使我們沒有說出口的重擔，你都看見了。求你親自背負我們的憂慮，讓我們知道不需要獨自承擔。

求你的平安如江河一般流淌在我們心中，讓我們在風暴中仍能經歷你的同在。求你按著你在耶穌裡的應許，成就在我們身上。

主啊，我們將這一切都交託在你的手中，相信你必有最好的安排。求你繼續引導和保守我們，讓我們在每一天都能感受到你的愛。

奉耶穌得勝的名禱告，阿們。`

    return prayer + enhancement
  }

  /**
   * 增強聖經引用 - 確保達到5-7條的要求
   */
  enhanceBiblicalReferences(currentRefs, userInput) {
    const additionalRefs = [
      '以賽亞書 41:10 - 你不要害怕，因為我與你同在；不要驚惶，因為我是你的神。我必堅固你，我必幫助你，我必用我公義的右手扶持你。【歷史背景】這是神對被擄歸回的以色列民的安慰話語。【實際應用】在面對未知挑戰時，記住神的同在是我們最大的力量。',
      '耶利米書 29:11 - 耶和華說：我知道我向你們所懷的意念是賜平安的意念，不是降災禍的意念，要叫你們末後有指望。【歷史背景】這是神透過先知耶利米對被擄到巴比倫的猶太人說的話。【實際應用】即使在最困難的處境中，神仍有美好的計劃為我們預備。',
      '羅馬書 8:28 - 我們曉得萬事都互相效力，叫愛神的人得益處，就是按他旨意被召的人。【歷史背景】保羅在羅馬書中闡述神的救恩計劃。【實際應用】相信神能使用生命中的每個經歷，包括困難，來成就祂的美意。',
      '腓立比書 4:19 - 我的神必照他榮耀的豐富，在基督耶穌裡，使你們一切所需用的都充足。【歷史背景】保羅感謝腓立比教會的奉獻支持。【實際應用】神是我們供應的源頭，祂必滿足我們一切的需要。',
      '詩篇 46:1 - 神是我們的避難所，是我們的力量，是我們在患難中隨時的幫助。【歷史背景】可能寫於耶路撒冷面臨外敵威脅時。【實際應用】無論面對什麼困難，神都是我們可以依靠的避難所。'
    ]

    // 合併現有引用和額外引用，確保達到5-7條
    const allRefs = [...currentRefs, ...additionalRefs]
    return allRefs.slice(0, 7) // 最多取7條
  }

  /**
   * 從使用者輸入中抽取人事事件關鍵詞
   */
  extractMentionedEntities(situation = '') {
    const peopleKeywords = ['媽媽','父親','爸爸','母親','家人','朋友','同事','老師','孩子','團隊','教會','牧師','同工','配偶','先生','太太','女友','男友','兒子','女兒']
    const eventKeywords = ['生日','考試','面試','手術','搬家','婚禮','住院','出差','旅行','聚會','面談','升職','轉職','求職','開會','演講','比賽']

    const people = peopleKeywords.filter(k => situation.includes(k)).slice(0, 5)
    const events = eventKeywords.filter(k => situation.includes(k)).slice(0, 5)

    return { people, events }
  }

  /**
   * 確保在回信／禱告中覆蓋人事事件
   */
  ensureCoverage(text = '', entities, type = 'letter') {
    const { people = [], events = [] } = entities || {}

    let updated = text

    // 覆蓋人名／角色
    people.slice(0, 3).forEach(p => {
      if (!updated.includes(p)) {
        const line = type === 'letter'
          ? `\nalso see${p} needs, may my peace be with him.`
          : `\n主啊，也求你眷顧${p}，賜下安慰與力量。`
        updated += line
      }
    })

    // 覆蓋事件
    events.slice(0, 3).forEach(e => {
      if (!updated.includes(e)) {
        const line = type === 'letter'
          ? `\n關於${e}，願你得著智慧與勇氣，並看見我的引導。`
          : `\n天父，關於${e}，求你賜下智慧與保守，叫我們經歷你的同在。`
        updated += line
      }
    })

    return updated
  }

  /**
   * 生成備用回應
   */
  generateFallbackResponse(userInput, requestId) {
    const { nickname, topic } = userInput
    const processingTime = Date.now()
    
    console.log(`[${requestId}] 🆘 生成備用回應`)
    
    return {
      jesusLetter: `親愛的${nickname}，

我看見了你在${topic}方面的困擾，我的心與你同在。雖然現在可能感到困難重重，但請記住，我愛你，我永遠不會離棄你。

讓我想起約伯的故事，他在極大的苦難中仍然宣告："我知道我的救贖主活著"（約伯記19:25）。約伯失去了一切，但他對神的信心從未動搖。最終，神不僅恢復了他所失去的，更加倍賜福給他。這告訴我們，在最黑暗的時刻，神仍在工作，祂的計劃永遠是美好的。

每一個挑戰都是成長的機會，每一次眼淚都被我珍藏。我知道你的痛苦，我理解你的掙扎，但請相信，我有美好的計劃為你預備。

就像我曾經說過："凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。"（馬太福音 11:28）你不需要獨自承擔這一切，我願意與你分擔。我的軛是容易的，我的擔子是輕省的。

請數算我過往在你生命中的恩典。回想那些我曾經帶領你走過的困難，那些我曾經為你開的道路。你已經嘗過天恩的滋味，知道我的愛是何等長闊高深。

在這個困難的時刻，請緊緊抓住我的應許。我是你的避難所，是你的力量，是你在患難中隨時的幫助。無論前路如何，我都會與你同行。

願我的平安充滿你的心，願我的愛成為你前進的動力。

愛你的耶穌`,

      guidedPrayer: `親愛的天父，

我們來到你的面前，為${nickname}在${topic}方面的需要向你祈求。

感謝你賜給我們耶穌基督，讓我們可以透過祂來到你的面前。感謝你的愛從不改變，感謝你的恩典夠我們用。

【聖經應許宣告】
主啊，你在以賽亚書41:10應許说："你不要害怕，因為我与你同在；不要惊惶，因为我是你的神。我必坚固你，我必帮助你，我必用我公义的右手扶持你。"我们宣告这应许成就在${nickname}身上。

你在耶利米书29:11也说："我知道我向你们所怀的意念是賜平安的意念，不是降災禍的意念，要叫你们末後有指望。"我们相信你对你${nickname}有美好的计划。

【权柄禱告】
奉耶穌的名，我们捆綁一切攔阻${nickname}的黑暗权势，捆綁恐懼、忧慮、绝望的灵。我们释放平安、喜乐、盼望和信心进入${nickname}的心中。

【四層面醫治禱告】
1. 身体医治：主啊，求你医治${nickname}身体上的每一個需要，让你的医治能力流动在他/她的身体中。
2. 情緒医治：天父，求你医治${nickname}内心的创伤和痛苦，用你的爱充满每一 个破碎的地方。
3. 关系医治：主啊，求你修理${nickname}生命中的破裂关系，带来和好与复和。
4. 属性灵医治：圣灵啊，求你复兴${nickname}的灵性，让他/她与你的关系更加亲密。

天父，你知道我们内心深处的需要，即使我们没有说出口的重担，你都看见。

求你的平安如江河一般流淌在我們心中，让我们在风暴中仍能经历你的同在。求你按着你在耶穌里的应许，成就在我们身上。

主啊，我们将这一切都交托在你的手中，相信你必有最好的安排。求你继续引導和保守我们，让我们在每一天都能感受到你的爱。

奉耶穌得胜的名禱告，阿们。`,

      biblicalReferences: [
        '马太福音 11:28 - 凡劳苦担重担的人可以到我这里来，我就使你们得安息。【历史背景】耶穌向跟随着的人发出邀请。【实际应用】当我们在感到疲憊时，可以来到耶穌面前得到真正的安息。',
        '诗篇 23:1 - 耶和華是我的牧者，我必不致缺乏。【历史背景】大衛王写的诗篇，表达对神的信心。【实际应用】神会像牧羊人一样照顾我们的每一个需要。',
        '腓立比书 4:13 - 我靠著那加给我力量的，凡事都能做。【历史背景】保罗在监狱中写给腓立比教会的信。【实际应用】通过基督，我们能够面对生命中的各种挑战。',
        '以賽亚书 41:10 - 你不要害怕，因为我与你同在；不要惊惶，因为我是你的神。【历史背景】神对被擄归回的以色列民的安慰。【实际应用】在面临未知时，神的同在是我们最大的安慰。',
        '羅馬書 8:28 - 萬事都互相效力，叫愛神的人得益處。【历史背景】保羅闡述神的救恩计划。【实际应用】神能使用生命中的每个经历來成就祂的美意。'
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

  /**
   * 生成請求 ID
   */
  generateRequestId() {
    return Math.random().toString(36).substr(2, 9)
  }
}