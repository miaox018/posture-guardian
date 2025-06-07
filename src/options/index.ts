import { UsageMode, UserSettings } from '@shared/types';

// 默认设置
const defaultSettings: UserSettings = {
  usageMode: UsageMode.COMPUTER_WORK,
  reminderSound: 'gentle-chime',
  reminderVolume: 0.3,
  confirmModeSwitch: true,
  enableLightDetection: true,
  lightThreshold: 150,
  postureThreshold: {
    headTilt: 15,
    shoulderTilt: 8
  },
  cooldownPeriod: 5,
  detectionInterval: 5,
  language: 'zh-CN',
  reminderTiming: {
    firstWarningDelay: 5,    // 5秒后第一次提醒
    secondWarningDelay: 5,   // 再5秒后第二次提醒
    cooldownPeriod: 5        // 5分钟冷却期
  }
};

class SettingsManager {
  private currentSettings: UserSettings = { ...defaultSettings };

  constructor() {
    this.loadSettings();
    this.initializeUI();
    this.bindEvents();
  }

  // 加载设置
  private async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(Object.keys(defaultSettings));
      this.currentSettings = { ...defaultSettings, ...result };
      this.updateUI();
      console.log('设置加载完成:', this.currentSettings);
    } catch (error) {
      console.error('加载设置失败:', error);
      this.currentSettings = { ...defaultSettings };
      this.updateUI();
    }
  }

  // 保存设置
  private async saveSettings() {
    try {
      await chrome.storage.sync.set(this.currentSettings);
      this.showNotification('设置已保存', 'success');
      
      // 通知background script设置已更新
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        data: this.currentSettings
      });
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showNotification('保存失败，请重试', 'error');
    }
  }

  // 初始化UI
  private initializeUI() {
    // 使用场景选择器
    this.initUsageModeSelector();
    
    // 声音设置
    this.initSoundSettings();
    
    // 其他设置
    this.initOtherSettings();
  }

  // 初始化使用场景选择器
  private initUsageModeSelector() {
    const selector = document.getElementById('usage-mode-selector');
    if (!selector) return;

    const modeCards = selector.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
      card.addEventListener('click', () => {
        // 移除其他选中状态
        modeCards.forEach(c => c.classList.remove('selected'));
        // 添加选中状态
        card.classList.add('selected');
        
        // 更新设置
        const mode = card.getAttribute('data-mode') as UsageMode;
        this.currentSettings.usageMode = mode;
      });
    });
  }

  // 初始化声音设置
  private initSoundSettings() {
    // 音效选择
    const soundSelect = document.getElementById('reminder-sound') as HTMLSelectElement;
    if (soundSelect) {
      soundSelect.addEventListener('change', () => {
        this.currentSettings.reminderSound = soundSelect.value;
      });
    }

    // 音量滑块
    const volumeSlider = document.getElementById('reminder-volume') as HTMLInputElement;
    const volumeDisplay = document.getElementById('volume-display');
    if (volumeSlider && volumeDisplay) {
      volumeSlider.addEventListener('input', () => {
        const volume = parseInt(volumeSlider.value) / 100;
        this.currentSettings.reminderVolume = volume;
        volumeDisplay.textContent = `${volumeSlider.value}%`;
      });
    }

    // 试听按钮
    const testSoundBtn = document.getElementById('test-sound');
    if (testSoundBtn) {
      testSoundBtn.addEventListener('click', () => {
        this.testSound();
      });
    }
  }

  // 初始化其他设置
  private initOtherSettings() {
    // 环境光检测
    const lightDetectionCheckbox = document.getElementById('enable-light-detection') as HTMLInputElement;
    if (lightDetectionCheckbox) {
      lightDetectionCheckbox.addEventListener('change', () => {
        this.currentSettings.enableLightDetection = lightDetectionCheckbox.checked;
      });
    }

    // 模式切换确认
    const modeSwitchCheckbox = document.getElementById('confirm-mode-switch') as HTMLInputElement;
    if (modeSwitchCheckbox) {
      modeSwitchCheckbox.addEventListener('change', () => {
        this.currentSettings.confirmModeSwitch = modeSwitchCheckbox.checked;
      });
    }

    // 敏感度滑块
    const sensitivitySlider = document.getElementById('posture-sensitivity') as HTMLInputElement;
    const sensitivityDisplay = document.getElementById('sensitivity-display');
    if (sensitivitySlider && sensitivityDisplay) {
      sensitivitySlider.addEventListener('input', () => {
        const value = parseInt(sensitivitySlider.value);
        sensitivityDisplay.textContent = this.getSensitivityText(value);
        
        // 根据敏感度调整阈值
        this.currentSettings.postureThreshold = {
          headTilt: 25 - (value * 2), // 值越高，阈值越低（越敏感）
          shoulderTilt: 15 - value
        };
      });
    }

    // 检测间隔
    const detectionInterval = document.getElementById('detection-interval') as HTMLSelectElement;
    if (detectionInterval) {
      detectionInterval.addEventListener('change', () => {
        // 保存檢測間隔設置
        this.currentSettings.detectionInterval = parseInt(detectionInterval.value);
        console.log('檢測間隔已更新為:', this.currentSettings.detectionInterval, '秒');
      });
    }

    // 冷却时间
    const cooldownPeriod = document.getElementById('cooldown-period') as HTMLSelectElement;
    if (cooldownPeriod) {
      cooldownPeriod.addEventListener('change', () => {
        this.currentSettings.cooldownPeriod = parseInt(cooldownPeriod.value);
      });
    }

    // 第一次提醒延迟
    const firstWarningDelay = document.getElementById('first-warning-delay') as HTMLSelectElement;
    if (firstWarningDelay) {
      firstWarningDelay.addEventListener('change', () => {
        this.currentSettings.reminderTiming.firstWarningDelay = parseInt(firstWarningDelay.value);
        console.log('第一次提醒延迟已更新为:', this.currentSettings.reminderTiming.firstWarningDelay, '秒');
      });
    }

    // 第二次提醒延迟
    const secondWarningDelay = document.getElementById('second-warning-delay') as HTMLSelectElement;
    if (secondWarningDelay) {
      secondWarningDelay.addEventListener('change', () => {
        this.currentSettings.reminderTiming.secondWarningDelay = parseInt(secondWarningDelay.value);
        console.log('第二次提醒延迟已更新为:', this.currentSettings.reminderTiming.secondWarningDelay, '秒');
      });
    }
  }

  // 绑定事件
  private bindEvents() {
    // 保存设置按钮
    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    // 重置设置按钮
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetSettings();
      });
    }

    // 导出数据按钮
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportData();
      });
    }
  }

  // 更新UI显示
  private updateUI() {
    // 更新使用模式选择
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
      card.classList.remove('selected');
      if (card.getAttribute('data-mode') === this.currentSettings.usageMode) {
        card.classList.add('selected');
      }
    });

    // 更新音效选择
    const soundSelect = document.getElementById('reminder-sound') as HTMLSelectElement;
    if (soundSelect) {
      soundSelect.value = this.currentSettings.reminderSound;
    }

    // 更新音量
    const volumeSlider = document.getElementById('reminder-volume') as HTMLInputElement;
    const volumeDisplay = document.getElementById('volume-display');
    if (volumeSlider && volumeDisplay) {
      const volumePercent = Math.round(this.currentSettings.reminderVolume * 100);
      volumeSlider.value = volumePercent.toString();
      volumeDisplay.textContent = `${volumePercent}%`;
    }

    // 更新检测间隔
    const detectionInterval = document.getElementById('detection-interval') as HTMLSelectElement;
    if (detectionInterval) {
      detectionInterval.value = this.currentSettings.detectionInterval.toString();
      console.log('UI更新檢測間隔顯示:', this.currentSettings.detectionInterval);
    }

    // 更新复选框
    const lightDetectionCheckbox = document.getElementById('enable-light-detection') as HTMLInputElement;
    if (lightDetectionCheckbox) {
      lightDetectionCheckbox.checked = this.currentSettings.enableLightDetection;
    }

    const modeSwitchCheckbox = document.getElementById('confirm-mode-switch') as HTMLInputElement;
    if (modeSwitchCheckbox) {
      modeSwitchCheckbox.checked = this.currentSettings.confirmModeSwitch;
    }

    // 更新冷却时间
    const cooldownPeriod = document.getElementById('cooldown-period') as HTMLSelectElement;
    if (cooldownPeriod) {
      cooldownPeriod.value = this.currentSettings.cooldownPeriod.toString();
    }

    // 更新第一次提醒延迟
    const firstWarningDelay = document.getElementById('first-warning-delay') as HTMLSelectElement;
    if (firstWarningDelay) {
      firstWarningDelay.value = this.currentSettings.reminderTiming.firstWarningDelay.toString();
    }

    // 更新第二次提醒延迟  
    const secondWarningDelay = document.getElementById('second-warning-delay') as HTMLSelectElement;
    if (secondWarningDelay) {
      secondWarningDelay.value = this.currentSettings.reminderTiming.secondWarningDelay.toString();
    }

    // 更新敏感度（根据头部倾斜阈值计算）
    const sensitivitySlider = document.getElementById('posture-sensitivity') as HTMLInputElement;
    const sensitivityDisplay = document.getElementById('sensitivity-display');
    if (sensitivitySlider && sensitivityDisplay) {
      const sensitivity = Math.round((25 - this.currentSettings.postureThreshold.headTilt) / 2);
      sensitivitySlider.value = sensitivity.toString();
      sensitivityDisplay.textContent = this.getSensitivityText(sensitivity);
    }
  }

  // 获取敏感度文字描述
  private getSensitivityText(value: number): string {
    if (value <= 2) return '较低';
    if (value <= 4) return '偏低';
    if (value <= 6) return '中等';
    if (value <= 8) return '偏高';
    return '很高';
  }

  // 测试音效
  private async testSound() {
    console.log('開始播放測試音效...', this.currentSettings.reminderSound);
    
    try {
      // 直接在選項頁面播放音效，不依賴Content Script
      this.playTestSoundDirect();
      
    } catch (error) {
      console.error('播放测试音效失败:', error);
      
      // 如果直接播放失敗，嘗試通過Content Script
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          await chrome.tabs.sendMessage(tabs[0].id, {
            type: 'PLAY_REMINDER_SOUND',
            data: {
              soundName: this.currentSettings.reminderSound,
              volume: this.currentSettings.reminderVolume
            }
          });
          this.showNotification('音效測試完成 🔊', 'success');
        } else {
          throw new Error('無法找到活動標籤頁');
        }
      } catch (messageError) {
        console.error('通過Content Script播放失敗:', messageError);
        this.showNotification('無法播放音效。請確保：\n1. 允許聲音權限\n2. 在普通網頁中測試', 'warning');
      }
    }
  }

  // 直接播放測試音效（不依賴Content Script）
  private playTestSoundDirect() {
    console.log('直接播放測試音效...');
    
    // 檢查瀏覽器支持
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      throw new Error('瀏覽器不支持 Web Audio API');
    }

    // 創建音頻上下文
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    
    // 播放測試音調
    this.playTestToneInOptions(audioContext);
    
    this.showNotification('音效測試完成 🔊', 'success');
  }

  // 在選項頁面播放測試音調
  private playTestToneInOptions(audioContext: AudioContext) {
    const duration = 1.0;
    const volume = Math.min(Math.max(this.currentSettings.reminderVolume, 0.1), 1.0);
    
    // 根據聲音名稱選擇不同的音調
    let frequency1 = 440; // A4
    let frequency2 = 880; // A5
    let waveType: OscillatorType = 'sine';
    
    // 修正：使用HTML中的實際選項值
    switch (this.currentSettings.reminderSound) {
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
    
    console.log('播放參數:', { 
      soundName: this.currentSettings.reminderSound,
      frequency1, 
      frequency2, 
      volume, 
      duration, 
      waveType 
    });
    
    // 創建增益節點
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + duration - 0.2);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    
    // 創建振盪器
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
    
    console.log('測試音效播放完成');
  }

  // 重置设置
  private resetSettings() {
    if (confirm('确定要恢复默认设置吗？这将清除所有自定义配置。')) {
      this.currentSettings = { ...defaultSettings };
      this.updateUI();
      this.showNotification('设置已重置为默认值', 'info');
    }
  }

  // 导出数据
  private async exportData() {
    try {
      const exportData = {
        settings: this.currentSettings,
        exportTime: new Date().toISOString(),
        version: '0.1.0'
      };

      // 创建下载链接
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `posture-guardian-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      this.showNotification('设置已导出', 'success');
    } catch (error) {
      console.error('导出数据失败:', error);
      this.showNotification('导出失败，请重试', 'error');
    }
  }

  // 显示通知
  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    // 根据类型设置颜色
    switch (type) {
      case 'success':
        notification.style.background = '#10B981';
        break;
      case 'error':
        notification.style.background = '#EF4444';
        break;
      case 'warning':
        notification.style.background = '#F59E0B';
        break;
      default:
        notification.style.background = '#3B82F6';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);

    // 添加动画样式
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(styles);
    }
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new SettingsManager();
  console.log('设置页面初始化完成');
}); 