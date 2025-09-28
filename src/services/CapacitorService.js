/**
 * Capacitor服務 - 處理原生功能集成
 * 提供跨平台的原生功能訪問和管理
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Toast } from '@capacitor/toast';

class CapacitorService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform();
    this.deviceInfo = null;
    this.initialized = false;
  }

  /**
   * 初始化Capacitor服務
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🚀 初始化Capacitor服務...');
      
      // 獲取設備信息
      await this.getDeviceInfo();
      
      // 初始化狀態欄
      await this.initializeStatusBar();
      
      // 初始化啟動畫面
      await this.initializeSplashScreen();
      
      // 初始化鍵盤
      await this.initializeKeyboard();
      
      // 初始化應用程序事件
      await this.initializeAppEvents();
      
      this.initialized = true;
      console.log('✅ Capacitor服務初始化完成');
      
    } catch (error) {
      console.error('❌ Capacitor服務初始化失敗:', error);
    }
  }

  /**
   * 獲取設備信息
   */
  async getDeviceInfo() {
    try {
      if (this.isNative) {
        this.deviceInfo = await Device.getInfo();
        console.log('📱 設備信息:', this.deviceInfo);
      } else {
        this.deviceInfo = {
          platform: 'web',
          operatingSystem: 'unknown',
          osVersion: 'unknown',
          manufacturer: 'unknown',
          model: 'unknown',
          isVirtual: false
        };
      }
      return this.deviceInfo;
    } catch (error) {
      console.error('❌ 獲取設備信息失敗:', error);
      return null;
    }
  }

  /**
   * 初始化狀態欄
   */
  async initializeStatusBar() {
    if (!this.isNative) return;

    try {
      // 設置狀態欄樣式
      await StatusBar.setStyle({ style: Style.Light });
      
      // 設置狀態欄背景色
      await StatusBar.setBackgroundColor({ color: '#2563eb' });
      
      // 顯示狀態欄
      await StatusBar.show();
      
      console.log('📊 狀態欄初始化完成');
    } catch (error) {
      console.error('❌ 狀態欄初始化失敗:', error);
    }
  }

  /**
   * 更新狀態欄主題
   */
  async updateStatusBarTheme(isDark = false) {
    if (!this.isNative) return;

    try {
      const style = isDark ? Style.Dark : Style.Light;
      const backgroundColor = isDark ? '#1f2937' : '#2563eb';
      
      await StatusBar.setStyle({ style });
      await StatusBar.setBackgroundColor({ color: backgroundColor });
      
      console.log(`📊 狀態欄主題更新為: ${isDark ? '深色' : '淺色'}`);
    } catch (error) {
      console.error('❌ 狀態欄主題更新失敗:', error);
    }
  }

  /**
   * 初始化啟動畫面
   */
  async initializeSplashScreen() {
    if (!this.isNative) return;

    try {
      // 延遲隱藏啟動畫面，確保應用完全加載
      setTimeout(async () => {
        await SplashScreen.hide();
        console.log('🎨 啟動畫面已隱藏');
      }, 2000);
      
    } catch (error) {
      console.error('❌ 啟動畫面處理失敗:', error);
    }
  }

  /**
   * 初始化鍵盤
   */
  async initializeKeyboard() {
    if (!this.isNative) return;

    try {
      // 監聽鍵盤顯示事件
      Keyboard.addListener('keyboardWillShow', (info) => {
        console.log('⌨️ 鍵盤即將顯示:', info);
        document.body.classList.add('keyboard-open');
        
        // 調整視窗高度
        const keyboardHeight = info.keyboardHeight;
        document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
      });

      // 監聽鍵盤隱藏事件
      Keyboard.addListener('keyboardWillHide', () => {
        console.log('⌨️ 鍵盤即將隱藏');
        document.body.classList.remove('keyboard-open');
        document.documentElement.style.removeProperty('--keyboard-height');
      });

      console.log('⌨️ 鍵盤事件監聽器已設置');
    } catch (error) {
      console.error('❌ 鍵盤初始化失敗:', error);
    }
  }

  /**
   * 初始化應用程序事件
   */
  async initializeAppEvents() {
    if (!this.isNative) return;

    try {
      // 監聽應用狀態變化
      App.addListener('appStateChange', ({ isActive }) => {
        console.log(`📱 應用狀態變化: ${isActive ? '前台' : '後台'}`);
        
        if (isActive) {
          // 應用回到前台時的處理
          this.onAppResume();
        } else {
          // 應用進入後台時的處理
          this.onAppPause();
        }
      });

      // 監聽返回按鈕（Android）
      App.addListener('backButton', ({ canGoBack }) => {
        console.log('🔙 返回按鈕被按下, canGoBack:', canGoBack);
        
        if (!canGoBack) {
          // 如果無法返回，顯示退出確認
          this.showExitConfirmation();
        }
      });

      console.log('📱 應用事件監聽器已設置');
    } catch (error) {
      console.error('❌ 應用事件初始化失敗:', error);
    }
  }

  /**
   * 應用恢復時的處理
   */
  onAppResume() {
    // 刷新數據
    window.dispatchEvent(new CustomEvent('app-resume'));
    
    // 檢查網絡狀態
    this.checkNetworkStatus();
  }

  /**
   * 應用暫停時的處理
   */
  onAppPause() {
    // 保存當前狀態
    window.dispatchEvent(new CustomEvent('app-pause'));
    
    // 清理定時器等資源
    this.cleanupResources();
  }

  /**
   * 顯示退出確認對話框
   */
  async showExitConfirmation() {
    const shouldExit = confirm('確定要退出應用程序嗎？');
    if (shouldExit) {
      App.exitApp();
    }
  }

  /**
   * 檢查網絡狀態
   */
  async checkNetworkStatus() {
    // 這裡可以添加網絡狀態檢查邏輯
    console.log('🌐 檢查網絡狀態...');
  }

  /**
   * 清理資源
   */
  cleanupResources() {
    // 清理定時器、取消請求等
    console.log('🧹 清理應用資源...');
  }

  /**
   * 分享內容
   */
  async shareContent(options) {
    try {
      if (this.isNative) {
        await Share.share({
          title: options.title || '耶穌的信',
          text: options.text || '',
          url: options.url || '',
          dialogTitle: options.dialogTitle || '分享到...'
        });
        
        console.log('📤 內容分享成功');
        return true;
      } else {
        // Web平台使用Web Share API或回退方案
        if (navigator.share) {
          await navigator.share({
            title: options.title,
            text: options.text,
            url: options.url
          });
          return true;
        } else {
          // 回退到複製到剪貼板
          await navigator.clipboard.writeText(options.text || options.url || '');
          this.showToast('內容已複製到剪貼板');
          return true;
        }
      }
    } catch (error) {
      console.error('❌ 分享失敗:', error);
      return false;
    }
  }

  /**
   * 觸覺反饋
   */
  async hapticFeedback(style = 'medium') {
    if (!this.isNative) return;

    try {
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      }[style] || ImpactStyle.Medium;

      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('❌ 觸覺反饋失敗:', error);
    }
  }

  /**
   * 顯示Toast消息
   */
  async showToast(message, duration = 'short') {
    try {
      if (this.isNative) {
        await Toast.show({
          text: message,
          duration: duration,
          position: 'bottom'
        });
      } else {
        // Web平台的Toast實現
        this.showWebToast(message, duration);
      }
    } catch (error) {
      console.error('❌ Toast顯示失敗:', error);
    }
  }

  /**
   * Web平台Toast實現
   */
  showWebToast(message, duration) {
    const toast = document.createElement('div');
    toast.className = 'web-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      font-size: 14px;
      z-index: 10000;
      animation: toast-show 0.3s ease-out;
    `;

    // 添加動畫樣式
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes toast-show {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toast-hide {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // 自動移除
    const hideDelay = duration === 'long' ? 3500 : 2000;
    setTimeout(() => {
      toast.style.animation = 'toast-hide 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, hideDelay);
  }

  /**
   * 隱藏鍵盤
   */
  async hideKeyboard() {
    if (!this.isNative) return;

    try {
      await Keyboard.hide();
      console.log('⌨️ 鍵盤已隱藏');
    } catch (error) {
      console.error('❌ 隱藏鍵盤失敗:', error);
    }
  }

  /**
   * 獲取平台信息
   */
  getPlatformInfo() {
    return {
      isNative: this.isNative,
      platform: this.platform,
      deviceInfo: this.deviceInfo,
      isIOS: this.platform === 'ios',
      isAndroid: this.platform === 'android',
      isWeb: this.platform === 'web'
    };
  }

  /**
   * 檢查功能可用性
   */
  isFeatureAvailable(feature) {
    const features = {
      statusBar: this.isNative,
      splashScreen: this.isNative,
      keyboard: this.isNative,
      haptics: this.isNative,
      share: this.isNative || !!navigator.share,
      toast: true,
      backButton: this.platform === 'android'
    };

    return features[feature] || false;
  }

  /**
   * 銷毀服務
   */
  destroy() {
    console.log('🗑️ 銷毀Capacitor服務...');
    
    // 移除所有事件監聽器
    if (this.isNative) {
      App.removeAllListeners();
      Keyboard.removeAllListeners();
    }
    
    this.initialized = false;
  }
}

// 創建單例實例
const capacitorService = new CapacitorService();

export default capacitorService;