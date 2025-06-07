// 姿势状态枚举
export enum PostureStatus {
  GOOD = 'good',
  WARNING = 'warning', 
  DANGER = 'danger'
}

// 使用模式枚举
export enum UsageMode {
  COMPUTER_WORK = 'computer_work',  // 电脑工作模式
  STUDY_READING = 'study_reading',  // 学习阅读模式
  SILENT = 'silent',                // 静音模式
  CUSTOM = 'custom'                 // 自定义模式
}

// 提醒级别
export enum ReminderLevel {
  ICON_CHANGE = 1,    // 图标变色
  GENTLE_POPUP = 2,   // 轻柔弹窗
  AUDIO_REMINDER = 3  // 声音提醒
}

// 环境光检测结果
export interface LightDetectionResult {
  brightness: number;  // 亮度值 (lux)
  isAdequate: boolean; // 是否充足
  timestamp: number;   // 检测时间戳
}

// 姿势检测结果
export interface PostureDetectionResult {
  status: PostureStatus;
  confidence: number;   // 置信度 0-1
  landmarks?: any[];    // MediaPipe 关键点数据
  headTiltAngle: number;    // 头部前倾角度
  shoulderTiltAngle: number; // 肩膀倾斜角度
  timestamp: number;
}

// 用户设置
export interface UserSettings {
  usageMode: UsageMode;
  reminderSound: string;
  reminderVolume: number;
  confirmModeSwitch: boolean;
  enableLightDetection: boolean;
  lightThreshold: number;
  postureThreshold: {
    headTilt: number;
    shoulderTilt: number;
  };
  cooldownPeriod: number; // 冷却期时长(分钟)
  detectionInterval: number; // 检测间隔(秒)
  language: string;
  
  // 新增：基于时间的提醒配置
  reminderTiming: {
    firstWarningDelay: number;    // 连续坏姿势多久后第一次提醒 (秒)
    secondWarningDelay: number;   // 第一次提醒后多久进行第二次提醒 (秒) 
    cooldownPeriod: number;       // 完整cycle后的冷却期 (分钟)
  };
}

// 统计数据
export interface PostureStats {
  date: string;
  totalTime: number;     // 总监控时间(分钟)
  goodTime: number;      // 良好姿势时间
  warningTime: number;   // 警告状态时间
  dangerTime: number;    // 危险状态时间
  reminderCount: number; // 提醒次数
}

// 消息类型
export interface ChromeMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

// 权限状态
export interface PermissionStatus {
  camera: boolean;
  notifications: boolean;
  granted: boolean;
}

// 扩展状态
export interface ExtensionState {
  isActive: boolean;
  currentMode: UsageMode;
  postureStatus: PostureStatus;
  reminderLevel: ReminderLevel;
  lastReminderTime: number;
  isInCooldown: boolean;
  permissionStatus: PermissionStatus;
}

// 活动检测结果
export interface ActivityDetectionResult {
  hasActivity: boolean;
  lastActivity: number;
  isFullscreen: boolean;
}

// 姿势建议映射类型
export type PostureAdviceMap = {
  [PostureStatus.WARNING]: string;
  [PostureStatus.DANGER]: string;
} 