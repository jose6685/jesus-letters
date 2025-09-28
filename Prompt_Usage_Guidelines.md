# JesusLetter AI 提示詞使用指南

## 目錄
1. [概述](#概述)
2. [提示詞體系架構](#提示詞體系架構)
3. [實施流程指南](#實施流程指南)
4. [質量控制標準](#質量控制標準)
5. [個人化調整策略](#個人化調整策略)
6. [性能優化建議](#性能優化建議)
7. [錯誤處理機制](#錯誤處理機制)
8. [監控與評估](#監控與評估)
9. [版本管理](#版本管理)
10. [最佳實踐](#最佳實踐)

---

## 概述

### 提示詞系統目標
JesusLetter AI 提示詞系統旨在為用戶提供：
- **個人化的屬靈陪伴**: 根據用戶的具體情況提供客製化的回應
- **深度的情感支持**: 不僅回應表面問題，更觸及深層需要
- **聖經基礎的智慧**: 所有回應都基於聖經真理和基督教價值觀
- **專業的代禱服務**: 提供有深度、有權柄的代禱內容
- **持續的關懷體驗**: 建立長期的屬靈陪伴關係

### 系統組成
1. **AI_Prompts_Detailed.md**: 主要AI回應提示詞
2. **Prayer_Prompts_Detailed.md**: 禱告內容生成提示詞
3. **Prompt_Usage_Guidelines.md**: 使用指南（本文檔）

---

## 提示詞體系架構

### 三層架構設計

#### 第一層：核心身份設定
```
## 核心身份層級
1. **主要身份**: 耶穌基督的代言人
2. **輔助身份**: 屬靈長輩、代禱者
3. **服務角色**: AI屬靈陪伴助手

## 身份切換邏輯
- **耶穌信件**: 使用耶穌基督身份
- **代禱服務**: 使用屬靈長輩身份
- **一般對話**: 使用AI助手身份
```

#### 第二層：情境適應系統
```
## 情境識別與適應
1. **宗教背景適應**:
   - 基督徒: 使用完整聖經語言
   - 非基督徒: 使用普世價值觀語言
   - 其他宗教: 尊重並融合相關元素

2. **情感狀態適應**:
   - 危機狀態: 立即安慰和支持
   - 困惑狀態: 提供清晰指導
   - 感恩狀態: 共同讚美和慶祝

3. **主題領域適應**:
   - 工作: 職場智慧和平衡
   - 感情: 關係建立和修復
   - 健康: 身心靈整體關懷
   - 財富: 管家職分和知足
   - 家庭: 和睦關係和責任
   - 信仰: 靈性成長和服事
```

#### 第三層：輸出格式控制
```
## 標準輸出格式
{
  "jesusLetter": "來自耶穌的信件內容",
  "guidedPrayer": "引導式禱告內容", 
  "biblicalReferences": [
    {
      "verse": "聖經經文",
      "reference": "經文出處",
      "application": "應用說明"
    }
  ],
  "coreMessage": "核心信息摘要",
  "metadata": {
    "topic": "主題分類",
    "emotionalTone": "情感基調",
    "urgencyLevel": "緊急程度",
    "followUpSuggestions": ["後續建議"]
  }
}
```

---

## 實施流程指南

### 標準處理流程

#### 步驟1：輸入分析 (Input Analysis)
```javascript
// 用戶輸入分析檢查清單
const inputAnalysis = {
  // 基本信息提取
  userInfo: {
    nickname: "用戶暱稱",
    religion: "宗教背景", 
    gender: "性別",
    birthday: "生日信息"
  },
  
  // 問題分析
  problemAnalysis: {
    mainTopic: "主要主題",
    emotionalState: "情感狀態",
    urgencyLevel: "緊急程度",
    specificConcerns: ["具體困擾"]
  },
  
  // 隱藏需要推測
  hiddenNeeds: {
    inferredConcerns: ["推測的隱藏困擾"],
    culturalFactors: ["文化背景因素"],
    psychologicalNeeds: ["心理層面需要"]
  }
}
```

#### 步驟2：提示詞選擇 (Prompt Selection)
```javascript
// 提示詞選擇邏輯
function selectPrompts(inputAnalysis) {
  // 1. 選擇主要身份提示詞
  const identityPrompt = selectIdentityPrompt(inputAnalysis.problemAnalysis.mainTopic);
  
  // 2. 選擇主題特定提示詞
  const topicPrompt = selectTopicPrompt(inputAnalysis.problemAnalysis.mainTopic);
  
  // 3. 選擇情感適應提示詞
  const emotionalPrompt = selectEmotionalPrompt(inputAnalysis.problemAnalysis.emotionalState);
  
  // 4. 選擇文化適應提示詞
  const culturalPrompt = selectCulturalPrompt(inputAnalysis.userInfo.religion);
  
  // 5. 組合最終提示詞
  return combinePrompts([identityPrompt, topicPrompt, emotionalPrompt, culturalPrompt]);
}
```

#### 步驟3：內容生成 (Content Generation)
```javascript
// 內容生成流程
async function generateContent(finalPrompt, userInput) {
  try {
    // 1. 調用AI服務生成初始回應
    const rawResponse = await aiService.generate(finalPrompt + userInput);
    
    // 2. 解析和驗證回應格式
    const parsedResponse = parseAndValidateResponse(rawResponse);
    
    // 3. 內容增強和優化
    const enhancedResponse = await enhanceContent(parsedResponse);
    
    // 4. 質量檢查
    const qualityCheck = performQualityCheck(enhancedResponse);
    
    if (qualityCheck.passed) {
      return enhancedResponse;
    } else {
      // 5. 如果質量不達標，進行修正或使用備用方案
      return await handleQualityIssues(enhancedResponse, qualityCheck.issues);
    }
  } catch (error) {
    // 6. 錯誤處理，返回備用回應
    return generateFallbackResponse(userInput);
  }
}
```

#### 步驟4：後處理優化 (Post-processing)
```javascript
// 後處理優化流程
function postProcessResponse(response, userInput) {
  // 1. 個人化調整
  response = personalizeContent(response, userInput.userInfo);
  
  // 2. 長度優化
  response = optimizeLength(response);
  
  // 3. 語言風格統一
  response = unifyLanguageStyle(response);
  
  // 4. 聖經引用驗證
  response = validateBiblicalReferences(response);
  
  // 5. 最終格式化
  response = finalFormatting(response);
  
  return response;
}
```

### 特殊情況處理流程

#### 危機干預流程
```javascript
// 危機情況識別和處理
function handleCrisisIntervention(inputAnalysis) {
  const crisisIndicators = [
    "自殺傾向", "嚴重憂鬱", "家暴情況", 
    "藥物濫用", "極度絕望", "傷害他人意圖"
  ];
  
  if (detectCrisisIndicators(inputAnalysis, crisisIndicators)) {
    return {
      priority: "URGENT",
      responseType: "CRISIS_INTERVENTION",
      additionalActions: [
        "提供專業求助資源",
        "表達立即關懷",
        "避免說教或簡單建議",
        "鼓勵尋求專業幫助"
      ]
    };
  }
}
```

#### 節慶季節調整流程
```javascript
// 節慶季節特殊處理
function handleSeasonalAdjustments() {
  const currentDate = new Date();
  const seasonalPrompts = {
    christmas: "聖誕節特殊提示詞",
    easter: "復活節特殊提示詞", 
    newYear: "新年特殊提示詞",
    thanksgiving: "感恩節特殊提示詞"
  };
  
  const currentSeason = detectCurrentSeason(currentDate);
  if (currentSeason && seasonalPrompts[currentSeason]) {
    return seasonalPrompts[currentSeason];
  }
  
  return null;
}
```

---

## 質量控制標準

### 內容質量檢查清單

#### 耶穌信件質量標準
```yaml
jesusLetter_quality_check:
  length:
    minimum: 400字
    optimal: 500-700字
    maximum: 800字
  
  structure:
    opening: "親切的稱呼和理解"
    body: "具體回應和指導"
    biblical_wisdom: "聖經智慧的應用"
    encouragement: "鼓勵和安慰"
    closing: "愛的表達和祝福"
  
  tone:
    - 充滿愛和理解
    - 溫柔而有權威
    - 個人化和親密
    - 充滿盼望和信心
  
  content:
    - 直接回應用戶困擾
    - 提供實際可行的建議
    - 包含相關聖經智慧
    - 表達無條件的愛和接納
```

#### 代禱內容質量標準
```yaml
guidedPrayer_quality_check:
  length:
    minimum: 500字
    optimal: 600-800字
    maximum: 1000字
  
  structure:
    opening: "邀請參與和稱頌神"
    specific_prayer: "為具體需要代禱"
    hidden_needs: "為隱藏需要代禱"
    faith_declaration: "信心宣告"
    closing: "交託和阿們"
  
  tone:
    - 如慈愛長輩的關懷
    - 充滿信心和權柄
    - 謙卑而敬虔
    - 具體而實際
  
  content:
    - 包含所有必要結構元素
    - 針對用戶具體需要
    - 推測並代禱隱藏需要
    - 基於聖經應許和真理
```

#### 聖經引用質量標準
```yaml
biblical_references_quality_check:
  quantity:
    minimum: 2個引用
    optimal: 3-4個引用
    maximum: 5個引用
  
  relevance:
    - 與用戶困擾直接相關
    - 提供實際指導和安慰
    - 適合用戶的宗教背景
  
  accuracy:
    - 經文引用準確
    - 出處標註正確
    - 應用解釋恰當
  
  diversity:
    - 來自不同聖經書卷
    - 涵蓋不同主題角度
    - 平衡律法和恩典
```

### 自動化質量檢查

#### 長度檢查函數
```javascript
function checkContentLength(response) {
  const checks = {
    jesusLetter: {
      min: 400,
      max: 800,
      optimal: [500, 700]
    },
    guidedPrayer: {
      min: 500, 
      max: 1000,
      optimal: [600, 800]
    }
  };
  
  const results = {};
  
  for (const [key, content] of Object.entries(response)) {
    if (checks[key]) {
      const length = content.length;
      const check = checks[key];
      
      results[key] = {
        length: length,
        status: length >= check.min && length <= check.max ? 'PASS' : 'FAIL',
        optimal: length >= check.optimal[0] && length <= check.optimal[1],
        recommendation: length < check.min ? 'EXPAND' : 
                      length > check.max ? 'SHORTEN' : 'OK'
      };
    }
  }
  
  return results;
}
```

#### 結構完整性檢查
```javascript
function checkStructuralIntegrity(response) {
  const requiredElements = {
    jesusLetter: [
      'personal_address',    // 個人稱呼
      'understanding',       // 理解表達
      'guidance',           // 具體指導
      'biblical_wisdom',    // 聖經智慧
      'encouragement',      // 鼓勵安慰
      'love_expression'     // 愛的表達
    ],
    guidedPrayer: [
      'opening_invitation', // 開場邀請
      'praise_thanksgiving', // 讚美感謝
      'specific_intercession', // 具體代求
      'hidden_needs_prayer', // 隱藏需要代禱
      'faith_declaration',   // 信心宣告
      'closing_commitment'   // 交託結尾
    ]
  };
  
  const results = {};
  
  for (const [contentType, elements] of Object.entries(requiredElements)) {
    if (response[contentType]) {
      results[contentType] = checkElementsPresence(response[contentType], elements);
    }
  }
  
  return results;
}
```

---

## 個人化調整策略

### 用戶背景適應

#### 宗教背景適應策略
```javascript
const religionAdaptationStrategies = {
  "基督徒": {
    language: "完整聖經語言",
    references: "直接引用聖經",
    assumptions: "假設熟悉基督教概念",
    tone: "屬靈家人的親密感"
  },
  
  "天主教徒": {
    language: "包含天主教傳統元素",
    references: "聖經 + 教會傳統",
    assumptions: "尊重聖母和聖人",
    tone: "普世教會的合一感"
  },
  
  "其他基督教派": {
    language: "基礎聖經語言",
    references: "核心聖經真理",
    assumptions: "基本基督教信仰",
    tone: "基督徒弟兄姊妹的關愛"
  },
  
  "非基督徒": {
    language: "普世價值觀語言",
    references: "智慧文學和普世真理",
    assumptions: "開放但不強迫",
    tone: "朋友般的關懷和尊重"
  },
  
  "其他宗教": {
    language: "尊重並融合相關元素",
    references: "共同價值觀",
    assumptions: "尊重其信仰背景",
    tone: "跨宗教的愛和理解"
  }
};
```

#### 年齡階段適應策略
```javascript
const ageAdaptationStrategies = {
  "青少年": {
    language: "現代化、活潑的表達",
    concerns: ["學業壓力", "同儕關係", "身份認同", "未來方向"],
    approach: "理解和引導並重",
    examples: "使用年輕人熟悉的比喻"
  },
  
  "青年": {
    language: "積極向上、充滿希望",
    concerns: ["職涯發展", "戀愛婚姻", "經濟獨立", "人生方向"],
    approach: "實用建議和屬靈指導",
    examples: "職場和關係的實際案例"
  },
  
  "中年": {
    language: "成熟穩重、深度關懷",
    concerns: ["家庭責任", "職業發展", "健康問題", "父母照顧"],
    approach: "平衡各種責任的智慧",
    examples: "家庭和工作平衡的見證"
  },
  
  "長者": {
    language: "尊敬溫暖、充滿智慧",
    concerns: ["健康衰退", "孤獨感", "人生意義", "後代關懷"],
    approach: "肯定價值和永恆盼望",
    examples: "人生智慧和屬靈傳承"
  }
};
```

#### 性別差異適應策略
```javascript
const genderAdaptationStrategies = {
  "男性": {
    communication: "直接、解決方案導向",
    emotional_expression: "理解男性表達情感的方式",
    concerns: ["事業成就", "家庭責任", "男性角色期待"],
    approach: "提供具體行動建議"
  },
  
  "女性": {
    communication: "關係導向、情感支持",
    emotional_expression: "鼓勵情感表達和分享",
    concerns: ["關係和諧", "情感需要", "多重角色平衡"],
    approach: "提供情感支持和實用智慧"
  }
};
```

### 動態個人化調整

#### 情感狀態動態適應
```javascript
function adaptToEmotionalState(emotionalState, baseResponse) {
  const adaptations = {
    "極度絕望": {
      priority: "立即安慰和盼望",
      adjustments: [
        "增強愛的表達",
        "提供立即的盼望",
        "減少說教內容",
        "增加陪伴感"
      ]
    },
    
    "焦慮不安": {
      priority: "平安和信心",
      adjustments: [
        "強調神的掌權",
        "提供具體的平安應許",
        "建議實際的舒緩方法",
        "增加信心宣告"
      ]
    },
    
    "憤怒不滿": {
      priority: "理解和引導",
      adjustments: [
        "先理解和認同情感",
        "提供健康的表達方式",
        "引導向饒恕和釋放",
        "避免立即的道德判斷"
      ]
    },
    
    "感恩喜樂": {
      priority: "共同慶祝和成長",
      adjustments: [
        "一起讚美和感謝",
        "鼓勵分享見證",
        "提醒持續依靠神",
        "建議如何祝福他人"
      ]
    }
  };
  
  if (adaptations[emotionalState]) {
    return applyEmotionalAdaptations(baseResponse, adaptations[emotionalState]);
  }
  
  return baseResponse;
}
```

---

## 性能優化建議

### 提示詞效率優化

#### 提示詞長度優化
```javascript
// 提示詞長度管理策略
const promptLengthOptimization = {
  // 核心提示詞：保持簡潔但完整
  core: {
    maxLength: 2000,
    essentialElements: [
      "身份設定",
      "基本指導原則", 
      "輸出格式要求"
    ]
  },
  
  // 情境提示詞：根據需要動態添加
  contextual: {
    maxLength: 1000,
    conditionalElements: [
      "宗教背景適應",
      "情感狀態適應",
      "主題特定指導"
    ]
  },
  
  // 範例提示詞：提供具體示範
  examples: {
    maxLength: 1500,
    selectionCriteria: [
      "與當前情況最相關",
      "展示期望的輸出質量",
      "涵蓋關鍵技巧"
    ]
  }
};
```

#### 快取策略
```javascript
// 提示詞快取管理
class PromptCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
    this.ttl = 3600000; // 1小時
  }
  
  generateCacheKey(userProfile, topic, emotionalState) {
    return `${userProfile.religion}_${topic}_${emotionalState}`;
  }
  
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.prompt;
    }
    return null;
  }
  
  set(key, prompt) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      prompt: prompt,
      timestamp: Date.now()
    });
  }
}
```

### AI服務調用優化

#### 智能重試機制
```javascript
class SmartRetryManager {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000;
    this.backoffMultiplier = 2;
  }
  
  async executeWithRetry(operation, context) {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // 檢查結果質量
        if (this.isQualityAcceptable(result, context)) {
          return result;
        } else {
          // 質量不佳，調整提示詞後重試
          context.prompt = this.adjustPromptForQuality(context.prompt, result);
        }
        
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries - 1) {
          const delay = this.baseDelay * Math.pow(this.backoffMultiplier, attempt);
          await this.sleep(delay);
          
          // 根據錯誤類型調整策略
          context = this.adjustContextForError(context, error);
        }
      }
    }
    
    // 所有重試都失敗，返回備用回應
    return this.generateFallbackResponse(context);
  }
  
  isQualityAcceptable(result, context) {
    // 實施質量檢查邏輯
    const qualityScore = this.calculateQualityScore(result);
    return qualityScore >= context.minQualityThreshold;
  }
}
```

#### 負載平衡策略
```javascript
class AIServiceLoadBalancer {
  constructor() {
    this.services = [
      { name: 'gemini', weight: 70, available: true },
      { name: 'openai', weight: 30, available: true }
    ];
    this.healthCheckInterval = 60000; // 1分鐘
    this.startHealthCheck();
  }
  
  selectService() {
    const availableServices = this.services.filter(s => s.available);
    
    if (availableServices.length === 0) {
      throw new Error('No AI services available');
    }
    
    // 基於權重的隨機選擇
    const totalWeight = availableServices.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const service of availableServices) {
      random -= service.weight;
      if (random <= 0) {
        return service;
      }
    }
    
    return availableServices[0];
  }
  
  async healthCheck() {
    for (const service of this.services) {
      try {
        await this.pingService(service);
        service.available = true;
      } catch (error) {
        service.available = false;
        console.warn(`Service ${service.name} is unavailable:`, error.message);
      }
    }
  }
}
```

---

## 錯誤處理機制

### 錯誤分類與處理策略

#### AI服務錯誤處理
```javascript
class AIServiceErrorHandler {
  constructor() {
    this.errorStrategies = {
      'RATE_LIMIT': {
        action: 'RETRY_WITH_DELAY',
        delay: 60000,
        fallback: 'USE_ALTERNATIVE_SERVICE'
      },
      
      'INVALID_RESPONSE': {
        action: 'REGENERATE_WITH_ADJUSTED_PROMPT',
        maxAttempts: 2,
        fallback: 'USE_TEMPLATE_RESPONSE'
      },
      
      'SERVICE_UNAVAILABLE': {
        action: 'SWITCH_SERVICE',
        fallback: 'USE_CACHED_RESPONSE'
      },
      
      'CONTENT_POLICY_VIOLATION': {
        action: 'ADJUST_PROMPT_AND_RETRY',
        fallback: 'USE_SAFE_TEMPLATE'
      },
      
      'TIMEOUT': {
        action: 'RETRY_WITH_SHORTER_PROMPT',
        fallback: 'USE_QUICK_RESPONSE'
      }
    };
  }
  
  async handleError(error, context) {
    const errorType = this.classifyError(error);
    const strategy = this.errorStrategies[errorType];
    
    if (!strategy) {
      return this.generateGenericFallback(context);
    }
    
    try {
      return await this.executeStrategy(strategy, context);
    } catch (strategyError) {
      return await this.executeFallback(strategy.fallback, context);
    }
  }
  
  classifyError(error) {
    if (error.message.includes('rate limit')) return 'RATE_LIMIT';
    if (error.message.includes('invalid response')) return 'INVALID_RESPONSE';
    if (error.message.includes('service unavailable')) return 'SERVICE_UNAVAILABLE';
    if (error.message.includes('content policy')) return 'CONTENT_POLICY_VIOLATION';
    if (error.message.includes('timeout')) return 'TIMEOUT';
    
    return 'UNKNOWN';
  }
}
```

#### 內容質量錯誤處理
```javascript
class ContentQualityErrorHandler {
  constructor() {
    this.qualityIssues = {
      'TOO_SHORT': {
        action: 'EXPAND_CONTENT',
        method: 'ADD_BIBLICAL_REFERENCES_AND_EXAMPLES'
      },
      
      'TOO_LONG': {
        action: 'CONDENSE_CONTENT',
        method: 'REMOVE_REDUNDANT_SECTIONS'
      },
      
      'MISSING_STRUCTURE': {
        action: 'RESTRUCTURE_CONTENT',
        method: 'APPLY_STANDARD_TEMPLATE'
      },
      
      'INAPPROPRIATE_TONE': {
        action: 'ADJUST_TONE',
        method: 'REWRITE_WITH_CORRECT_VOICE'
      },
      
      'IRRELEVANT_CONTENT': {
        action: 'REFOCUS_CONTENT',
        method: 'REGENERATE_WITH_SPECIFIC_PROMPT'
      }
    };
  }
  
  async fixQualityIssues(content, issues) {
    let fixedContent = { ...content };
    
    for (const issue of issues) {
      const handler = this.qualityIssues[issue.type];
      if (handler) {
        fixedContent = await this.applyFix(fixedContent, handler, issue);
      }
    }
    
    return fixedContent;
  }
  
  async applyFix(content, handler, issue) {
    switch (handler.action) {
      case 'EXPAND_CONTENT':
        return await this.expandContent(content, issue);
      
      case 'CONDENSE_CONTENT':
        return this.condenseContent(content, issue);
      
      case 'RESTRUCTURE_CONTENT':
        return this.restructureContent(content, issue);
      
      case 'ADJUST_TONE':
        return await this.adjustTone(content, issue);
      
      case 'REFOCUS_CONTENT':
        return await this.refocusContent(content, issue);
      
      default:
        return content;
    }
  }
}
```

### 備用回應系統

#### 分層備用策略
```javascript
class FallbackResponseSystem {
  constructor() {
    this.fallbackLevels = [
      'CACHED_SIMILAR_RESPONSE',    // 快取的相似回應
      'TEMPLATE_BASED_RESPONSE',    // 基於模板的回應
      'MINIMAL_SAFE_RESPONSE',      // 最小安全回應
      'SYSTEM_ERROR_RESPONSE'       // 系統錯誤回應
    ];
  }
  
  async generateFallback(context, level = 0) {
    if (level >= this.fallbackLevels.length) {
      return this.getSystemErrorResponse();
    }
    
    const fallbackType = this.fallbackLevels[level];
    
    try {
      switch (fallbackType) {
        case 'CACHED_SIMILAR_RESPONSE':
          return await this.getCachedSimilarResponse(context);
        
        case 'TEMPLATE_BASED_RESPONSE':
          return this.generateTemplateResponse(context);
        
        case 'MINIMAL_SAFE_RESPONSE':
          return this.generateMinimalResponse(context);
        
        case 'SYSTEM_ERROR_RESPONSE':
          return this.getSystemErrorResponse();
      }
    } catch (error) {
      // 當前層級失敗，嘗試下一層級
      return await this.generateFallback(context, level + 1);
    }
  }
  
  generateTemplateResponse(context) {
    const templates = {
      work: this.getWorkTemplate(),
      love: this.getLoveTemplate(),
      health: this.getHealthTemplate(),
      wealth: this.getWealthTemplate(),
      family: this.getFamilyTemplate(),
      faith: this.getFaithTemplate()
    };
    
    const template = templates[context.topic] || templates.faith;
    return this.personalizeTemplate(template, context);
  }
}
```

---

## 監控與評估

### 性能監控指標

#### 系統性能指標
```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      responseTime: [],
      successRate: 0,
      errorRate: 0,
      qualityScore: [],
      userSatisfaction: [],
      serviceUptime: {}
    };
    
    this.thresholds = {
      maxResponseTime: 10000,    // 10秒
      minSuccessRate: 0.95,      // 95%
      maxErrorRate: 0.05,        // 5%
      minQualityScore: 0.8,      // 80分
      minUserSatisfaction: 0.85   // 85%
    };
  }
  
  recordMetric(type, value) {
    switch (type) {
      case 'responseTime':
        this.metrics.responseTime.push({
          value: value,
          timestamp: Date.now()
        });
        break;
      
      case 'qualityScore':
        this.metrics.qualityScore.push({
          value: value,
          timestamp: Date.now()
        });
        break;
      
      case 'userSatisfaction':
        this.metrics.userSatisfaction.push({
          value: value,
          timestamp: Date.now()
        });
        break;
    }
    
    this.checkThresholds();
  }
  
  checkThresholds() {
    const currentMetrics = this.getCurrentMetrics();
    
    for (const [metric, threshold] of Object.entries(this.thresholds)) {
      if (this.isThresholdViolated(currentMetrics[metric], threshold, metric)) {
        this.triggerAlert(metric, currentMetrics[metric], threshold);
      }
    }
  }
  
  generateReport() {
    return {
      period: this.getReportPeriod(),
      metrics: this.getCurrentMetrics(),
      trends: this.calculateTrends(),
      recommendations: this.generateRecommendations()
    };
  }
}
```

#### 內容質量監控
```javascript
class ContentQualityMonitor {
  constructor() {
    this.qualityDimensions = {
      relevance: { weight: 0.3, threshold: 0.8 },
      completeness: { weight: 0.25, threshold: 0.85 },
      appropriateness: { weight: 0.2, threshold: 0.9 },
      helpfulness: { weight: 0.15, threshold: 0.8 },
      biblicalAccuracy: { weight: 0.1, threshold: 0.95 }
    };
  }
  
  evaluateContent(content, userContext) {
    const scores = {};
    
    for (const [dimension, config] of Object.entries(this.qualityDimensions)) {
      scores[dimension] = this.evaluateDimension(content, userContext, dimension);
    }
    
    const overallScore = this.calculateOverallScore(scores);
    
    return {
      overallScore: overallScore,
      dimensionScores: scores,
      passed: overallScore >= 0.8,
      recommendations: this.generateQualityRecommendations(scores)
    };
  }
  
  evaluateDimension(content, userContext, dimension) {
    switch (dimension) {
      case 'relevance':
        return this.evaluateRelevance(content, userContext);
      
      case 'completeness':
        return this.evaluateCompleteness(content);
      
      case 'appropriateness':
        return this.evaluateAppropriateness(content, userContext);
      
      case 'helpfulness':
        return this.evaluateHelpfulness(content, userContext);
      
      case 'biblicalAccuracy':
        return this.evaluateBiblicalAccuracy(content);
      
      default:
        return 0.5;
    }
  }
}
```

### 用戶反饋收集

#### 反饋收集機制
```javascript
class FeedbackCollector {
  constructor() {
    this.feedbackTypes = [
      'RATING',           // 評分反饋
      'HELPFUL_FLAG',     // 有用標記
      'IMPROVEMENT',      // 改進建議
      'BUG_REPORT',      // 錯誤報告
      'FEATURE_REQUEST'   // 功能請求
    ];
  }
  
  collectFeedback(userId, responseId, feedbackData) {
    const feedback = {
      id: this.generateFeedbackId(),
      userId: userId,
      responseId: responseId,
      type: feedbackData.type,
      content: feedbackData.content,
      rating: feedbackData.rating,
      timestamp: Date.now(),
      processed: false
    };
    
    this.storeFeedback(feedback);
    this.triggerFeedbackAnalysis(feedback);
    
    return feedback.id;
  }
  
  analyzeFeedback() {
    const recentFeedback = this.getRecentFeedback();
    
    const analysis = {
      averageRating: this.calculateAverageRating(recentFeedback),
      commonIssues: this.identifyCommonIssues(recentFeedback),
      improvementAreas: this.identifyImprovementAreas(recentFeedback),
      positivePatterns: this.identifyPositivePatterns(recentFeedback)
    };
    
    return analysis;
  }
}
```

---

## 版本管理

### 提示詞版本控制

#### 版本管理策略
```javascript
class PromptVersionManager {
  constructor() {
    this.versions = new Map();
    this.currentVersion = '1.0.0';
    this.versionHistory = [];
  }
  
  createVersion(versionNumber, prompts, changelog) {
    const version = {
      number: versionNumber,
      prompts: prompts,
      changelog: changelog,
      createdAt: Date.now(),
      performance: null,
      status: 'DRAFT'
    };
    
    this.versions.set(versionNumber, version);
    this.versionHistory.push(versionNumber);
    
    return version;
  }
  
  deployVersion(versionNumber) {
    const version = this.versions.get(versionNumber);
    
    if (!version) {
      throw new Error(`Version ${versionNumber} not found`);
    }
    
    // 執行部署前檢查
    const deploymentCheck = this.performDeploymentCheck(version);
    
    if (!deploymentCheck.passed) {
      throw new Error(`Deployment check failed: ${deploymentCheck.issues.join(', ')}`);
    }
    
    // 備份當前版本
    this.backupCurrentVersion();
    
    // 部署新版本
    this.currentVersion = versionNumber;
    version.status = 'ACTIVE';
    version.deployedAt = Date.now();
    
    // 開始性能監控
    this.startPerformanceMonitoring(versionNumber);
    
    return true;
  }
  
  rollbackVersion(targetVersion) {
    const version = this.versions.get(targetVersion);
    
    if (!version || version.status !== 'ACTIVE') {
      throw new Error(`Cannot rollback to version ${targetVersion}`);
    }
    
    // 執行回滾
    this.currentVersion = targetVersion;
    
    // 記錄回滾事件
    this.recordRollbackEvent(targetVersion);
    
    return true;
  }
}
```

#### A/B測試框架
```javascript
class ABTestingFramework {
  constructor() {
    this.activeTests = new Map();
    this.testResults = new Map();
  }
  
  createABTest(testName, versionA, versionB, trafficSplit = 0.5) {
    const test = {
      name: testName,
      versionA: versionA,
      versionB: versionB,
      trafficSplit: trafficSplit,
      startTime: Date.now(),
      endTime: null,
      status: 'ACTIVE',
      metrics: {
        versionA: { users: 0, responses: 0, ratings: [], quality: [] },
        versionB: { users: 0, responses: 0, ratings: [], quality: [] }
      }
    };
    
    this.activeTests.set(testName, test);
    return test;
  }
  
  assignUserToVersion(testName, userId) {
    const test = this.activeTests.get(testName);
    
    if (!test || test.status !== 'ACTIVE') {
      return test.versionA; // 默認版本
    }
    
    // 基於用戶ID的一致性分配
    const hash = this.hashUserId(userId);
    const assignment = hash < test.trafficSplit ? 'versionA' : 'versionB';
    
    return test[assignment];
  }
  
  recordTestMetric(testName, version, metricType, value) {
    const test = this.activeTests.get(testName);
    
    if (!test) return;
    
    const versionMetrics = test.metrics[version];
    
    switch (metricType) {
      case 'response':
        versionMetrics.responses++;
        break;
      
      case 'rating':
        versionMetrics.ratings.push(value);
        break;
      
      case 'quality':
        versionMetrics.quality.push(value);
        break;
    }
  }
  
  analyzeTestResults(testName) {
    const test = this.activeTests.get(testName);
    
    if (!test) return null;
    
    const analysis = {
      testName: testName,
      duration: Date.now() - test.startTime,
      versionA: this.calculateVersionMetrics(test.metrics.versionA),
      versionB: this.calculateVersionMetrics(test.metrics.versionB),
      winner: null,
      confidence: 0,
      recommendation: ''
    };
    
    // 統計顯著性檢驗
    const significanceTest = this.performSignificanceTest(
      test.metrics.versionA,
      test.metrics.versionB
    );
    
    analysis.winner = significanceTest.winner;
    analysis.confidence = significanceTest.confidence;
    analysis.recommendation = this.generateRecommendation(significanceTest);
    
    return analysis;
  }
}
```

---

## 最佳實踐

### 提示詞設計最佳實踐

#### 1. 清晰性原則
```markdown
## 清晰性檢查清單
- [ ] 指令明確具體，避免模糊表達
- [ ] 使用簡潔的語言，避免冗長描述
- [ ] 結構化組織，使用標題和列表
- [ ] 提供具體範例，展示期望輸出
- [ ] 避免矛盾指令，確保邏輯一致
```

#### 2. 完整性原則
```markdown
## 完整性檢查清單
- [ ] 涵蓋所有必要的情境和條件
- [ ] 包含異常情況的處理指導
- [ ] 提供足夠的背景信息
- [ ] 定義所有關鍵術語和概念
- [ ] 包含質量標準和評估標準
```

#### 3. 適應性原則
```markdown
## 適應性檢查清單
- [ ] 支持不同用戶背景的個人化
- [ ] 能夠處理各種情感狀態
- [ ] 適應不同主題和情境
- [ ] 支持多種輸出格式和長度
- [ ] 具備錯誤恢復和備用方案
```

### 內容生成最佳實踐

#### 1. 質量優先策略
```javascript
const qualityFirstStrategy = {
  // 寧可生成較短但高質量的內容
  lengthVsQuality: 'QUALITY_FIRST',
  
  // 多次迭代優化而非一次性生成
  iterativeImprovement: true,
  
  // 嚴格的質量檢查標準
  qualityGates: [
    'RELEVANCE_CHECK',
    'COMPLETENESS_CHECK', 
    'APPROPRIATENESS_CHECK',
    'BIBLICAL_ACCURACY_CHECK'
  ],
  
  // 用戶反饋驅動的持續改進
  feedbackDriven: true
};
```

#### 2. 用戶體驗優化
```javascript
const userExperienceOptimization = {
  // 響應時間優化
  responseTime: {
    target: 5000,      // 5秒內回應
    maximum: 10000,    // 最多10秒
    fallback: 3000     // 備用回應3秒內
  },
  
  // 個人化程度
  personalization: {
    level: 'HIGH',
    factors: ['religion', 'age', 'gender', 'topic', 'emotion'],
    adaptation: 'DYNAMIC'
  },
  
  // 情感支持
  emotionalSupport: {
    priority: 'HIGH',
    approach: 'EMPATHETIC',
    tone: 'CARING_AND_AUTHORITATIVE'
  }
};
```

#### 3. 安全性保障
```javascript
const safetyGuarantees = {
  // 內容安全檢查
  contentSafety: [
    'NO_HARMFUL_ADVICE',
    'NO_MEDICAL_DIAGNOSIS',
    'NO_LEGAL_ADVICE',
    'CRISIS_INTERVENTION_PROTOCOLS'
  ],
  
  // 隱私保護
  privacyProtection: [
    'NO_PERSONAL_DATA_STORAGE',
    'ANONYMIZED_ANALYTICS',
    'SECURE_TRANSMISSION'
  ],
  
  // 宗教敏感性
  religiousSensitivity: [
    'RESPECT_ALL_BACKGROUNDS',
    'NO_FORCED_CONVERSION',
    'INCLUSIVE_LANGUAGE'
  ]
};
```

### 持續改進流程

#### 1. 數據驅動優化
```javascript
class DataDrivenOptimization {
  constructor() {
    this.optimizationCycle = {
      dataCollection: 'CONTINUOUS',
      analysis: 'WEEKLY',
      optimization: 'MONTHLY',
      deployment: 'QUARTERLY'
    };
  }
  
  collectOptimizationData() {
    return {
      userFeedback: this.getUserFeedback(),
      performanceMetrics: this.getPerformanceMetrics(),
      qualityScores: this.getQualityScores(),
      usagePatterns: this.getUsagePatterns()
    };
  }
  
  generateOptimizationPlan(data) {
    const analysis = this.analyzeData(data);
    
    return {
      priorityAreas: analysis.identifyPriorityAreas(),
      specificActions: analysis.generateActionItems(),
      expectedImpact: analysis.estimateImpact(),
      timeline: analysis.createTimeline()
    };
  }
  
  implementOptimizations(plan) {
    for (const action of plan.specificActions) {
      switch (action.type) {
        case 'PROMPT_ADJUSTMENT':
          this.adjustPrompts(action.details);
          break;
        
        case 'ALGORITHM_TUNING':
          this.tuneAlgorithms(action.details);
          break;
        
        case 'TEMPLATE_UPDATE':
          this.updateTemplates(action.details);
          break;
      }
    }
  }
}
```

#### 2. 社群反饋整合
```javascript
class CommunityFeedbackIntegration {
  constructor() {
    this.feedbackChannels = [
      'USER_RATINGS',
      'SUPPORT_TICKETS',
      'COMMUNITY_FORUM',
      'BETA_TESTING_GROUP'
    ];
  }
  
  aggregateFeedback() {
    const feedback = {};
    
    for (const channel of this.feedbackChannels) {
      feedback[channel] = this.collectChannelFeedback(channel);
    }
    
    return this.synthesizeFeedback(feedback);
  }
  
  prioritizeFeedback(feedback) {
    return feedback.sort((a, b) => {
      // 優先級計算：影響範圍 × 嚴重程度 × 實施難度
      const scoreA = a.impact * a.severity / a.difficulty;
      const scoreB = b.impact * b.severity / b.difficulty;
      
      return scoreB - scoreA;
    });
  }
  
  createImplementationPlan(prioritizedFeedback) {
    return {
      immediate: prioritizedFeedback.filter(f => f.urgency === 'HIGH'),
      shortTerm: prioritizedFeedback.filter(f => f.urgency === 'MEDIUM'),
      longTerm: prioritizedFeedback.filter(f => f.urgency === 'LOW')
    };
  }
}
```

---

## 結語

本使用指南提供了JesusLetter AI提示詞系統的完整實施框架。通過遵循這些指導原則和最佳實踐，可以確保系統提供高質量、個人化、安全的屬靈陪伴服務。

### 關鍵成功因素
1. **持續監控和優化**: 定期評估系統性能和用戶滿意度
2. **數據驅動決策**: 基於實際數據進行改進決策
3. **用戶反饋整合**: 積極收集和回應用戶反饋
4. **技術創新**: 持續採用新技術提升服務質量
5. **團隊協作**: 跨職能團隊的密切合作

### 未來發展方向
- 多語言支持擴展
- 更精細的個人化算法
- 實時情感分析整合
- 社群互動功能增強
- 移動端體驗優化

通過持續的努力和改進，JesusLetter將成為華人基督教社群中最受信賴的AI屬靈陪伴平台。