import app from './app.js'

const PORT = process.env.PORT || 3002

// 對於Vercel部署，直接導出app
if (process.env.VERCEL) {
  export default app
} else {
  // 本地開發環境
  const server = app.listen(PORT, () => {
    console.log(`🚀 後端服務器已啟動在端口 ${PORT}`)
    console.log(`📡 API端點: http://localhost:${PORT}/api`)
    console.log(`🏥 健康檢查: http://localhost:${PORT}/api/health`)
    console.log(`🤖 AI服務: http://localhost:${PORT}/api/ai`)
  })

  // 優雅關閉
  process.on('SIGTERM', () => {
    console.log('收到SIGTERM信號，正在關閉服務器...')
    server.close(() => {
      console.log('服務器已關閉')
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('收到SIGINT信號，正在關閉服務器...')
    server.close(() => {
      console.log('服務器已關閉')
      process.exit(0)
    })
  })

  export default server
}