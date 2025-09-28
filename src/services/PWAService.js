/**
 * PWA服務 - 處理漸進式Web應用功能
 * 提供安裝提示、更新檢查、離線支持等PWA功能
 */

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isStandalone = false;
    this.serviceWorker = null;
    this.updateAvailable = false;
    this.initialized = false;
    
    // 事件監聽器
    this.listeners = {
      beforeinstallprompt: [],
      appinstalled: [],
      updateavailable: [],
      updateready: []
    };
  }

  /**
   * 初始化PWA服務
   */
  async initialize() {
    if (this.initialized) {
      console.log('⚠️ PWA服務已初始化，跳過重複初始化');
      return;
    }

    try {
      console.log('🚀 初始化PWA服務...');
      
      // 檢查PWA狀態
      this.checkPWAStatus();
      
      // 註冊Service Worker
      await this.registerServiceWorker();
      
      // 設置安裝事件監聽器
      this.setupInstallListeners();
      
      // 檢查更新
      this.checkForUpdates();
      
      // 設置網絡狀態監聽
      this.setupNetworkListeners();
      
      this.initialized = true;
      console.log('✅ PWA服務初始化完成');
      
    } catch (error) {
      console.error('❌ PWA服務初始化失敗:', error);
    }
  }

  /**
   * 檢查PWA狀態
   */
  checkPWAStatus() {
    // 檢查是否已安裝
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://');
    
    this.isInstalled = this.isStandalone;
    
    console.log('📱 PWA狀態:', {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      userAgent: navigator.userAgent
    });
  }

  /**
   * 註冊Service Worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('❌ 瀏覽器不支持Service Worker');
      return;
    }

    // 在開發模式（Vite dev、本地端）停用 Service Worker 並移除既有註冊，避免閃爍與更新迴圈
    const isDevEnv = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
                     ['localhost','127.0.0.1'].includes(location.hostname);
    if (isDevEnv) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length) {
          console.log('🧹 開發模式：解除已註冊的 Service Worker');
          await Promise.all(regs.map(r => r.unregister()));
        }
      } catch (e) {
        console.warn('⚠️ 解除 Service Worker 失敗:', e);
      }
      console.log('⚠️ 開發模式，跳過 Service Worker 註冊');
      this.serviceWorker = null;
      this.updateAvailable = false;
      return;
    }

    // 檢查是否在安全上下文中
    if (!window.isSecureContext && location.protocol !== 'http:') {
      console.log('❌ Service Worker 需要安全上下文 (HTTPS)');
      return;
    }

    // 檢查是否在 iframe 或 webview 中
    if (window.self !== window.top) {
      console.log('⚠️ 在 iframe 中，跳過 Service Worker 註冊');
      return;
    }

    // 檢查是否在 IDE webview 環境中
    if (window.location.href.includes('ide_webview_request_time')) {
      console.log('⚠️ 檢測到 IDE webview 環境，使用簡化註冊方式');
      return this.registerServiceWorkerSimple();
    }

    // 檢查是否已經有活躍的註冊
    try {
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length > 0) {
        console.log('⚠️ 檢測到現有的 Service Worker 註冊');
        // 在 webview 環境中不強制清理，避免狀態衝突
        const activeRegistration = existingRegistrations.find(reg => reg.active);
        if (activeRegistration) {
          console.log('✅ 使用現有的活躍 Service Worker');
          this.serviceWorker = activeRegistration;
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ 檢查現有註冊時出錯:', error);
    }

    // 確保文檔完全載入並穩定
    await this.waitForDocumentReady();
    
    // 額外的穩定性檢查
    await this.waitForPageStability();

    try {
      console.log('🔄 開始註冊 Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // 確保不使用緩存
      });

      this.serviceWorker = registration;
      
      console.log('✅ Service Worker註冊成功:', registration.scope);

      // 監聽Service Worker更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 有新版本可用
              this.updateAvailable = true;
              this.notifyListeners('updateavailable', { registration });
              console.log('🔄 檢測到新版本');
            } else {
              // 首次安裝
              console.log('✅ Service Worker首次安裝完成');
            }
          }
        });
      });

      // 監聽Service Worker控制變化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.notifyListeners('updateready');
        console.log('🔄 新版本已準備就緒');
      });

    } catch (error) {
      console.error('❌ Service Worker註冊失敗:', error);
      
      // 在 webview 環境中不重試，避免無限循環
      if (error.name === 'InvalidStateError') {
        console.error('💡 InvalidStateError 詳細信息:', {
          documentState: document.readyState,
          visibilityState: document.visibilityState,
          location: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
        
        console.log('⚠️ 由於 InvalidStateError，跳過 Service Worker 註冊');
        // 不拋出錯誤，讓應用繼續運行
        return;
      }
      
      throw error;
    }
  }

  /**
   * 簡化的 Service Worker 註冊方法（用於特殊環境）
   */
  async registerServiceWorkerSimple() {
    try {
      // 檢查是否已有註冊
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length > 0) {
        console.log('✅ 使用現有 Service Worker 註冊');
        this.serviceWorker = existingRegistrations[0];
        return;
      }

      // 嘗試簡單註冊
      console.log('🔄 嘗試簡化 Service Worker 註冊...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.serviceWorker = registration;
      console.log('✅ 簡化 Service Worker 註冊成功');
      
    } catch (error) {
      console.warn('⚠️ 簡化註冊也失敗，跳過 Service Worker:', error.message);
      // 不拋出錯誤，讓應用繼續運行
    }
  }

  /**
   * 等待文檔完全準備就緒
   */
  async waitForDocumentReady() {
    return new Promise((resolve) => {
      // 多重檢查確保文檔完全準備就緒
      const checkReady = () => {
        if (document.readyState === 'complete' && 
            document.visibilityState === 'visible' &&
            !document.hidden) {
          resolve();
        } else {
          // 如果文檔還沒完全準備好，繼續等待
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkReady, { once: true });
          } else if (document.readyState === 'interactive') {
            window.addEventListener('load', checkReady, { once: true });
          } else {
            // 文檔已完成但可能不可見，等待可見性變化
            document.addEventListener('visibilitychange', checkReady, { once: true });
          }
        }
      };
      
      checkReady();
    });
  }

  /**
   * 等待頁面穩定性
   */
  async waitForPageStability() {
    return new Promise((resolve) => {
      // 等待頁面完全穩定
      let stabilityTimer;
      let checkCount = 0;
      const maxChecks = 10;
      
      const checkStability = () => {
        checkCount++;
        
        if (checkCount >= maxChecks) {
          resolve();
          return;
        }
        
        // 檢查頁面是否穩定
        const isStable = document.readyState === 'complete' &&
                        !document.hidden &&
                        document.visibilityState === 'visible';
        
        if (isStable) {
          // 頁面穩定，再等待一小段時間確保
          clearTimeout(stabilityTimer);
          stabilityTimer = setTimeout(resolve, 200);
        } else {
          // 頁面不穩定，繼續檢查
          setTimeout(checkStability, 100);
        }
      };
      
      checkStability();
    });
  }

  /**
   * 設置安裝事件監聽器
   */
  setupInstallListeners() {
    // 監聽安裝提示事件
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📲 安裝提示事件觸發');
      
      // 阻止默認的安裝提示
      e.preventDefault();
      
      // 保存事件以便後續使用
      this.deferredPrompt = e;
      
      // 通知監聽器
      this.notifyListeners('beforeinstallprompt', e);
    });

    // 監聽應用安裝事件
    window.addEventListener('appinstalled', (e) => {
      console.log('✅ 應用已安裝');
      
      this.isInstalled = true;
      this.deferredPrompt = null;
      
      // 通知監聽器
      this.notifyListeners('appinstalled', e);
    });
  }

  /**
   * 顯示安裝提示
   */
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.log('❌ 無可用的安裝提示');
      return false;
    }

    try {
      // 顯示安裝提示
      this.deferredPrompt.prompt();
      
      // 等待用戶選擇
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`📲 用戶選擇: ${outcome}`);
      
      // 清除保存的提示
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
      
    } catch (error) {
      console.error('❌ 顯示安裝提示失敗:', error);
      return false;
    }
  }

  /**
   * 檢查是否可以安裝
   */
  canInstall() {
    return !!this.deferredPrompt && !this.isInstalled;
  }

  /**
   * 檢查更新
   */
  async checkForUpdates() {
    if (!this.serviceWorker) return;

    try {
      await this.serviceWorker.update();
      console.log('🔄 檢查更新完成');
    } catch (error) {
      console.error('❌ 檢查更新失敗:', error);
    }
  }

  /**
   * 應用更新
   */
  async applyUpdate() {
    if (!this.serviceWorker || !this.updateAvailable) return;

    try {
      // 開發模式不自動重載，避免與 HMR 衝突導致閃爍
      const isDevEnv = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
                       ['localhost','127.0.0.1'].includes(location.hostname);
      if (isDevEnv) {
        console.log('⚠️ 開發模式：略過自動重載，保留現有頁面');
        return;
      }

      // 跳過等待，立即激活新的Service Worker
      if (this.serviceWorker.waiting) {
        this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // 重新加載頁面以應用更新
      window.location.reload();
      
    } catch (error) {
      console.error('❌ 應用更新失敗:', error);
    }
  }

  /**
   * 設置網絡狀態監聽
   */
  setupNetworkListeners() {
    // 監聽在線狀態變化
    window.addEventListener('online', () => {
      console.log('🌐 網絡已連接');
      this.showNetworkStatus('已連接到網絡', 'success');
      
      // 嘗試同步離線數據
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      console.log('📴 網絡已斷開');
      this.showNetworkStatus('網絡已斷開，應用將在離線模式下運行', 'warning');
    });

    // 初始網絡狀態檢查
    if (!navigator.onLine) {
      console.log('📴 當前處於離線狀態');
    }
  }

  /**
   * 顯示網絡狀態
   */
  showNetworkStatus(message, type = 'info') {
    // 創建狀態提示
    const statusEl = document.createElement('div');
    statusEl.className = `network-status network-status-${type}`;
    statusEl.textContent = message;
    statusEl.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 12px;
      text-align: center;
      font-size: 14px;
      z-index: 10000;
      transform: translateY(-100%);
      transition: transform 0.3s ease;
      ${type === 'success' ? 'background: #10b981; color: white;' : ''}
      ${type === 'warning' ? 'background: #f59e0b; color: white;' : ''}
      ${type === 'error' ? 'background: #ef4444; color: white;' : ''}
    `;

    document.body.appendChild(statusEl);

    // 顯示動畫
    setTimeout(() => {
      statusEl.style.transform = 'translateY(0)';
    }, 100);

    // 自動隱藏
    setTimeout(() => {
      statusEl.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        if (statusEl.parentNode) {
          statusEl.parentNode.removeChild(statusEl);
        }
      }, 300);
    }, 3000);
  }

  /**
   * 同步離線數據
   */
  async syncOfflineData() {
    try {
      // 這裡可以添加離線數據同步邏輯
      console.log('🔄 開始同步離線數據...');
      
      // 發送消息給Service Worker進行後台同步
      if (this.serviceWorker && this.serviceWorker.active) {
        this.serviceWorker.active.postMessage({
          type: 'BACKGROUND_SYNC',
          action: 'sync-offline-data'
        });
      }
      
    } catch (error) {
      console.error('❌ 離線數據同步失敗:', error);
    }
  }

  /**
   * 獲取緩存使用情況
   */
  async getCacheUsage() {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        usagePercentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('❌ 獲取緩存使用情況失敗:', error);
      return null;
    }
  }

  /**
   * 清理緩存
   */
  async clearCache() {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('🧹 緩存清理完成');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ 清理緩存失敗:', error);
      return false;
    }
  }

  /**
   * 添加事件監聽器
   */
  addEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * 移除事件監聽器
   */
  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  /**
   * 通知監聽器
   */
  notifyListeners(event, data = null) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ 事件監聽器執行失敗 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 獲取PWA狀態
   */
  getStatus() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: this.isStandalone,
      canInstall: this.canInstall(),
      updateAvailable: this.updateAvailable,
      isOnline: navigator.onLine,
      serviceWorkerRegistered: !!this.serviceWorker
    };
  }

  /**
   * 銷毀服務
   */
  destroy() {
    console.log('🗑️ 銷毀PWA服務...');
    
    // 清除事件監聽器
    Object.keys(this.listeners).forEach(event => {
      this.listeners[event] = [];
    });
    
    this.initialized = false;
  }
}

// 創建單例實例
const pwaService = new PWAService();

export default pwaService;