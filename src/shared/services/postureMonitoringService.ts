import { PostureDetector } from '@shared/utils/postureDetector';
import { CameraManager } from '@shared/utils/cameraManager';
import { PostureDetectionResult, PostureStatus, UsageMode, UserSettings, PostureAdviceMap } from '@shared/types';

// 姿势监控服务
export class PostureMonitoringService {
  private postureDetector: PostureDetector;
  private cameraManager: CameraManager;
  private isMonitoring = false;
  private settings: UserSettings | null = null;
  private lastDetectionTime = 0;
  private detectionInterval = 2000; // 2秒检测一次

  // 新的基于时间的提醒状态
  private badPostureStartTime = 0;      // 坏姿势开始时间
  private currentReminderLevel = 0;     // 当前提醒级别 (0=无, 1=图标, 2=弹窗, 3=声音)
  private isInGlobalCooldown = false;   // 是否在全局冷却期
  private cooldownTimeout: NodeJS.Timeout | null = null; // 冷却期定时器

  // 事件回调
  private onPostureChangeCallback?: (result: PostureDetectionResult) => void;
  private onReminderTriggeredCallback?: (level: number, status: PostureStatus) => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    this.postureDetector = new PostureDetector();
    this.cameraManager = new CameraManager();
    this.loadSettings();
  }

  // 加载用户设置
  private async loadSettings() {
    try {
      // 默认设置
      const defaultSettings: UserSettings = {
        usageMode: UsageMode.COMPUTER_WORK,
        reminderSound: 'gentle-chime',
        reminderVolume: 0.3,
        confirmModeSwitch: false,
        enableLightDetection: true,
        lightThreshold: 150,
        postureThreshold: {
          headTilt: 15,
          shoulderTilt: 8
        },
        cooldownPeriod: 5,
        detectionInterval: 2,
        language: 'zh-CN',
        reminderTiming: {
          firstWarningDelay: 5,    // 5秒后第一次提醒
          secondWarningDelay: 5,   // 再5秒后第二次提醒
          cooldownPeriod: 5        // 5分钟冷却期
        }
      };

      const result = await chrome.storage.sync.get(Object.keys(defaultSettings));
      this.settings = { ...defaultSettings, ...result };
      
      // 更新检测间隔
      this.detectionInterval = this.settings.detectionInterval * 1000;
      
      console.log('设置加载完成:', this.settings);
    } catch (error) {
      console.error('加载设置失败:', error);
      // 使用默认设置
      this.settings = {
        usageMode: UsageMode.COMPUTER_WORK,
        reminderSound: 'gentle-chime',
        reminderVolume: 0.3,
        confirmModeSwitch: false,
        enableLightDetection: true,
        lightThreshold: 150,
        postureThreshold: { headTilt: 15, shoulderTilt: 8 },
        cooldownPeriod: 5,
        detectionInterval: 2,
        language: 'zh-CN',
        reminderTiming: {
          firstWarningDelay: 5,
          secondWarningDelay: 5,
          cooldownPeriod: 5
        }
      };
    }
  }

  // 初始化服务
  async initialize(): Promise<boolean> {
    try {
      console.log('🔧 开始初始化姿势监控服务...');
      
      // 确保设置加载完成
      await this.loadSettings();
      console.log('✅ 设置加载完成');
      
      // 初始化摄像头
      console.log('📷 开始初始化摄像头...');
      const cameraInitialized = await this.cameraManager.initialize();
      
      if (!cameraInitialized) {
        console.error('❌ 摄像头初始化失败');
        this.handleError('摄像头初始化失败');
        return false;
      }
      console.log('✅ 摄像头初始化成功');

      // 检查姿势检测器状态
      console.log('🤖 检查姿势检测器状态...');
      console.log('检测器初始化状态:', this.postureDetector.getInitializationStatus());
      
      // 等待姿势检测器初始化
      let retryCount = 0;
      while (!this.postureDetector.getInitializationStatus() && retryCount < 20) {
        console.log(`⏳ 等待姿势检测器初始化... (${retryCount + 1}/20)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retryCount++;
      }

      if (!this.postureDetector.getInitializationStatus()) {
        console.error('❌ 姿势检测器初始化超时');
        this.handleError('姿势检测器初始化超时');
        return false;
      }
      console.log('✅ 姿势检测器初始化成功');

      console.log('🎉 姿势监控服务初始化完成');
      return true;

    } catch (error) {
      console.error('❌ 姿势监控服务初始化失败:', error);
      this.handleError('服务初始化失败: ' + (error as Error).message);
      return false;
    }
  }

  // 开始监控
  async startMonitoring(): Promise<boolean> {
    console.log('🚀 开始启动姿势监控...');
    
    if (this.isMonitoring) {
      console.log('⚠️ 监控已在进行中');
      return true;
    }

    console.log('📋 检查摄像头状态:', this.cameraManager.isReady());
    if (!this.cameraManager.isReady()) {
      console.error('❌ 摄像头未就绪');
      this.handleError('摄像头未就绪');
      return false;
    }

    console.log('📺 获取视频元素...');
    const videoElement = this.cameraManager.getVideoElement();
    if (!videoElement) {
      console.error('❌ 无法获取视频元素');
      this.handleError('无法获取视频元素');
      return false;
    }
    console.log('✅ 视频元素获取成功:', videoElement);

    try {
      console.log('🔍 开始启动姿势检测...');
      
      // 开始姿势检测
      const success = await this.postureDetector.startDetection(
        videoElement,
        this.handlePostureDetectionResult.bind(this)
      );

      if (success) {
        this.isMonitoring = true;
        this.lastDetectionTime = Date.now();
        this.badPostureStartTime = Date.now();
        this.currentReminderLevel = 0;
        
        console.log('🎉 姿势监控启动成功');
        
        // 通知background script
        chrome.runtime.sendMessage({
          type: 'MONITORING_STARTED',
          timestamp: Date.now()
        }).catch(() => {});

        return true;
      } else {
        console.error('❌ 姿势检测启动失败');
        this.handleError('姿势检测启动失败');
        return false;
      }

    } catch (error) {
      console.error('❌ 启动监控失败:', error);
      this.handleError('启动监控失败: ' + (error as Error).message);
      return false;
    }
  }

  // 停止监控
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.postureDetector.stopDetection();
    this.isMonitoring = false;

    console.log('停止姿势监控');

    // 通知background script
    chrome.runtime.sendMessage({
      type: 'MONITORING_STOPPED',
      timestamp: Date.now()
    }).catch(() => {});
  }

  // 处理姿势检测结果
  private handlePostureDetectionResult(result: PostureDetectionResult) {
    const now = Date.now();
    
    // 优化检测间隔：状态良好时1秒，坏姿势时0.5秒，更及时响应
    const adaptiveInterval = result.status === PostureStatus.GOOD ? 1000 : 500;
    if (now - this.lastDetectionTime < adaptiveInterval) {
      return;
    }

    this.lastDetectionTime = now;

    // 放宽置信度要求，让检测更敏感
    if (result.confidence < 0.3) {
      console.log('⚠️ 检测置信度太低，跳过本次结果:', result.confidence.toFixed(2));
      return;
    }

    console.log('✅ 姿势检测结果:', {
      status: result.status,
      headTiltAngle: result.headTiltAngle.toFixed(1) + '°',
      shoulderTiltAngle: result.shoulderTiltAngle.toFixed(1) + '°',
      confidence: (result.confidence * 100).toFixed(1) + '%',
      time: new Date().toLocaleTimeString(),
      interval: adaptiveInterval + 'ms'
    });

    // 处理姿势状态变化
    this.processPostureStatus(result);

    // 通知回调
    if (this.onPostureChangeCallback) {
      this.onPostureChangeCallback(result);
    }

    // 发送结果到background script
    chrome.runtime.sendMessage({
      type: 'POSTURE_DETECTION_RESULT',
      data: {
        status: result.status,
        headTiltAngle: result.headTiltAngle,
        shoulderTiltAngle: result.shoulderTiltAngle,
        confidence: result.confidence,
        timestamp: result.timestamp
      }
    }).catch(() => {});
  }

  // 处理姿势状态
  private processPostureStatus(result: PostureDetectionResult) {
    const { status } = result;
    const now = Date.now();

    // 如果姿势良好
    if (status === PostureStatus.GOOD) {
      // 立即且完全重置所有提醒状态
      this.resetReminderState();
      
      // 发送图标更新（显示良好状态）
      chrome.runtime.sendMessage({
        type: 'TRIGGER_ICON_REMINDER',
        data: { status: PostureStatus.GOOD }
      }).catch(() => {});
      
      console.log('✅ 姿势良好，已重置所有提醒状态');
      return;
    }

    // 坏姿势处理 - 如果在冷却期，跳过所有处理
    if (this.isInGlobalCooldown) {
      console.log('⏰ 全局冷却期中，跳过坏姿势处理');
      return;
    }

    // 第一次检测到坏姿势
    if (this.badPostureStartTime === 0) {
      this.badPostureStartTime = now;
      this.currentReminderLevel = 1; // 立即图标变色
      
      console.log('🔴 检测到坏姿势，立即图标变色');
      chrome.runtime.sendMessage({
        type: 'TRIGGER_ICON_REMINDER',
        data: { status }
      }).catch(() => {});
      
      return;
    }

    // 检查是否需要升级提醒
    this.checkTimeBasedReminder(status, now);
  }

  // 重置提醒状态
  private resetReminderState() {
    this.badPostureStartTime = 0;
    this.currentReminderLevel = 0;
    
    // 清除冷却期定时器
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
      this.cooldownTimeout = null;
    }
    
    this.isInGlobalCooldown = false;
    console.log('🔄 提醒状态已完全重置');
  }

  // 基于时间的提醒检查
  private checkTimeBasedReminder(status: PostureStatus, currentTime: number) {
    if (!this.settings || this.badPostureStartTime === 0) return;

    const badPostureDuration = (currentTime - this.badPostureStartTime) / 1000; // 转换为秒
    const firstWarningDelay = this.settings.reminderTiming.firstWarningDelay;
    const secondWarningDelay = this.settings.reminderTiming.secondWarningDelay;

    console.log('📊 时间基础提醒检查:', {
      mode: this.settings.usageMode,
      badPostureDuration: badPostureDuration.toFixed(1) + 's',
      currentLevel: this.currentReminderLevel,
      firstWarningDelay: firstWarningDelay + 's',
      secondWarningDelay: secondWarningDelay + 's',
      status
    });

    let shouldTriggerReminder = false;
    let reminderLevel = this.currentReminderLevel;

    // 根据模式和时间决定提醒策略
    if (this.settings.usageMode === UsageMode.COMPUTER_WORK) {
      // 💻 电脑工作模式: 图标(立即) → 弹窗(5秒) → 声音(5秒)
      if (badPostureDuration >= firstWarningDelay && this.currentReminderLevel < 3) {
        // 5秒后直接声音提醒（跳过弹窗，避免干扰工作）
        reminderLevel = 3; // 声音提醒
        shouldTriggerReminder = true;
      }
    } else if (this.settings.usageMode === UsageMode.STUDY_READING) {
      // 📚 学习阅读模式: 图标(立即) → 声音(5秒)
      if (badPostureDuration >= firstWarningDelay && this.currentReminderLevel < 3) {
        reminderLevel = 3; // 直接声音提醒
        shouldTriggerReminder = true;
      }
    } else if (this.settings.usageMode === UsageMode.SILENT) {
      // 🔇 静音模式: 图标(立即) → 强化弹窗(5秒)
      if (badPostureDuration >= firstWarningDelay && this.currentReminderLevel < 2) {
        reminderLevel = 2; // 强化弹窗
        shouldTriggerReminder = true;
      }
    }

    console.log('🎯 时间基础提醒决策结果:', {
      shouldTriggerReminder,
      reminderLevel,
      mode: this.settings.usageMode,
      duration: badPostureDuration.toFixed(1) + 's'
    });

    if (shouldTriggerReminder) {
      this.triggerReminder(reminderLevel, status);
      this.currentReminderLevel = reminderLevel;
      
      // 如果达到最高级别，进入全局冷却
      if (reminderLevel === 3 || (this.settings.usageMode === UsageMode.SILENT && reminderLevel === 2)) {
        this.enterGlobalCooldown();
      }
    }
  }

  // 进入全局冷却期
  private enterGlobalCooldown() {
    if (!this.settings) return;
    
    this.isInGlobalCooldown = true;
    const cooldownDuration = this.settings.reminderTiming.cooldownPeriod * 60 * 1000; // 转换为毫秒
    
    console.log('🔄 进入全局冷却期，', this.settings.reminderTiming.cooldownPeriod, '分钟后可再次提醒');
    
    // 使用定时器管理冷却期
    this.cooldownTimeout = setTimeout(() => {
      this.isInGlobalCooldown = false;
      this.badPostureStartTime = 0;
      this.currentReminderLevel = 0;
      this.cooldownTimeout = null;
      console.log('✅ 全局冷却期结束，系统就绪');
    }, cooldownDuration);
  }

  // 触发提醒
  private triggerReminder(level: number, status: PostureStatus) {
    console.log(`触发${level}级提醒，姿势状态:`, status);

    // 通知回调
    if (this.onReminderTriggeredCallback) {
      this.onReminderTriggeredCallback(level, status);
    }

    // 根据提醒级别采取不同行动
    switch (level) {
      case 1:
        // 图标变色
        chrome.runtime.sendMessage({
          type: 'TRIGGER_ICON_REMINDER',
          data: { status }
        }).catch(() => {});
        break;

      case 2:
        // 轻柔弹窗 或 静音模式的强化视觉提醒
        const message = this.settings?.usageMode === UsageMode.SILENT 
          ? this.getEnhancedVisualAdvice(status)  // 静音模式的强化提醒
          : this.getPostureAdvice(status);        // 普通轻柔提醒
        
        chrome.runtime.sendMessage({
          type: 'TRIGGER_GENTLE_POPUP',
          data: { 
            status, 
            message,
            enhanced: this.settings?.usageMode === UsageMode.SILENT  // 标记是否为强化模式
          }
        }).catch(() => {});
        break;

      case 3:
        // 声音提醒（静音模式不会到达这里）
        chrome.runtime.sendMessage({
          type: 'TRIGGER_AUDIO_REMINDER',
          data: { 
            status,
            soundName: this.settings?.reminderSound || 'gentle-chime',
            volume: this.settings?.reminderVolume || 0.3
          }
        }).catch(() => {});
        break;
    }
  }

  // 获取姿势建议
  private getPostureAdvice(status: PostureStatus): string {
    const adviceMap: PostureAdviceMap & { [PostureStatus.GOOD]?: string } = {
      [PostureStatus.WARNING]: '💡 轻微调整：抬起头部，放松肩膀 😊',
      [PostureStatus.DANGER]: '⚠️ 请立即调整坐姿，避免颈椎压力 🙏'
    };

    return adviceMap[status] || '💡 建议调整坐姿 😊';
  }

  // 新增：获取静音模式的强化视觉建议
  private getEnhancedVisualAdvice(status: PostureStatus): string {
    const enhancedAdviceMap: PostureAdviceMap & { [PostureStatus.GOOD]?: string } = {
      [PostureStatus.WARNING]: '🚨 注意姿势！\n💺 调整坐姿，抬头挺胸\n⏰ 已持续较长时间',
      [PostureStatus.DANGER]: '⚠️ 紧急提醒！\n🔴 立即纠正坐姿\n🏥 避免颈椎损伤'
    };

    return enhancedAdviceMap[status] || '🚨 请注意坐姿！';
  }

  // 暂停监控
  pauseMonitoring() {
    if (this.isMonitoring) {
      this.cameraManager.pause();
      this.postureDetector.stopDetection();
    }
  }

  // 恢复监控
  async resumeMonitoring() {
    if (this.isMonitoring) {
      this.cameraManager.resume();
      const videoElement = this.cameraManager.getVideoElement();
      if (videoElement) {
        await this.postureDetector.startDetection(
          videoElement,
          this.handlePostureDetectionResult.bind(this)
        );
      }
    }
  }

  // 更新设置
  async updateSettings(newSettings: Partial<UserSettings>) {
    this.settings = { ...this.settings, ...newSettings } as UserSettings;
    
    // 更新检测间隔（仍保留以便用户可配置）
    if (newSettings.detectionInterval) {
      this.detectionInterval = newSettings.detectionInterval * 1000;
    }

    console.log('设置已更新:', this.settings);
    console.log('检测间隔已更新为:', this.detectionInterval, 'ms');
  }

  // 设置事件回调
  setOnPostureChange(callback: (result: PostureDetectionResult) => void) {
    this.onPostureChangeCallback = callback;
  }

  setOnReminderTriggered(callback: (level: number, status: PostureStatus) => void) {
    this.onReminderTriggeredCallback = callback;
  }

  setOnError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  // 错误处理
  private handleError(message: string) {
    console.error('姿势监控服务错误:', message);
    
    if (this.onErrorCallback) {
      this.onErrorCallback(message);
    }

    // 通知background script
    chrome.runtime.sendMessage({
      type: 'MONITORING_ERROR',
      data: { message }
    }).catch(() => {});
  }

  // 获取监控状态
  getMonitoringStatus() {
    const now = Date.now();
    const badPostureDuration = this.badPostureStartTime > 0 ? (now - this.badPostureStartTime) / 1000 : 0;
    
    return {
      isMonitoring: this.isMonitoring,
      cameraReady: this.cameraManager.isReady(),
      detectorReady: this.postureDetector.getInitializationStatus(),
      lastDetectionTime: this.lastDetectionTime,
      badPostureDuration: badPostureDuration,
      currentReminderLevel: this.currentReminderLevel,
      isInGlobalCooldown: this.isInGlobalCooldown,
      nextReminderTime: this.getNextReminderTime()
    };
  }

  // 计算下次提醒时间（用于UI显示）
  private getNextReminderTime(): number {
    if (!this.settings || this.badPostureStartTime === 0) return 0;
    
    const firstWarningDelay = this.settings.reminderTiming.firstWarningDelay;
    const secondWarningDelay = this.settings.reminderTiming.secondWarningDelay;
    
    if (this.settings.usageMode === UsageMode.COMPUTER_WORK) {
      if (this.currentReminderLevel < 2) {
        return this.badPostureStartTime + (firstWarningDelay * 1000);
      } else if (this.currentReminderLevel < 3) {
        return this.badPostureStartTime + ((firstWarningDelay + secondWarningDelay) * 1000);
      }
    } else if (this.settings.usageMode === UsageMode.STUDY_READING) {
      if (this.currentReminderLevel < 3) {
        return this.badPostureStartTime + (firstWarningDelay * 1000);
      }
    } else if (this.settings.usageMode === UsageMode.SILENT) {
      if (this.currentReminderLevel < 2) {
        return this.badPostureStartTime + (firstWarningDelay * 1000);
      }
    }
    
    return 0;
  }

  // 清理资源
  dispose() {
    this.stopMonitoring();
    this.postureDetector.dispose();
    this.cameraManager.dispose();
    
    this.onPostureChangeCallback = undefined;
    this.onReminderTriggeredCallback = undefined;
    this.onErrorCallback = undefined;
  }
} 