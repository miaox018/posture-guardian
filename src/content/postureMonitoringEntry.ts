import { PostureMonitoringService } from '@shared/services/postureMonitoringService';
import { PostureDetectionResult, PostureStatus, ChromeMessage } from '@shared/types';

// 内容脚本中的姿势监控入口
class PostureMonitoringEntry {
  private monitoringService: PostureMonitoringService | null = null;
  private isInitialized = false;

  constructor() {
    this.setupMessageListener();
    console.log('姿势监控入口初始化完成');
  }

  // 设置消息监听器
  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
      console.log('🔵 监控入口收到消息:', message.type, message);

      switch (message.type) {
        case 'INITIALIZE_POSTURE_MONITORING':
          console.log('🚀 开始初始化姿势监控...');
          this.initializeMonitoring().then(success => {
            console.log('📋 初始化结果:', success);
            sendResponse({ success });
          }).catch(error => {
            console.error('❌ 初始化过程中发生错误:', error);
            sendResponse({ success: false, error: error.message });
          });
          break;

        case 'START_POSTURE_MONITORING':
          console.log('▶️ 开始启动姿势监控...');
          this.startMonitoring().then(success => {
            console.log('📋 启动结果:', success);
            sendResponse({ success });
          }).catch(error => {
            console.error('❌ 启动过程中发生错误:', error);
            sendResponse({ success: false, error: error.message });
          });
          break;

        case 'STOP_POSTURE_MONITORING':
          console.log('⏹️ 停止姿势监控...');
          this.stopMonitoring();
          sendResponse({ success: true });
          break;

        case 'PAUSE_POSTURE_MONITORING':
          console.log('⏸️ 暂停姿势监控...');
          this.pauseMonitoring();
          sendResponse({ success: true });
          break;

        case 'RESUME_POSTURE_MONITORING':
          console.log('▶️ 恢复姿势监控...');
          this.resumeMonitoring().then(success => {
            console.log('📋 恢复结果:', success);
            sendResponse({ success });
          }).catch(error => {
            console.error('❌ 恢复过程中发生错误:', error);
            sendResponse({ success: false, error: error.message });
          });
          break;

        case 'GET_MONITORING_STATUS':
          const status = this.getMonitoringStatus();
          console.log('📊 当前监控状态:', status);
          sendResponse(status);
          break;

        case 'UPDATE_MONITORING_SETTINGS':
          console.log('⚙️ 更新监控设置:', message.data);
          this.updateSettings(message.data);
          sendResponse({ success: true });
          break;

        case 'TRIGGER_GENTLE_POPUP':
          console.log('💬 显示温和提醒:', message.data);
          this.showGentleReminder(message.data);
          sendResponse({ success: true });
          break;

        case 'TRIGGER_AUDIO_REMINDER':
          console.log('🔊 播放音频提醒:', message.data);
          this.playAudioReminder(message.data);
          sendResponse({ success: true });
          break;

        default:
          console.warn('⚠️ 未知消息类型:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }

      return true; // 保持消息通道开放
    });
  }

  // 初始化监控服务
  private async initializeMonitoring(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('监控服务已初始化');
      return true;
    }

    try {
      this.monitoringService = new PostureMonitoringService();
      
      // 设置事件回调
      this.monitoringService.setOnPostureChange(this.handlePostureChange.bind(this));
      this.monitoringService.setOnReminderTriggered(this.handleReminderTriggered.bind(this));
      this.monitoringService.setOnError(this.handleMonitoringError.bind(this));

      // 初始化服务
      const success = await this.monitoringService.initialize();
      
      if (success) {
        this.isInitialized = true;
        console.log('姿势监控服务初始化成功');
        
        // 通知background script
        chrome.runtime.sendMessage({
          type: 'POSTURE_MONITORING_INITIALIZED',
          timestamp: Date.now()
        }).catch(() => {});
        
        return true;
      } else {
        console.error('姿势监控服务初始化失败');
        return false;
      }

    } catch (error) {
      console.error('初始化监控服务时发生错误:', error);
      return false;
    }
  }

  // 开始监控
  private async startMonitoring(): Promise<boolean> {
    if (!this.isInitialized || !this.monitoringService) {
      console.log('请先初始化监控服务');
      return false;
    }

    try {
      const success = await this.monitoringService.startMonitoring();
      
      if (success) {
        console.log('姿势监控已开始');
      } else {
        console.error('启动姿势监控失败');
      }
      
      return success;
    } catch (error) {
      console.error('启动监控时发生错误:', error);
      return false;
    }
  }

  // 停止监控
  private stopMonitoring() {
    if (this.monitoringService) {
      this.monitoringService.stopMonitoring();
      console.log('姿势监控已停止');
    }
  }

  // 暂停监控
  private pauseMonitoring() {
    if (this.monitoringService) {
      this.monitoringService.pauseMonitoring();
      console.log('姿势监控已暂停');
    }
  }

  // 恢复监控
  private async resumeMonitoring(): Promise<boolean> {
    if (!this.monitoringService) return false;

    try {
      await this.monitoringService.resumeMonitoring();
      console.log('姿势监控已恢复');
      return true;
    } catch (error) {
      console.error('恢复监控时发生错误:', error);
      return false;
    }
  }

  // 获取监控状态
  private getMonitoringStatus() {
    if (!this.monitoringService) {
      return {
        isInitialized: false,
        isMonitoring: false,
        cameraReady: false,
        detectorReady: false
      };
    }

    return {
      isInitialized: this.isInitialized,
      ...this.monitoringService.getMonitoringStatus()
    };
  }

  // 更新设置
  private async updateSettings(settings: any) {
    if (this.monitoringService) {
      await this.monitoringService.updateSettings(settings);
      console.log('监控设置已更新');
    }
  }

  // 处理姿势变化
  private handlePostureChange(result: PostureDetectionResult) {
    console.log('姿势状态:', result.status, '置信度:', result.confidence);
    
    // 发送结果到background script（已在服务内部处理，这里可以添加额外逻辑）
    // 比如更新页面上的可视化指示器等
  }

  // 处理提醒触发
  private handleReminderTriggered(level: number, status: PostureStatus) {
    console.log(`触发${level}级提醒，状态:`, status);
    
    // 可以在这里添加页面级的提醒效果
    // 比如轻微的页面闪烁、视觉提示等
  }

  // 处理监控错误
  private handleMonitoringError(error: string) {
    console.error('监控错误:', error);
    
    // 通知用户错误信息
    this.showErrorNotification(error);
  }

  // 显示温和提醒
  private showGentleReminder(data: { message: string; status: PostureStatus; enhanced?: boolean }) {
    // 创建温和的提醒元素
    const reminder = document.createElement('div');
    reminder.className = data.enhanced ? 'posture-enhanced-reminder' : 'posture-gentle-reminder';
    
    // 处理多行消息
    const formattedMessage = data.message.replace(/\n/g, '<br>');
    
    reminder.innerHTML = `
      <div class="reminder-content">
        <div class="reminder-icon">${data.enhanced ? '🚨' : '💡'}</div>
        <div class="reminder-message">${formattedMessage}</div>
      </div>
    `;

    // 添加样式
    this.addReminderStyles();
    
    // 显示提醒
    document.body.appendChild(reminder);

    // 强化模式显示更长时间
    const duration = data.enhanced ? 5000 : 3000;
    setTimeout(() => {
      if (reminder.parentNode) {
        reminder.style.opacity = '0';
        setTimeout(() => {
          if (reminder.parentNode) {
            reminder.parentNode.removeChild(reminder);
          }
        }, 300);
      }
    }, duration);
  }

  // 播放音频提醒
  private playAudioReminder(data: { soundName: string; volume: number; status: PostureStatus }) {
    console.log('开始播放音频提醒:', data);
    
    try {
      // 检查浏览器支持
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.error('浏览器不支持 Web Audio API');
        this.fallbackAudioReminder();
        return;
      }

      // 创建音频上下文
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // 如果音频上下文被暂停，尝试恢复
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('音频上下文已恢复');
          this.playTone(audioContext, data);
        }).catch((error) => {
          console.error('恢复音频上下文失败:', error);
          this.fallbackAudioReminder();
        });
      } else {
        this.playTone(audioContext, data);
      }
      
    } catch (error) {
      console.error('播放音效失败:', error);
      this.fallbackAudioReminder();
    }
  }

  // 播放音调的核心方法
  private playTone(audioContext: AudioContext, data: { soundName: string; volume: number; status: PostureStatus }) {
    try {
      const duration = 0.8; // 增加持续时间
      const volume = Math.min(Math.max(data.volume || 0.3, 0.1), 1.0); // 确保音量在合理范围
      
      // 根据状态调整音调和音效
      let frequency1 = 440; // A4
      let frequency2 = 880; // A5
      let waveType: OscillatorType = 'sine';
      
      if (data.status === PostureStatus.DANGER) {
        frequency1 = 523; // C5
        frequency2 = 1047; // C6 
        waveType = 'triangle'; // 更紧急的音色
      } else if (data.status === PostureStatus.WARNING) {
        frequency1 = 349; // F4
        frequency2 = 698; // F5
        waveType = 'sine';
      }
      
      console.log('播放参数:', { frequency1, frequency2, volume, duration, waveType });
      
      // 创建增益节点用于音量控制
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05); // 淡入
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + duration - 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration); // 淡出
      
      // 创建和配置振荡器
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      
      oscillator1.type = waveType;
      oscillator2.type = waveType;
      oscillator1.frequency.setValueAtTime(frequency1, audioContext.currentTime);
      oscillator2.frequency.setValueAtTime(frequency2, audioContext.currentTime);
      
      // 连接音频节点
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 播放音效
      const startTime = audioContext.currentTime;
      oscillator1.start(startTime);
      oscillator2.start(startTime);
      oscillator1.stop(startTime + duration);
      oscillator2.stop(startTime + duration);
      
      console.log('音效播放成功');
      
      // 清理资源
      setTimeout(() => {
        try {
          gainNode.disconnect();
          audioContext.close();
        } catch (e) {
          // 忽略清理错误
        }
      }, (duration + 0.1) * 1000);
      
    } catch (error) {
      console.error('播放音调失败:', error);
      this.fallbackAudioReminder();
    }
  }

  // 后备音频提醒方案
  private fallbackAudioReminder() {
    console.log('使用后备音频方案');
    
    try {
      // 方案1：使用系统通知声音
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('姿势提醒', {
          body: '请注意调整坐姿',
          icon: '/icons/icon48.png',
          silent: false, // 允许声音
          tag: 'posture-reminder'
        });
        
        // 快速关闭通知，只保留声音
        setTimeout(() => {
          notification.close();
        }, 1000);
        
        console.log('使用系统通知声音');
        return;
      }
      
      // 方案2：使用简单的beep
      const audioElement = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwMZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+PyvmEfCEOa3PDGeSsFJHfH8N2QQAoUXrTp66hVFApGn+PyvmEfCEOa3PEZ');
      audioElement.volume = 0.3;
      audioElement.play().catch(() => {
        console.log('后备音频方案也失败了');
      });
      
    } catch (error) {
      console.error('后备音频方案失败:', error);
    }
  }

  // 显示错误通知
  private showErrorNotification(error: string) {
    // 创建简单的错误通知
    const notification = document.createElement('div');
    notification.className = 'posture-error-notification';
    notification.textContent = `姿势监控: ${error}`;
    
    // 添加样式
    this.addErrorNotificationStyles();
    
    document.body.appendChild(notification);

    // 5秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // 添加提醒样式
  private addReminderStyles() {
    if (!document.getElementById('posture-reminder-styles')) {
      const styles = document.createElement('style');
      styles.id = 'posture-reminder-styles';
      styles.textContent = `
        .posture-gentle-reminder {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          background: rgba(16, 185, 129, 0.95);
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          max-width: 320px;
          opacity: 1;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        
        .posture-enhanced-reminder {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10001;
          background: rgba(239, 68, 68, 0.98);
          color: white;
          padding: 24px 28px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(239, 68, 68, 0.3);
          backdrop-filter: blur(15px);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 16px;
          max-width: 400px;
          text-align: center;
          opacity: 1;
          transition: opacity 0.3s ease;
          pointer-events: none;
          border: 2px solid rgba(255, 255, 255, 0.3);
          animation: enhancedPulse 2s infinite ease-in-out;
        }
        
        .reminder-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .posture-enhanced-reminder .reminder-content {
          flex-direction: column;
          gap: 16px;
          text-align: center;
        }
        
        .reminder-icon {
          font-size: 24px;
        }
        
        .posture-enhanced-reminder .reminder-icon {
          font-size: 36px;
          animation: enhancedIconPulse 1s infinite ease-in-out;
        }
        
        .reminder-message {
          line-height: 1.4;
        }
        
        .posture-enhanced-reminder .reminder-message {
          line-height: 1.6;
          font-weight: 600;
        }
        
        @keyframes enhancedPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 20px 60px rgba(239, 68, 68, 0.3);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.02);
            box-shadow: 0 25px 80px rgba(239, 68, 68, 0.4);
          }
        }
        
        @keyframes enhancedIconPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // 添加错误通知样式
  private addErrorNotificationStyles() {
    if (!document.getElementById('posture-error-styles')) {
      const styles = document.createElement('style');
      styles.id = 'posture-error-styles';
      styles.textContent = `
        .posture-error-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 10000;
          background: #EF4444;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
          max-width: 300px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // 清理资源
  dispose() {
    if (this.monitoringService) {
      this.monitoringService.dispose();
      this.monitoringService = null;
    }
    
    this.isInitialized = false;
    console.log('姿势监控入口已清理');
  }

  // 新增：直接初始化方法（不通过消息传递）
  async directInitialize(): Promise<boolean> {
    console.log('🔄 直接调用初始化...');
    return await this.initializeMonitoring();
  }

  // 新增：直接启动方法（不通过消息传递）
  async directStart(): Promise<boolean> {
    console.log('🔄 直接调用启动...');
    return await this.startMonitoring();
  }
}

// 创建全局实例
let postureMonitoringEntry: PostureMonitoringEntry | null = null;

// 初始化入口
function initializePostureMonitoringEntry() {
  if (!postureMonitoringEntry) {
    postureMonitoringEntry = new PostureMonitoringEntry();
  }
  return postureMonitoringEntry;
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  if (postureMonitoringEntry) {
    postureMonitoringEntry.dispose();
    postureMonitoringEntry = null;
  }
});

// 导出初始化函数
export { initializePostureMonitoringEntry }; 