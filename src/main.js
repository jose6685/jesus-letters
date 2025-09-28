/**
 * 主應用程序入口點
 * 初始化Vue應用、Capacitor和PWA服務
 */

import { createApp } from 'vue';
import App from './App.vue';
import capacitorService from './services/CapacitorService.js';
import pwaService from './services/PWAService.js';

// 創建Vue應用實例
const app = createApp(App);

// 全局初始化狀態標記
window.__APP_INITIALIZED__ = window.__APP_INITIALIZED__ || false;

// 應用初始化
const initializeApp = async () => {
  // 防止重複初始化（開發環境熱重載保護）
  if (window.__APP_INITIALIZED__) {
    console.log('⚠️ 應用已初始化，跳過重複初始化');
    return;
  }

  try {
    console.log('🚀 開始初始化應用...');
    
    // 等待 DOM 完全載入
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
    
    // 初始化Capacitor服務
    await capacitorService.initialize();
    
    // 延遲初始化PWA服務，確保頁面完全穩定後再註冊Service Worker
    setTimeout(async () => {
      try {
        console.log('🔄 開始初始化PWA服務...');
        await pwaService.initialize();
        console.log('✅ PWA服務初始化成功');
      } catch (error) {
        console.error('❌ PWA服務初始化失敗:', error);
        // 不影響應用主要功能，但記錄詳細錯誤信息
        if (error.name === 'InvalidStateError') {
          console.error('💡 建議：請確保頁面完全載入後再嘗試註冊Service Worker');
        }
      }
    }, 1000); // 減少延遲時間到1秒，避免過度延遲
    
    // 設置全局錯誤處理
    setupGlobalErrorHandling();
    
    // 設置應用事件監聽
    setupAppEventListeners();
    
    // 掛載Vue應用
    app.mount('#app');
    
    // 標記初始化完成
    window.__APP_INITIALIZED__ = true;
    
    console.log('✅ 應用初始化完成');
    
    // 顯示應用狀態信息
    logAppStatus();
    
  } catch (error) {
    console.error('❌ 應用初始化失敗:', error);
    
    // 顯示錯誤信息給用戶
    showInitializationError(error);
  }
};

/**
 * 設置全局錯誤處理
 */
const setupGlobalErrorHandling = () => {
  // Vue錯誤處理
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue錯誤:', err, info);
    
    // 發送錯誤報告（如果需要）
    reportError('vue', err, { info, instance });
  };

  // 全局未捕獲錯誤處理
  window.addEventListener('error', (event) => {
    console.error('全局錯誤:', event.error);
    reportError('global', event.error, { 
      filename: event.filename, 
      lineno: event.lineno, 
      colno: event.colno 
    });
  });

  // Promise未捕獲拒絕處理
  window.addEventListener('unhandledrejection', (event) => {
    console.error('未處理的Promise拒絕:', event.reason);
    reportError('promise', event.reason);
    
    // 阻止默認的控制台錯誤輸出
    event.preventDefault();
  });
};

/**
 * 設置應用事件監聽
 */
const setupAppEventListeners = () => {
  // PWA安裝事件
  pwaService.addEventListener('beforeinstallprompt', () => {
    console.log('📲 PWA安裝提示可用');
    // 可以在這裡顯示自定義安裝按鈕
  });

  pwaService.addEventListener('appinstalled', () => {
    console.log('✅ PWA已安裝');
    capacitorService.showToast('應用已成功安裝！');
  });

  // PWA更新事件
  pwaService.addEventListener('updateavailable', () => {
    console.log('🔄 檢測到新版本');
    showUpdateNotification();
  });

  // 應用恢復/暫停事件
  window.addEventListener('app-resume', () => {
    console.log('📱 應用恢復');
    // 刷新數據、檢查更新等
    pwaService.checkForUpdates();
  });

  window.addEventListener('app-pause', () => {
    console.log('📱 應用暫停');
    // 保存狀態、清理資源等
  });

  // 網絡狀態變化
  window.addEventListener('online', () => {
    console.log('🌐 網絡已連接');
  });

  window.addEventListener('offline', () => {
    console.log('📴 網絡已斷開');
  });
};

/**
 * 顯示更新通知
 */
const showUpdateNotification = () => {
  const updateBanner = document.createElement('div');
  updateBanner.className = 'update-notification';
  updateBanner.innerHTML = `
    <div class="update-content">
      <span>🔄 發現新版本</span>
      <button onclick="applyUpdate()" class="update-btn">立即更新</button>
      <button onclick="dismissUpdate()" class="dismiss-btn">稍後</button>
    </div>
  `;
  updateBanner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #2563eb;
    color: white;
    padding: 12px;
    z-index: 10000;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
  `;

  // 添加樣式
  const style = document.createElement('style');
  style.textContent = `
    .update-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      font-size: 14px;
    }
    .update-btn, .dismiss-btn {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 8px;
      font-size: 12px;
    }
    .update-btn:hover, .dismiss-btn:hover {
      background: rgba(255,255,255,0.3);
    }
  `;
  document.head.appendChild(style);

  // 全局函數
  window.applyUpdate = () => {
    pwaService.applyUpdate();
  };

  window.dismissUpdate = () => {
    updateBanner.style.transform = 'translateY(-100%)';
    setTimeout(() => {
      if (updateBanner.parentNode) {
        updateBanner.parentNode.removeChild(updateBanner);
      }
    }, 300);
  };

  document.body.appendChild(updateBanner);

  // 顯示動畫
  setTimeout(() => {
    updateBanner.style.transform = 'translateY(0)';
  }, 100);
};

/**
 * 錯誤報告
 */
const reportError = (type, error, context = {}) => {
  const errorReport = {
    type,
    message: error.message || error,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    context
  };

  // 在開發環境中記錄到控制台
  if (process.env.NODE_ENV === 'development') {
    console.group(`🐛 錯誤報告 (${type})`);
    console.error('錯誤:', error);
    console.log('上下文:', context);
    console.groupEnd();
  }

  // 在生產環境中可以發送到錯誤追蹤服務
  // 例如: Sentry, LogRocket, 或自定義錯誤收集API
};

/**
 * 顯示初始化錯誤
 */
const showInitializationError = (error) => {
  const errorEl = document.createElement('div');
  errorEl.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      text-align: center;
      max-width: 400px;
      z-index: 10000;
    ">
      <h3 style="color: #ef4444; margin: 0 0 16px 0;">應用初始化失敗</h3>
      <p style="color: #6b7280; margin: 0 0 16px 0;">
        抱歉，應用無法正常啟動。請刷新頁面重試。
      </p>
      <button onclick="window.location.reload()" style="
        background: #2563eb;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">
        重新加載
      </button>
    </div>
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    "></div>
  `;
  
  document.body.appendChild(errorEl);
};

/**
 * 記錄應用狀態
 */
const logAppStatus = () => {
  const platformInfo = capacitorService.getPlatformInfo();
  const pwaStatus = pwaService.getStatus();
  
  console.group('📊 應用狀態信息');
  console.log('平台信息:', platformInfo);
  console.log('PWA狀態:', pwaStatus);
  console.log('環境:', process.env.NODE_ENV);
  console.groupEnd();
};

// 啟動應用
initializeApp();