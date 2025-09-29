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

// 從環境變數取得 API 基礎 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

/**
 * 發送 AI 生成請求
 * @param {Object} payload
 */
const generateAI = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP 錯誤 ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('🚫 AI 請求失敗:', error);
    throw error;
  }
};

// 應用初始化
const initializeApp = async () => {
  if (window.__APP_INITIALIZED__) {
    console.log('⚠️ 應用已初始化，跳過重複初始化');
    return;
  }

  try {
    console.log('🚀 開始初始化應用...');

    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    await capacitorService.initialize();

    setTimeout(async () => {
      try {
        console.log('🔄 開始初始化PWA服務...');
        await pwaService.initialize();
        console.log('✅ PWA服務初始化成功');
      } catch (error) {
        console.error('❌ PWA服務初始化失敗:', error);
      }
    }, 1000);

    setupGlobalErrorHandling();
    setupAppEventListeners();

    // 掛載 Vue
    app.mount('#app');
    window.__APP_INITIALIZED__ = true;

    console.log('✅ 應用初始化完成');
    logAppStatus();
  } catch (error) {
    console.error('❌ 應用初始化失敗:', error);
    showInitializationError(error);
  }
};

/**
 * 全局錯誤處理
 */
const setupGlobalErrorHandling = () => {
  app.config.errorHandler = (err, instance, info) => {
    console.error('Vue 錯誤:', err, info);
  };

  window.addEventListener('error', (event) => {
    console.error('全局錯誤:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('未處理的 Promise 拒絕:', event.reason);
    event.preventDefault();
  });
};

/**
 * 應用事件監聽
 */
const setupAppEventListeners = () => {
  pwaService.addEventListener('beforeinstallprompt', () => {
    console.log('📲 PWA安裝提示可用');
  });

  pwaService.addEventListener('appinstalled', () => {
    console.log('✅ PWA已安裝');
    capacitorService.showToast('應用已成功安裝！');
  });

  window.addEventListener('app-resume', () => {
    console.log('📱 應用恢復');
    pwaService.checkForUpdates();
  });

  window.addEventListener('app-pause', () => {
    console.log('📱 應用暫停');
  });

  window.addEventListener('online', () => console.log('🌐 網絡已連接'));
  window.addEventListener('offline', () => console.log('📴 網絡已斷開'));
};

/**
 * 記錄應用狀態
 */
const logAppStatus = () => {
  console.group('📊 應用狀態信息');
  console.log('平台信息:', capacitorService.getPlatformInfo());
  console.log('PWA狀態:', pwaService.getStatus());
  console.log('環境:', process.env.NODE_ENV);
  console.groupEnd();
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

// 啟動應用
initializeApp();

// 導出 AI 請求函數給其他模組使用
export { generateAI };
