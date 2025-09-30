import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

/**
 * 匯出服務
 * 支持多種格式的文檔匯出功能
 */
class ExportService {
  constructor() {
    this.supportedFormats = ['txt', 'html', 'docx', 'json']
  }

  // 將不同資料形狀標準化為同一介面
  normalizeLetter(letter) {
    const userInput = letter.userInput || {
      nickname: letter.nickname,
      topic: letter.topic,
      situation: letter.situation
    }

    const aiResponse = letter.aiResponse || {
      jesusLetter: letter.jesusLetter,
      guidedPrayer: letter.guidedPrayer,
      biblicalReferences: letter.biblicalReferences,
      coreMessage: letter.coreMessage
    }

    return {
      id: letter.id,
      timestamp: letter.timestamp,
      userInput,
      aiResponse,
      metadata: letter.metadata
    }
  }

  /**
   * 匯出單個對話記錄
   * @param {Object} letter - 對話記錄
   * @param {string} format - 匯出格式
   * @returns {Promise<Blob>} 匯出的文件Blob
   */
  async exportSingleLetter(letter, format = 'txt') {
    try {
      if (!this.supportedFormats.includes(format.toLowerCase())) {
        throw new Error(`不支持的匯出格式: ${format}`)
      }

      const formatMethod = `exportAs${format.toUpperCase()}`
      if (typeof this[formatMethod] !== 'function') {
        throw new Error(`匯出方法不存在: ${formatMethod}`)
      }

      const content = await this[formatMethod]([letter])
      const mimeType = this.getMimeType(format)
      
      return new Blob([content], { type: mimeType })

    } catch (error) {
      console.error('❌ 匯出單個記錄失敗:', error)
      throw error
    }
  }

  /**
   * 匯出多個對話記錄
   * @param {Array} letters - 對話記錄數組
   * @param {string} format - 匯出格式
   * @returns {Promise<Blob>} 匯出的文件Blob
   */
  async exportMultipleLetters(letters, format = 'txt') {
    try {
      if (!Array.isArray(letters) || letters.length === 0) {
        throw new Error('沒有可匯出的記錄')
      }

      if (!this.supportedFormats.includes(format.toLowerCase())) {
        throw new Error(`不支持的匯出格式: ${format}`)
      }

      const formatMethod = `exportAs${format.toUpperCase()}`
      const content = await this[formatMethod](letters)
      const mimeType = this.getMimeType(format)
      
      return new Blob([content], { type: mimeType })

    } catch (error) {
      console.error('❌ 匯出多個記錄失敗:', error)
      throw error
    }
  }

  /**
   * 匯出為TXT格式
   * @param {Array} letters - 對話記錄數組
   * @returns {string} TXT內容
   */
  async exportAsTXT(letters) {
    const lines = []
    
    // 添加標題
    lines.push('耶穌的信 - 對話記錄')
    lines.push('='.repeat(50))
    lines.push(`匯出時間: ${new Date().toLocaleString('zh-TW')}`)
    lines.push(`記錄數量: ${letters.length}`)
    lines.push('')

    // 添加每個對話記錄
    letters.forEach((rawLetter, index) => {
      const letter = this.normalizeLetter(rawLetter)
      lines.push(`記錄 ${index + 1}`)
      lines.push('-'.repeat(30))
      lines.push(`日期: ${new Date(letter.timestamp).toLocaleString('zh-TW')}`)
      lines.push(`暱稱: ${letter.userInput.nickname || '未提供'}`)
      lines.push(`主題: ${letter.userInput.topic || '未提供'}`)
      lines.push('')
      
      lines.push('情況描述:')
      lines.push(letter.userInput.situation || '無')
      lines.push('')
      
      lines.push('耶穌的信:')
      lines.push(letter.aiResponse.jesusLetter || '無')
      lines.push('')
      
      lines.push('引導式禱告:')
      lines.push(letter.aiResponse.guidedPrayer || '無')
      lines.push('')
      
      if (letter.aiResponse.biblicalReferences && letter.aiResponse.biblicalReferences.length > 0) {
        lines.push('相關經文:')
        letter.aiResponse.biblicalReferences.forEach(ref => {
          lines.push(`- ${ref}`)
        })
        lines.push('')
      }
      
      lines.push('核心信息:')
      lines.push(letter.aiResponse.coreMessage || '無')
      lines.push('')
      lines.push('='.repeat(50))
      lines.push('')
    })

    return lines.join('\n')
  }

  /**
   * 匯出為HTML格式
   * @param {Array} letters - 對話記錄數組
   * @returns {string} HTML內容
   */
  async exportAsHTML(letters) {
    const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>耶穌的信 - 對話記錄</title>
    <style>
        body {
            font-family: 'Microsoft JhengHei', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .letter-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 5px solid #667eea;
        }
        .letter-header {
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .letter-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        .letter-title {
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
        }
        .letter-date {
            color: #666;
            font-size: 0.9em;
        }
        .topic-tag {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 8px;
            font-size: 1.1em;
        }
        .section-content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #667eea;
        }
        .jesus-letter {
            background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
            color: #2d3436;
        }
        .prayer {
            background: linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%);
            color: #2d3436;
        }
        .biblical-refs {
            background: #e8f4f8;
            border-left-color: #3498db;
        }
        .biblical-refs ul {
            margin: 0;
            padding-left: 20px;
        }
        .core-message {
            background: linear-gradient(135deg, #dda0dd 0%, #c8a2c8 100%);
            color: #2d3436;
            text-align: center;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            border-top: 1px solid #ddd;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .letter-meta { flex-direction: column; align-items: flex-start; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>耶穌的信</h1>
        <p>對話記錄匯出</p>
        <p>匯出時間: ${new Date().toLocaleString('zh-TW')} | 記錄數量: ${letters.length}</p>
    </div>

    ${letters.map((rawLetter, index) => {
      const letter = this.normalizeLetter(rawLetter)
      return `
    <div class="letter-card">
        <div class="letter-header">
            <div class="letter-meta">
                <div class="letter-title">記錄 ${index + 1} - ${letter.userInput.nickname || '匿名'}</div>
                <div class="topic-tag">${letter.userInput.topic || '未分類'}</div>
            </div>
            <div class="letter-date">${new Date(letter.timestamp).toLocaleString('zh-TW')}</div>
        </div>

        <div class="section">
            <div class="section-title">📝 情況描述</div>
            <div class="section-content">
                ${this.formatText(letter.userInput.situation || '無')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">💌 耶穌的信</div>
            <div class="section-content jesus-letter">
                ${this.formatText(letter.aiResponse.jesusLetter || '無')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">🙏 我來為您禱告</div>
            <div class="section-content prayer">
                ${this.formatText(letter.aiResponse.guidedPrayer || '無')}
            </div>
        </div>

        ${letter.aiResponse.biblicalReferences && letter.aiResponse.biblicalReferences.length > 0 ? `
        <div class="section">
            <div class="section-title">📖 相關經文</div>
            <div class="section-content biblical-refs">
                <ul>
                    ${letter.aiResponse.biblicalReferences.map(ref => `<li>${this.escapeHtml(ref)}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">💎 核心信息</div>
            <div class="section-content core-message">
                ${this.formatText(letter.aiResponse.coreMessage || '無')}
            </div>
        </div>
    </div>
    `
    }).join('')}

    <div class="footer">
        <p>願神的愛與平安與你同在 ❤️</p>
        <p>耶穌的信 3.0 - 數位屬靈陪伴</p>
    </div>
</body>
</html>`

    return html
  }

  /**
   * 匯出為DOCX格式
   * @param {Array} letters - 對話記錄數組
   * @returns {ArrayBuffer} DOCX文件內容
   */
  async exportAsDOCX(letters) {
    const children = []

    // 添加標題
    children.push(
      new Paragraph({
        text: '耶穌的信 - 對話記錄',
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 }
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `匯出時間: ${new Date().toLocaleString('zh-TW')}`,
            size: 20
          })
        ],
        spacing: { after: 200 }
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `記錄數量: ${letters.length}`,
            size: 20
          })
        ],
        spacing: { after: 400 }
      })
    )

    // 添加每個對話記錄
    letters.forEach((rawLetter, index) => {
      const letter = this.normalizeLetter(rawLetter)
      // 記錄標題
      children.push(
        new Paragraph({
          text: `記錄 ${index + 1} - ${letter.userInput.nickname || '匿名'}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      )

      // 基本信息
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '日期: ',
              bold: true
            }),
            new TextRun({
              text: new Date(letter.timestamp).toLocaleString('zh-TW')
            })
          ],
          spacing: { after: 100 }
        })
      )

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '主題: ',
              bold: true
            }),
            new TextRun({
              text: letter.userInput.topic || '未提供'
            })
          ],
          spacing: { after: 200 }
        })
      )

      // 情況描述
      children.push(
        new Paragraph({
          text: '情況描述',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      )

      children.push(
        new Paragraph({
          text: letter.userInput.situation || '無',
          spacing: { after: 200 }
        })
      )

      // 耶穌的信
      children.push(
        new Paragraph({
          text: '耶穌的信',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      )

      children.push(
        new Paragraph({
          text: letter.aiResponse.jesusLetter || '無',
          spacing: { after: 200 }
        })
      )

      // 引導式禱告
      children.push(
        new Paragraph({
          text: '引導式禱告',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      )

      children.push(
        new Paragraph({
          text: letter.aiResponse.guidedPrayer || '無',
          spacing: { after: 200 }
        })
      )

      // 相關經文
      if (letter.aiResponse.biblicalReferences && letter.aiResponse.biblicalReferences.length > 0) {
        children.push(
          new Paragraph({
            text: '相關經文',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        )

        letter.aiResponse.biblicalReferences.forEach(ref => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${ref}`
                })
              ],
              spacing: { after: 50 }
            })
          )
        })

        children.push(
          new Paragraph({
            text: '',
            spacing: { after: 200 }
          })
        )
      }

      // 核心信息
      children.push(
        new Paragraph({
          text: '核心信息',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      )

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: letter.aiResponse.coreMessage || '無',
              bold: true
            })
          ],
          spacing: { after: 400 }
        })
      )
    })

    // 創建文檔
    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    })

    // 生成文檔
    return await Packer.toBuffer(doc)
  }

  /**
   * 匯出為JSON格式
   * @param {Array} letters - 對話記錄數組
   * @returns {string} JSON內容
   */
  async exportAsJSON(letters) {
    const exportData = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      recordCount: letters.length,
      letters: letters.map(rawLetter => {
        const letter = this.normalizeLetter(rawLetter)
        return {
          id: letter.id,
          timestamp: letter.timestamp,
          userInput: letter.userInput,
          aiResponse: letter.aiResponse,
          metadata: letter.metadata
        }
      })
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 下載文件
   * @param {Blob} blob - 文件Blob
   * @param {string} filename - 文件名
   */
  downloadFile(blob, filename) {
    try {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`✅ 文件下載成功: ${filename}`)
    } catch (error) {
      console.error('❌ 文件下載失敗:', error)
      throw error
    }
  }

  /**
   * 生成文件名
   * @param {string} format - 文件格式
   * @param {boolean} isMultiple - 是否為多個記錄
   * @returns {string} 文件名
   */
  generateFilename(format, isMultiple = false) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    const prefix = isMultiple ? '耶穌的信_全部記錄' : '耶穌的信_記錄'
    return `${prefix}_${timestamp}.${format.toLowerCase()}`
  }

  /**
   * 獲取MIME類型
   * @param {string} format - 文件格式
   * @returns {string} MIME類型
   */
  getMimeType(format) {
    const mimeTypes = {
      txt: 'text/plain;charset=utf-8',
      html: 'text/html;charset=utf-8',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      json: 'application/json;charset=utf-8'
    }
    return mimeTypes[format.toLowerCase()] || 'text/plain'
  }

  /**
   * 格式化文本（HTML用）
   * @param {string} text - 原始文本
   * @returns {string} 格式化後的HTML
   */
  formatText(text) {
    if (!text) return ''
    
    return this.escapeHtml(text)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
  }

  /**
   * HTML轉義
   * @param {string} text - 原始文本
   * @returns {string} 轉義後的文本
   */
  escapeHtml(text) {
    if (!text) return ''
    
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * 獲取支持的格式列表
   * @returns {Array} 支持的格式
   */
  getSupportedFormats() {
    return [...this.supportedFormats]
  }

  /**
   * 檢查格式是否支持
   * @param {string} format - 格式
   * @returns {boolean} 是否支持
   */
  isFormatSupported(format) {
    return this.supportedFormats.includes(format.toLowerCase())
  }
}

// 創建單例實例
const exportService = new ExportService()

export default exportService