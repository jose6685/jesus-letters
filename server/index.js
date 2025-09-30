import app from './app.js'

const PORT = process.env.PORT || 3003
const HOST = process.env.HOST || '0.0.0.0'

// 啟動伺服器（綁定至明確主機，避免本機連線問題）
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 後端服務器已啟動在 ${HOST}:${PORT}`)
  console.log(`📡 API端點: http://${HOST}:${PORT}/api`)
  console.log(`🏥 健康檢查: http://${HOST}:${PORT}/api/health`)
  console.log(`🤖 AI服務: http://${HOST}:${PORT}/api/ai`)
})

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉服務器...')
  server.close(() => {
    console.log('服務器已關閉')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，正在關閉服務器...')
  server.close(() => {
    console.log('服務器已關閉')
    process.exit(0)
  })
})

export default server