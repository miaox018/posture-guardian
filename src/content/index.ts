// 🚨 立即输出日志 - 文件加载时就执行
console.log('🔥🔥🔥 Content Script 文件开始加载!', {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  readyState: document.readyState
});

import { ChromeMessage, PostureStatus, UsageMode, ActivityDetectionResult } from '@shared/types';
import { initializePostureMonitoringEntry } from './postureMonitoringEntry';

console.log('📦 导入模块完成:', {
  initializePostureMonitoringEntry: typeof initializePostureMonitoringEntry,
  modulesLoaded: true
});

// 活动检测器
class ActivityDetector {
  private lastActivityTime = Date.now();
  private activityThreshold = 60000; // 1分钟无活动视为不活跃
  private isFullscreen = false;

  constructor() {
    this.setupActivityListeners();
    this.listenForMessages();
    console.log('ActivityDetector初始化完成');
  }

  private setupActivityListeners() {
    // 监听鼠标和键盘活动
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivityTime = Date.now();
      }, { passive: true });
    });

    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = document.fullscreenElement !== null;
    });

    document.addEventListener('webkitfullscreenchange', () => {
      this.isFullscreen = (document as any).webkitFullscreenElement !== null;
    });
  }

  private listenForMessages() {
    chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
      switch (message.type) {
        case 'CHECK_USER_ACTIVITY':
          const result = this.getActivityStatus();
          sendResponse(result);
          break;
          
        case 'CHROME_FOCUS_LOST':
          this.handleFocusChange(false);
          break;
          
        case 'CHROME_FOCUS_GAINED':
          this.handleFocusChange(true);
          break;
          
        case 'POSTURE_STATUS_CHANGED':
          this.handlePostureStatusChange(message.data);
          break;
          
        case 'PLAY_REMINDER_SOUND':
          console.log('收到聲音測試請求:', message.data);
          this.playTestSound(message.data);
          sendResponse({ success: true });
          break;
      }
      
      return true;
    });
  }

  private getActivityStatus(): ActivityDetectionResult {
    const now = Date.now();
    const hasRecentActivity = (now - this.lastActivityTime) < this.activityThreshold;
    
    return {
      hasActivity: hasRecentActivity,
      lastActivity: this.lastActivityTime,
      isFullscreen: this.isFullscreen
    };
  }

  private handleFocusChange(hasFocus: boolean) {
    console.log('Chrome焦點變化:', hasFocus);
    // 可以在這里處理焦點變化邏輯
  }

  private handlePostureStatusChange(status: PostureStatus) {
    console.log('姿勢狀態變化:', status);
    // 可以在這里添加狀態變化的處理邏輯
  }

  // 播放測試聲音
  private playTestSound(data: { soundName: string; volume: number }) {
    console.log('開始播放測試聲音:', data);
    
    try {
      // 檢查瀏覽器支持
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.error('瀏覽器不支持 Web Audio API');
        this.showTestSoundNotification('您的瀏覽器不支持音頻播放', 'error');
        return;
      }

      // 創建音頻上下文
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // 如果音頻上下文被暫停，嘗試恢復
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('音頻上下文已恢復');
          this.playTestTone(audioContext, data);
        }).catch((error) => {
          console.error('恢復音頻上下文失敗:', error);
          this.showTestSoundNotification('無法播放音效，請檢查瀏覽器設置', 'error');
        });
      } else {
        this.playTestTone(audioContext, data);
      }
      
      // 顯示測試成功提示
      this.showTestSoundNotification('音效測試完成 🔊', 'success');
      
    } catch (error) {
      console.error('播放測試音效失敗:', error);
      this.showTestSoundNotification('播放失敗，請重試', 'error');
    }
  }

  // 播放測試音調
  private playTestTone(audioContext: AudioContext, data: { soundName: string; volume: number }) {
    try {
      const duration = 1.0; // 測試音效持續1秒
      const volume = Math.min(Math.max(data.volume || 0.3, 0.1), 1.0);
      
      // 根據聲音名稱選擇不同的音調
      let frequency1 = 440; // A4
      let frequency2 = 880; // A5
      let waveType: OscillatorType = 'sine';
      
      // 修正：使用HTML中的實際選項值
      switch (data.soundName) {
        case 'gentle-chime': // 轻柔铃声
          frequency1 = 349; // F4
          frequency2 = 523; // C5
          waveType = 'sine';
          console.log('播放：轻柔铃声');
          break;
        case 'soft-bell': // 柔和钟声
          frequency1 = 440; // A4
          frequency2 = 659; // E5
          waveType = 'triangle';
          console.log('播放：柔和钟声');
          break;
        case 'nature-ding': // 自然叮声
          frequency1 = 523; // C5
          frequency2 = 784; // G5
          waveType = 'square';
          console.log('播放：自然叮声');
          break;
        default:
          console.log('播放：默認音效');
          break;
      }
      
      console.log('測試音效參數:', { 
        soundName: data.soundName,
        frequency1, 
        frequency2, 
        volume, 
        duration, 
        waveType 
      });
      
      // 創建增益節點用於音量控制
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1); // 淡入
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + duration - 0.2);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration); // 淡出
      
      // 創建和配置振盪器
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      
      oscillator1.type = waveType;
      oscillator2.type = waveType;
      oscillator1.frequency.setValueAtTime(frequency1, audioContext.currentTime);
      oscillator2.frequency.setValueAtTime(frequency2, audioContext.currentTime);
      
      // 連接音頻節點
      const merger = audioContext.createChannelMerger(2);
      oscillator1.connect(merger, 0, 0);
      oscillator2.connect(merger, 0, 1);
      merger.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 播放音調
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + duration);
      oscillator2.stop(audioContext.currentTime + duration);
      
      console.log('測試音效播放成功');
      
    } catch (error) {
      console.error('播放測試音調失敗:', error);
      this.showTestSoundNotification('音效播放出現問題', 'error');
    }
  }

  // 顯示測試聲音通知
  private showTestSoundNotification(message: string, type: 'success' | 'error') {
    const notification = document.createElement('div');
    notification.className = 'test-sound-notification';
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10001;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${type === 'success' ? '#10B981' : '#EF4444'};
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      max-width: 280px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 動畫顯示
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 3秒後移除
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// 温和提醒系统（保留原有实现，但现在主要由新的监控系统处理）
class GentleReminderSystem {
  private tooltipContainer: HTMLElement | null = null;

  constructor() {
    this.listenForReminders();
  }

  private listenForReminders() {
    chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, _sendResponse) => {
      switch (message.type) {
        case 'SHOW_GENTLE_TOOLTIP':
          this.showGentleTooltip(message.data);
          break;
          
        case 'HIDE_GENTLE_TOOLTIP':
          this.hideGentleTooltip();
          break;
          
        case 'TRIGGER_GENTLE_POPUP':
          console.log('💬 收到弹窗提醒消息:', message.data);
          this.showGentleTooltip({
            message: message.data.message || '💡 建议调整坐姿 😊',
            duration: 4000
          });
          break;
          
        case 'TRIGGER_AUDIO_REMINDER':
          console.log('🔊 收到音频提醒消息:', message.data);
          this.handleAudioReminder(message.data);
          break;
      }
      
      return true;
    });
  }

  private showGentleTooltip(data: { message: string; duration?: number }) {
    // 移除已存在的tooltip
    this.hideGentleTooltip();

    // 创建新的tooltip
    this.tooltipContainer = document.createElement('div');
    this.tooltipContainer.className = 'gentle-posture-tooltip';
    this.tooltipContainer.innerHTML = `
      <div class="tooltip-content">
        ${data.message || '💡 建议调整坐姿 😊<br>保持健康，轻松工作'}
      </div>
    `;

    // 添加样式
    this.addTooltipStyles();
    
    // 添加到页面
    document.body.appendChild(this.tooltipContainer);

    // 自动移除
    const duration = data.duration || 3000;
    setTimeout(() => {
      this.hideGentleTooltip();
    }, duration);
  }

  private hideGentleTooltip() {
    if (this.tooltipContainer) {
      this.tooltipContainer.style.opacity = '0';
      setTimeout(() => {
        if (this.tooltipContainer && this.tooltipContainer.parentNode) {
          this.tooltipContainer.parentNode.removeChild(this.tooltipContainer);
        }
        this.tooltipContainer = null;
      }, 300);
    }
  }

  private addTooltipStyles() {
    if (!document.getElementById('posture-tooltip-styles')) {
      const styles = document.createElement('style');
      styles.id = 'posture-tooltip-styles';
      styles.textContent = `
        .gentle-posture-tooltip {
          position: fixed;
          top: 60px;
          right: 20px;
          z-index: 10000;
          background: rgba(16, 185, 129, 0.95);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          transform: translateX(100%);
          animation: gentleSlideIn 0.5s ease-out forwards;
          pointer-events: none;
          max-width: 280px;
        }
        
        .tooltip-content {
          text-align: center;
        }
        
        @keyframes gentleSlideIn {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // 处理音频提醒
  private handleAudioReminder(data: { status: PostureStatus; soundName: string; volume: number }) {
    console.log('开始播放提醒音效:', data);
    
    try {
      // 检查瀏覽器支持
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.error('瀏覽器不支持 Web Audio API');
        return;
      }

      // 創建音頻上下文
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // 如果音頻上下文被暫停，嘗試恢復
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('音頻上下文已恢復');
          this.playReminderTone(audioContext, data);
        }).catch((error) => {
          console.error('恢復音頻上下文失敗:', error);
        });
      } else {
        this.playReminderTone(audioContext, data);
      }
      
    } catch (error) {
      console.error('播放提醒音效失敗:', error);
    }
  }

  // 播放提醒音调
  private playReminderTone(audioContext: AudioContext, data: { soundName: string; volume: number; status: PostureStatus }) {
    try {
      const duration = 1.5; // 提醒音效持续1.5秒
      const volume = Math.min(Math.max(data.volume || 0.3, 0.1), 1.0);
      
      // 根據聲音名稱選擇不同的音調
      let frequency1 = 440; // A4
      let frequency2 = 880; // A5
      let waveType: OscillatorType = 'sine';
      
      // 修正：使用HTML中的實際選項值
      switch (data.soundName) {
        case 'gentle-chime': // 轻柔铃声
          frequency1 = 349; // F4
          frequency2 = 523; // C5
          waveType = 'sine';
          console.log('播放：轻柔铃声');
          break;
        case 'soft-bell': // 柔和钟声
          frequency1 = 440; // A4
          frequency2 = 659; // E5
          waveType = 'triangle';
          console.log('播放：柔和钟声');
          break;
        case 'nature-ding': // 自然叮声
          frequency1 = 523; // C5
          frequency2 = 784; // G5
          waveType = 'square';
          console.log('播放：自然叮声');
          break;
        default:
          console.log('播放：默認音效');
          break;
      }
      
      console.log('提醒音效參數:', { 
        soundName: data.soundName,
        frequency1, 
        frequency2, 
        volume, 
        duration, 
        waveType,
        status: data.status
      });
      
      // 創建增益節點用於音量控制
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1); // 淡入
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + duration - 0.3);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration); // 淡出
      
      // 創建和配置振盪器
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      
      oscillator1.type = waveType;
      oscillator2.type = waveType;
      oscillator1.frequency.setValueAtTime(frequency1, audioContext.currentTime);
      oscillator2.frequency.setValueAtTime(frequency2, audioContext.currentTime);
      
      // 連接音頻節點
      const merger = audioContext.createChannelMerger(2);
      oscillator1.connect(merger, 0, 0);
      oscillator2.connect(merger, 0, 1);
      merger.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 播放音調
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + duration);
      oscillator2.stop(audioContext.currentTime + duration);
      
      console.log('✅ 提醒音效播放成功');
      
    } catch (error) {
      console.error('播放提醒音調失敗:', error);
    }
  }
}

// 模式检测器
class ModeDetector {
  private currentMode: UsageMode = UsageMode.COMPUTER_WORK;

  constructor() {
    this.detectInitialMode();
    this.startModeDetection();
  }

  private detectInitialMode() {
    // 检测初始模式
    const isActive = document.hasFocus() && document.visibilityState === 'visible';
    this.currentMode = isActive ? UsageMode.COMPUTER_WORK : UsageMode.STUDY_READING;
    
    this.notifyModeChange(this.currentMode);
  }

  private startModeDetection() {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      const newMode = document.visibilityState === 'visible' 
        ? UsageMode.COMPUTER_WORK 
        : UsageMode.STUDY_READING;
      
      if (newMode !== this.currentMode) {
        this.currentMode = newMode;
        this.notifyModeChange(newMode);
      }
    });

    // 监听窗口焦点变化
    window.addEventListener('focus', () => {
      if (this.currentMode !== UsageMode.COMPUTER_WORK) {
        this.currentMode = UsageMode.COMPUTER_WORK;
        this.notifyModeChange(this.currentMode);
      }
    });

    window.addEventListener('blur', () => {
      if (this.currentMode !== UsageMode.STUDY_READING) {
        this.currentMode = UsageMode.STUDY_READING;
        this.notifyModeChange(this.currentMode);
      }
    });
  }

  private notifyModeChange(mode: UsageMode) {
    chrome.runtime.sendMessage({
      type: 'UPDATE_USAGE_MODE',
      data: mode,
      timestamp: Date.now()
    }).catch(() => {
      // 忽略发送失败
    });
  }
}

// 导出 onExecute 函数供 CRXJS 使用
export function onExecute() {
  console.log('🚀 Content Script onExecute 被调用');
  console.log('📍 当前页面URL:', window.location.href);
  console.log('📍 文档状态:', document.readyState);
  console.log('📍 页面可见性:', document.visibilityState);
  console.log('📍 Chrome扩展API可用:', typeof chrome !== 'undefined');
  console.log('📍 Chrome runtime可用:', typeof chrome?.runtime !== 'undefined');
  
  // 立即尝试启动系统
  try {
    initializeContentScript();
  } catch (error) {
    console.error('❌ onExecute中启动失败:', error);
    console.error('❌ 错误堆栈:', error instanceof Error ? error.stack : error);
    
    // 设置错误状态到全局
    (window as any).postureGuardianContentScript = {
      version: '0.1.0',
      loadTime: new Date().toISOString(),
      initialized: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// 初始化所有系统
function initializeContentScript() {
  console.log('🔄 开始初始化Content Script系统...');
  
  // 等待页面加载完成
  if (document.readyState === 'loading') {
    console.log('📄 文档正在加载，等待DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('📄 DOMContentLoaded事件触发');
      startSystems();
    });
  } else {
    console.log('📄 文档已加载完成，直接启动系统');
    startSystems();
  }
}

function startSystems() {
  console.log('✨ 启动Content Script系统...');
  console.log('🌍 当前环境:', {
    url: window.location.href,
    readyState: document.readyState,
    visibilityState: document.visibilityState,
    hasFocus: document.hasFocus(),
    timestamp: new Date().toISOString()
  });
  
  try {
    // 设置全局标识符，方便测试检测
    (window as any).postureGuardianContentScript = {
      version: '0.1.0',
      loadTime: new Date().toISOString(),
      initialized: true
    };
    console.log('🏷️ 全局标识符已设置');
    
    // 初始化原有系统
    console.log('🔧 初始化ActivityDetector...');
    new ActivityDetector();
    
    console.log('🔧 初始化GentleReminderSystem...');
    new GentleReminderSystem();
    
    console.log('🔧 初始化ModeDetector...');
    new ModeDetector();
    
    // 初始化新的姿势监控系统
    console.log('🔧 初始化姿势监控入口...');
    const postureMonitoringEntry = initializePostureMonitoringEntry();
    console.log('✅ 姿势监控入口已创建:', postureMonitoringEntry);
    
    // 自动初始化并启动监控
    console.log('🚀 准备自动初始化姿势监控...');
    setTimeout(async () => {
      try {
        console.log('🔄 开始直接调用初始化方法...');
        
        // 直接调用初始化方法，不通过消息传递
        const initSuccess = await postureMonitoringEntry.directInitialize();
        console.log('📊 直接初始化结果:', initSuccess);
        
        if (initSuccess) {
          console.log('✅ 姿势监控初始化成功，准备启动监控...');
          
          // 延迟一下再启动监控，确保初始化完成
          setTimeout(async () => {
            try {
              console.log('🚀 开始启动姿势监控...');
              const startSuccess = await postureMonitoringEntry.directStart();
              console.log('📊 直接启动结果:', startSuccess);
              
              if (startSuccess) {
                console.log('🎉 姿势监控已成功启动');
              } else {
                console.error('❌ 姿势监控启动失败');
              }
            } catch (error) {
              console.error('❌ 启动姿势监控时发生错误:', error);
            }
          }, 1000);
          
        } else {
          console.error('❌ 姿势监控初始化失败');
        }
      } catch (error) {
        console.error('❌ 初始化姿势监控时发生错误:', error);
      }
    }, 2000); // 等待2秒让页面完全加载
    
    console.log('🎉 Content Script系统启动完成');
  } catch (error) {
    console.error('❌ Content Script启动失败:', error);
  }
}

// 立即执行初始化（作为备选方案）
console.log('🔥 Content Script文件已加载，立即尝试初始化...');
initializeContentScript(); 