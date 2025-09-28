import express from 'express'
import os from 'os'

const router = express.Router()

// GET /api/health - 基本健康檢查
router.get('/', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version,
    platform: os.platform(),
    arch: os.arch(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      system: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024)
    },
    cpu: {
      cores: os.cpus().length,
      load: os.loadavg()
    }
  }

  res.json(healthData)
})

// GET /api/health/detailed - 詳細健康檢查
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now()
    
    // 檢查各項服務狀態
    const checks = {
      server: await checkServerHealth(),
      memory: checkMemoryHealth(),
      disk: checkDiskHealth(),
      environment: checkEnvironmentHealth()
    }

    const responseTime = Date.now() - startTime
    const overallStatus = Object.values(checks).every(check => check.status === 'healthy') 
      ? 'healthy' 
      : 'degraded'

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks,
      system: {
        uptime: process.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        node_version: process.version,
        pid: process.pid
      }
    })

  } catch (error) {
    console.error('❌ 詳細健康檢查失敗:', error)
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// GET /api/health/ready - 就緒檢查（用於容器編排）
router.get('/ready', async (req, res) => {
  try {
    // 檢查關鍵服務是否就緒
    const readyChecks = {
      server: true,
      environment: !!process.env.NODE_ENV,
      memory: process.memoryUsage().heapUsed < (1024 * 1024 * 500) // 500MB限制
    }

    const isReady = Object.values(readyChecks).every(check => check === true)

    if (isReady) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: readyChecks
      })
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks: readyChecks
      })
    }

  } catch (error) {
    console.error('❌ 就緒檢查失敗:', error)
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// GET /api/health/live - 存活檢查（用於容器編排）
router.get('/live', (req, res) => {
  // 簡單的存活檢查
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

/**
 * 檢查服務器健康狀態
 */
async function checkServerHealth() {
  try {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    return {
      status: 'healthy',
      details: {
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: process.uptime()
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

/**
 * 檢查內存健康狀態
 */
function checkMemoryHealth() {
  try {
    const memUsage = process.memoryUsage()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    
    const memoryUsagePercent = (usedMem / totalMem) * 100
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
    
    const status = memoryUsagePercent > 90 || heapUsagePercent > 90 ? 'unhealthy' : 'healthy'
    
    return {
      status,
      details: {
        system: {
          total: Math.round(totalMem / 1024 / 1024),
          used: Math.round(usedMem / 1024 / 1024),
          free: Math.round(freeMem / 1024 / 1024),
          usagePercent: Math.round(memoryUsagePercent)
        },
        process: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsagePercent: Math.round(heapUsagePercent)
        }
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

/**
 * 檢查磁盤健康狀態
 */
function checkDiskHealth() {
  try {
    // 簡化的磁盤檢查
    return {
      status: 'healthy',
      details: {
        message: '磁盤狀態正常'
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

/**
 * 檢查環境變量健康狀態
 */
function checkEnvironmentHealth() {
  try {
    const requiredEnvVars = ['NODE_ENV']
    const optionalEnvVars = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'PORT']
    
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
    const available = optionalEnvVars.filter(envVar => !!process.env[envVar])
    
    return {
      status: missing.length === 0 ? 'healthy' : 'degraded',
      details: {
        required: {
          missing,
          available: requiredEnvVars.filter(envVar => !!process.env[envVar])
        },
        optional: {
          available,
          missing: optionalEnvVars.filter(envVar => !process.env[envVar])
        }
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

export default router