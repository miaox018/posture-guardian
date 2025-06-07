# 开发指南 - 从原型图到代码实现

## 1. 开发准备

### 1.1 环境要求
- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **Chrome**: >= 88 (支持Manifest V3)
- **编辑器**: VS Code (推荐安装扩展：ES6模块语法、TypeScript)

### 1.2 技术栈确认
```json
{
  "frontend": "React 18 + TypeScript",
  "bundler": "Vite 4.x",
  "styling": "CSS Modules + CSS变量",
  "ai": "TensorFlow.js + MediaPipe",
  "state": "Zustand (轻量状态管理)",
  "testing": "Jest + React Testing Library"
}
```

## 2. 项目初始化

### 2.1 创建项目结构
```bash
# 初始化项目
npm create vite@latest . -- --template react-ts
npm install

# 安装Chrome扩展相关依赖
npm install @types/chrome
npm install @crxjs/vite-plugin

# 安装AI相关依赖
npm install @tensorflow/tfjs @mediapipe/pose

# 安装UI相关依赖
npm install zustand clsx

# 开发依赖
npm install -D @types/node
```

### 2.2 配置Vite（vite.config.ts）
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        background: 'src/background/index.ts',
        content: 'src/content/index.ts'
      }
    }
  }
})
```

## 3. 基于原型图的开发计划

### 3.1 第一阶段：基础框架 (Week 1)

#### 任务1: Chrome扩展基础配置
```json
// manifest.json
{
  "manifest_version": 3,
  "name": "姿势守护者",
  "version": "0.1.0",
  "description": "实时监测坐姿并给予友好提醒",
  "permissions": [
    "storage",
    "notifications",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "src/background/index.ts"
  },
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "src/options/index.html",
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/index.ts"]
    }
  ]
}
```

#### 任务2: 目录结构建立
```
src/
├── popup/                 # 主弹窗
│   ├── index.html
│   ├── index.tsx         # 入口文件
│   ├── App.tsx           # 主组件
│   └── components/       # 弹窗组件
│       ├── PermissionRequest.tsx
│       ├── LightDetection.tsx
│       ├── PostureMonitor.tsx
│       └── PostureAlert.tsx
├── options/              # 设置页面
│   ├── index.html
│   ├── index.tsx
│   └── components/
├── background/           # 后台脚本
│   ├── index.ts
│   ├── permissions.ts
│   └── notifications.ts
├── content/              # 内容脚本
│   ├── index.ts
│   ├── lightDetector.ts
│   └── postureDetector.ts
├── shared/               # 共享资源
│   ├── styles/
│   │   ├── globals.css
│   │   └── variables.css
│   ├── utils/
│   ├── types/
│   └── stores/
└── assets/
    └── icons/
```

#### 任务3: 设计系统实现
```css
/* src/shared/styles/variables.css */
:root {
  /* 从component-specs.md复制所有CSS变量 */
  --primary-green: #10B981;
  --warning-yellow: #F59E0B;
  --danger-red: #EF4444;
  /* ... 其他变量 */
}
```

### 3.2 第二阶段：权限管理和环境光检测 (Week 2)

#### 任务1: 权限申请组件实现
```typescript
// src/popup/components/PermissionRequest.tsx
import React, { useState } from 'react';
import './PermissionRequest.css';

interface PermissionRequestProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      stream.getTracks().forEach(track => track.stop());
      onPermissionGranted();
    } catch (error) {
      onPermissionDenied();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        姿势守护者 📐💡
      </div>
      <div className="popup-content">
        {/* 按照wireframes.md中的布局实现 */}
        <div className="camera-icon">📷</div>
        <p>首次使用需要授权摄像头权限</p>
        
        <div className="privacy-note">
          🔒 您的隐私我们保护：
          <ul>
            <li>• 所有检测均在本地进行</li>
            <li>• 不会上传任何视频数据</li>
            <li>• 可随时关闭或撤销权限</li>
          </ul>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleRequestPermission}
          disabled={isRequesting}
        >
          {isRequesting ? '请求中...' : '授权摄像头'}
        </button>
      </div>
      <div className="popup-footer">
        <button className="btn-secondary">稍后设置</button>
        <button className="btn-secondary">了解更多</button>
      </div>
    </div>
  );
};
```

#### 任务2: 环境光检测实现
```typescript
// src/content/lightDetector.ts
export class LightDetector {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  async initialize(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      this.video = document.createElement('video');
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
      
      this.video.srcObject = stream;
      await this.video.play();
      
      return true;
    } catch (error) {
      console.error('无法初始化摄像头:', error);
      return false;
    }
  }

  detectLightLevel(): number {
    if (!this.video || !this.canvas || !this.context) {
      return 0;
    }

    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    this.context.drawImage(this.video, 0, 0);

    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 转换为HSV并计算亮度
      const brightness = Math.max(r, g, b) / 255;
      totalBrightness += brightness;
    }

    const averageBrightness = totalBrightness / (data.length / 4);
    return Math.round(averageBrightness * 300); // 转换为lux近似值
  }

  cleanup() {
    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }
}
```

### 3.3 第三阶段：姿势检测核心 (Week 3-4)

#### 任务1: MediaPipe BlazePose集成
```typescript
// src/content/postureDetector.ts
import { Pose, POSE_LANDMARKS } from '@mediapipe/pose';

export class PostureDetector {
  private pose: Pose;
  private video: HTMLVideoElement;
  private onPostureChange: (status: PostureStatus) => void;

  constructor(video: HTMLVideoElement, onPostureChange: (status: PostureStatus) => void) {
    this.video = video;
    this.onPostureChange = onPostureChange;
    this.initializePose();
  }

  private initializePose() {
    this.pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.pose.onResults(this.onPoseResults.bind(this));
  }

  private onPoseResults(results: any) {
    if (results.poseLandmarks) {
      const postureStatus = this.analyzePosture(results.poseLandmarks);
      this.onPostureChange(postureStatus);
    }
  }

  private analyzePosture(landmarks: any[]): PostureStatus {
    // 获取关键点
    const nose = landmarks[POSE_LANDMARKS.NOSE];
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftEye = landmarks[POSE_LANDMARKS.LEFT_EYE];
    const rightEye = landmarks[POSE_LANDMARKS.RIGHT_EYE];

    // 计算头部前倾角度
    const headTiltAngle = this.calculateHeadTilt(nose, leftShoulder, rightShoulder);
    
    // 计算肩膀倾斜度
    const shoulderTiltAngle = this.calculateShoulderTilt(leftShoulder, rightShoulder);

    // 根据阈值判断姿势状态
    if (headTiltAngle > 30 || shoulderTiltAngle > 15) {
      return PostureStatus.DANGER;
    } else if (headTiltAngle > 15 || shoulderTiltAngle > 8) {
      return PostureStatus.WARNING;
    } else {
      return PostureStatus.GOOD;
    }
  }

  private calculateHeadTilt(nose: any, leftShoulder: any, rightShoulder: any): number {
    // 计算头部相对于肩膀的前倾角度
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    const headForwardRatio = (nose.y - shoulderCenterY) / Math.abs(nose.z || 0.1);
    return Math.atan(headForwardRatio) * (180 / Math.PI);
  }

  private calculateShoulderTilt(leftShoulder: any, rightShoulder: any): number {
    // 计算肩膀倾斜角度
    const deltaY = Math.abs(leftShoulder.y - rightShoulder.y);
    const deltaX = Math.abs(leftShoulder.x - rightShoulder.x);
    return Math.atan(deltaY / deltaX) * (180 / Math.PI);
  }

  startDetection() {
    const detect = async () => {
      if (this.video.readyState >= 2) {
        await this.pose.send({ image: this.video });
      }
      requestAnimationFrame(detect);
    };
    detect();
  }
}

export enum PostureStatus {
  GOOD = 'good',
  WARNING = 'warning',
  DANGER = 'danger'
}
```

### 3.4 第四阶段：UI组件实现 (Week 5)

#### 任务1: 主监控界面
```typescript
// src/popup/components/PostureMonitor.tsx
import React, { useEffect, useState } from 'react';
import { PostureStatus } from '../../content/postureDetector';
import './PostureMonitor.css';

export const PostureMonitor: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState<PostureStatus>(PostureStatus.GOOD);
  const [monitoringDuration, setMonitoringDuration] = useState(0);
  const [todayStats, setTodayStats] = useState({
    good: 85,
    warning: 12,
    danger: 3
  });

  useEffect(() => {
    // 监听来自content script的姿势状态更新
    const handleMessage = (message: any) => {
      if (message.type === 'POSTURE_UPDATE') {
        setCurrentStatus(message.status);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const getStatusEmoji = (status: PostureStatus) => {
    switch (status) {
      case PostureStatus.GOOD: return '🙍‍♂️';
      case PostureStatus.WARNING: return '😐';
      case PostureStatus.DANGER: return '😰';
      default: return '🙍‍♂️';
    }
  };

  const getStatusText = (status: PostureStatus) => {
    switch (status) {
      case PostureStatus.GOOD: return '✅ 良好';
      case PostureStatus.WARNING: return '⚠️ 注意';
      case PostureStatus.DANGER: return '❌ 危险';
      default: return '✅ 良好';
    }
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        姿势监控中 📐
      </div>
      
      <div className="popup-content">
        <div className="posture-display">
          <div className={`posture-avatar ${currentStatus}`}>
            {getStatusEmoji(currentStatus)}
          </div>
          <div className="posture-info">
            <div className="posture-status">
              当前状态：{getStatusText(currentStatus)}
            </div>
            <div className="posture-duration">
              监控时长：{Math.floor(monitoringDuration / 60)}小时{monitoringDuration % 60}分
            </div>
          </div>
        </div>

        <div className="stats-section">
          <h4>📊 今日统计：</h4>
          <div className="stats-container">
            <div className="stat-card good">
              <div className="stat-value">{todayStats.good}%</div>
              <div className="stat-label">良好姿势</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-value">{todayStats.warning}%</div>
              <div className="stat-label">轻微不良</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-value">{todayStats.danger}%</div>
              <div className="stat-label">需要纠正</div>
            </div>
          </div>
        </div>

        <div className="reminder-settings">
          <h4>🔔 提醒设置：</h4>
          <div className="btn-group">
            <button className="btn-secondary">轻提醒</button>
            <button className="btn-secondary">声音提醒</button>
            <button className="btn-secondary">强提醒</button>
          </div>
        </div>

        <button className="btn-primary">暂停监控</button>
      </div>

      <div className="popup-footer">
        <button className="btn-secondary">设置</button>
        <button className="btn-secondary">历史记录</button>
      </div>
    </div>
  );
};
```

#### 任务2: 场景自适应智能提醒系统
```typescript
// src/shared/utils/smartReminder.ts
export enum UsageMode {
  COMPUTER_WORK = 'computer_work',  // 电脑工作模式
  STUDY_READING = 'study_reading',  // 学习阅读模式
  CUSTOM = 'custom'                 // 自定义模式
}

export class SmartReminderSystem {
  private currentLevel = 0;
  private lastPostureChangeTime = Date.now();
  private lastReminderTime = 0;
  private currentMode = UsageMode.COMPUTER_WORK;
  private isInCooldown = false;

  constructor(private onReminderShow: (level: number, message: string) => void) {
    this.loadUserPreferences();
    this.startModeDetection();
  }

  handlePostureChange(status: PostureStatus) {
    const now = Date.now();
    
    if (status === PostureStatus.GOOD) {
      this.resetReminderLevel();
      this.lastPostureChangeTime = now;
      return;
    }

    // 如果在冷却期内，不进行提醒
    if (this.isInCooldown) {
      return;
    }

    // 检测到异常姿势，开始智能提醒流程
    const badPostureDuration = now - this.lastPostureChangeTime;
    this.escalateReminder(badPostureDuration, status);
  }

  private escalateReminder(duration: number, status: PostureStatus) {
    const now = Date.now();
    
    // 第一级：图标变色 (10秒后)
    if (duration > 10 * 1000 && this.currentLevel === 0) {
      this.currentLevel = 1;
      this.onReminderShow(1, 'icon_change');
      
    // 第二级：根据模式决定策略
    } else if (duration > 70 * 1000 && this.currentLevel === 1) { // 10秒 + 1分钟
      if (this.currentMode === UsageMode.STUDY_READING) {
        // 学习模式：直接声音提醒
        this.currentLevel = 3;
        this.showAudioReminder();
        this.startCooldown();
      } else {
        // 电脑工作模式：先显示弹窗
        this.currentLevel = 2;
        this.showGentleTooltip();
      }
      
    // 第三级：声音提醒（仅电脑工作模式会到达这里）
    } else if (duration > 130 * 1000 && this.currentLevel === 2) { // 70秒 + 1分钟
      this.currentLevel = 3;
      this.showAudioReminder();
      this.startCooldown();
    }
  }

  private showGentleTooltip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'gentle-posture-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        💡 建议调整坐姿 😊<br>
        保持健康，轻松工作
      </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // 3秒后自动移除
    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 300);
    }, 3000);
  }

  private showAudioReminder() {
    // 播放轻柔的提醒音效
    const soundFile = this.getUserPreference('reminderSound') || 'gentle-chime.mp3';
    const volume = this.getUserPreference('reminderVolume') || 0.3;
    
    const audio = new Audio(`sounds/${soundFile}`);
    audio.volume = volume;
    audio.play().catch(() => {
      // 静默处理音频播放失败
      console.log('无法播放提醒音效');
    });

    // 如果是学习模式，可以显示一个简单的系统通知
    if (this.currentMode === UsageMode.STUDY_READING) {
      this.showMinimalNotification();
    }
  }

  private showMinimalNotification() {
    // 学习模式下的简化通知
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '📚 学习提醒',
      message: '注意保持良好坐姿哦！',
      requireInteraction: false,
      silent: false // 允许声音
    });
  }

  private startCooldown() {
    this.isInCooldown = true;
    this.lastReminderTime = Date.now();
    
    // 5分钟冷却期
    setTimeout(() => {
      this.isInCooldown = false;
      this.resetReminderLevel();
    }, 5 * 60 * 1000);
  }

  private startModeDetection() {
    setInterval(() => {
      this.detectUsageMode();
    }, 30000); // 每30秒检测一次
  }

  private detectUsageMode() {
    // 检测Chrome窗口状态
    chrome.windows.getCurrent((window) => {
      const isChromeActive = window && window.focused;
      
      // 检测用户活动（通过content script）
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id!, { type: 'CHECK_USER_ACTIVITY' }, (response) => {
            const hasRecentActivity = response?.hasActivity || false;
            
            // 模式判断逻辑
            if (isChromeActive && hasRecentActivity) {
              this.switchMode(UsageMode.COMPUTER_WORK);
            } else if (!isChromeActive || !hasRecentActivity) {
              this.switchMode(UsageMode.STUDY_READING);
            }
          });
        }
      });
    });
  }

  private switchMode(newMode: UsageMode) {
    if (this.currentMode !== newMode) {
      const oldMode = this.currentMode;
      this.currentMode = newMode;
      
      console.log(`模式切换: ${oldMode} → ${newMode}`);
      
      // 重置提醒状态
      this.resetReminderLevel();
      
      // 如果用户设置了手动确认，显示切换通知
      if (this.getUserPreference('confirmModeSwitch')) {
        this.showModeSwitch Notification(newMode);
      }
    }
  }

  private showModeSwitchNotification(mode: UsageMode) {
    const modeNames = {
      [UsageMode.COMPUTER_WORK]: '🖥️ 电脑工作模式',
      [UsageMode.STUDY_READING]: '📚 学习阅读模式',
      [UsageMode.CUSTOM]: '⚙️ 自定义模式'
    };

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '模式切换',
      message: `已切换到 ${modeNames[mode]}`,
      requireInteraction: false
    });
  }

  private resetReminderLevel() {
    this.currentLevel = 0;
  }

  private loadUserPreferences() {
    chrome.storage.sync.get([
      'usageMode',
      'reminderSound', 
      'reminderVolume',
      'confirmModeSwitch'
    ], (result) => {
      this.currentMode = result.usageMode || UsageMode.COMPUTER_WORK;
    });
  }

  private getUserPreference(key: string): any {
    // 从存储中获取用户偏好
    // 这里应该同步获取，实际实现时需要考虑异步
    return null;
  }

  // 供设置页面调用的方法
  public setMode(mode: UsageMode) {
    this.currentMode = mode;
    chrome.storage.sync.set({ usageMode: mode });
  }

  public getCurrentMode(): UsageMode {
    return this.currentMode;
  }
}
```

#### 任务3: 用户活动检测 (Content Script)
```typescript
// src/content/activityDetector.ts
export class ActivityDetector {
  private lastActivityTime = Date.now();
  private activityThreshold = 60000; // 1分钟无活动视为不活跃

  constructor() {
    this.setupActivityListeners();
    this.listenForModeCheck();
  }

  private setupActivityListeners() {
    // 监听鼠标和键盘活动
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivityTime = Date.now();
      }, { passive: true });
    });
  }

  private listenForModeCheck() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'CHECK_USER_ACTIVITY') {
        const now = Date.now();
        const hasRecentActivity = (now - this.lastActivityTime) < this.activityThreshold;
        
        sendResponse({ 
          hasActivity: hasRecentActivity,
          lastActivity: this.lastActivityTime,
          isFullscreen: this.isFullscreen()
        });
      }
      
      return true; // 异步响应
    });
  }

  private isFullscreen(): boolean {
    return document.fullscreenElement !== null || 
           (document as any).webkitFullscreenElement !== null ||
           (document as any).mozFullScreenElement !== null;
  }
}

// 初始化活动检测器
new ActivityDetector();
```

#### 任务4: 音效管理系统
```typescript
// src/shared/utils/audioManager.ts
export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async loadSounds() {
    const sounds = [
      'gentle-chime.mp3',
      'soft-bell.mp3',
      'nature-ding.mp3'
    ];

    for (const sound of sounds) {
      try {
        const buffer = await this.loadAudioBuffer(`sounds/${sound}`);
        this.soundBuffers.set(sound, buffer);
      } catch (error) {
        console.warn(`无法加载音效 ${sound}:`, error);
      }
    }
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const response = await fetch(chrome.runtime.getURL(url));
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  playSound(soundName: string, volume: number = 0.3) {
    const buffer = this.soundBuffers.get(soundName);
    if (!buffer || !this.audioContext) {
      return;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start();
  }

  // 测试音效播放
  testSound(soundName: string, volume: number) {
    this.playSound(soundName, volume);
  }
}
```

## 4. 测试策略

### 4.1 单元测试
```typescript
// src/__tests__/postureDetector.test.ts
import { PostureDetector, PostureStatus } from '../content/postureDetector';

describe('PostureDetector', () => {
  test('应该正确计算头部前倾角度', () => {
    // 测试姿势分析算法
  });

  test('应该在检测到不良姿势时触发回调', () => {
    // 测试回调机制
  });
});
```

### 4.2 集成测试
```typescript
// src/__tests__/integration.test.ts
describe('权限流程集成测试', () => {
  test('用户拒绝权限后应显示错误提示', () => {
    // 测试完整的权限申请流程
  });
});
```

## 5. 调试和优化

### 5.1 性能监控
```typescript
// src/shared/utils/performance.ts
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = Date.now();

  logFrame() {
    this.frameCount++;
    const now = Date.now();
    if (now - this.lastTime >= 1000) {
      console.log(`FPS: ${this.frameCount}`);
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  measureCPUUsage() {
    // 测量CPU使用率
  }
}
```

### 5.2 错误处理
```typescript
// src/shared/utils/errorHandler.ts
export class ErrorHandler {
  static handleCameraError(error: Error) {
    console.error('摄像头错误:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: '摄像头访问失败',
      message: '请检查摄像头权限设置'
    });
  }

  static handlePoseDetectionError(error: Error) {
    console.error('姿势检测错误:', error);
    // 降级到简单计时提醒模式
  }
}
```

## 6. 部署和发布

### 6.1 构建配置
```bash
# 生产构建
npm run build

# 打包为zip文件
cd dist && zip -r ../posture-guardian.zip .
```

### 6.2 Chrome Web Store发布清单
- [ ] 扩展描述和截图
- [ ] 隐私政策
- [ ] 权限说明
- [ ] 测试设备兼容性

## 7. 开发最佳实践

### 7.1 代码规范
- 使用TypeScript严格模式
- 遵循React Hooks最佳实践
- 实现适当的错误边界
- 添加ESLint和Prettier配置

### 7.2 用户体验
- 实现加载状态指示器
- 提供有意义的错误消息
- 支持键盘导航
- 确保响应式设计

### 7.3 安全考虑
- 验证所有用户输入
- 使用Content Security Policy
- 最小化权限请求
- 定期更新依赖包

这个开发指南提供了从原型图到实际代码实现的完整路径，您可以按照这个计划逐步开发您的姿势矫正扩展。每个阶段都有具体的代码示例和实现指导。 