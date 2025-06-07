# 姿势矫正扩展 - 组件设计规范

## 1. 设计系统基础

### 1.1 颜色规范
```css
/* 主色调 */
--primary-green: #10B981;    /* 正常状态 */
--warning-yellow: #F59E0B;   /* 警告状态 */
--danger-red: #EF4444;       /* 危险状态 */
--disabled-gray: #9CA3AF;    /* 禁用状态 */

/* 背景色 */
--bg-primary: #FFFFFF;       /* 主背景 */
--bg-secondary: #F9FAFB;     /* 次级背景 */
--bg-dark: #1F2937;          /* 深色背景 */

/* 文字颜色 */
--text-primary: #111827;     /* 主要文字 */
--text-secondary: #6B7280;   /* 次要文字 */
--text-light: #9CA3AF;       /* 淡色文字 */
--text-white: #FFFFFF;       /* 白色文字 */

/* 边框颜色 */
--border-light: #E5E7EB;     /* 浅色边框 */
--border-medium: #D1D5DB;    /* 中等边框 */
--border-dark: #374151;      /* 深色边框 */

/* 状态色 */
--success: #10B981;
--info: #3B82F6;
--warning: #F59E0B;
--error: #EF4444;
```

### 1.2 字体规范
```css
/* 字体族 */
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* 字体大小 */
--text-xs: 12px;     /* 小号文字 */
--text-sm: 14px;     /* 标准文字 */
--text-base: 16px;   /* 基础文字 */
--text-lg: 18px;     /* 大号文字 */
--text-xl: 20px;     /* 特大文字 */
--text-2xl: 24px;    /* 标题文字 */

/* 行高 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* 字重 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 1.3 间距规范
```css
/* 间距系统 */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;

/* 圆角 */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 50%;

/* 阴影 */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
```

## 2. 组件详细规范

### 2.1 扩展图标 (Extension Icon)
```css
.extension-icon {
  width: 16px;
  height: 16px;
  /* 状态颜色变化 */
}

.icon-normal { 
  background: var(--primary-green); 
  animation: pulse-subtle 3s infinite;
}
.icon-warning { 
  background: var(--warning-yellow); 
  animation: pulse-warning 2s infinite;
}
.icon-danger { 
  background: var(--danger-red); 
  animation: pulse-danger 1s infinite;
}
.icon-disabled { 
  background: var(--disabled-gray); 
}

/* 脉冲动画 */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
@keyframes pulse-danger {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

### 2.2 主弹窗容器 (Popup Container)
```css
.popup-container {
  width: 320px;
  min-height: 400px;
  max-height: 600px;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  font-family: var(--font-family);
}

.popup-header {
  padding: var(--space-4) var(--space-5);
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: var(--text-white);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  text-align: center;
}

.popup-content {
  padding: var(--space-5);
  overflow-y: auto;
  max-height: 480px;
}

.popup-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border-light);
  background: var(--bg-secondary);
}
```

### 2.3 按钮组件 (Button Components)
```css
/* 主要按钮 */
.btn-primary {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--primary-green);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
}

/* 次要按钮 */
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* 危险按钮 */
.btn-danger {
  background: var(--danger-red);
  color: var(--text-white);
}

.btn-danger:hover {
  background: #DC2626;
}

/* 按钮组 */
.btn-group {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.btn-group .btn-secondary {
  flex: 1;
}
```

### 2.4 状态指示器 (Status Indicators)
```css
.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.status-good {
  background: #ECFDF5;
  color: #065F46;
  border: 1px solid #A7F3D0;
}

.status-warning {
  background: #FFFBEB;
  color: #92400E;
  border: 1px solid #FDE68A;
}

.status-danger {
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

.status-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
```

### 2.5 进度条组件 (Progress Bar)
```css
.progress-container {
  margin: var(--space-4) 0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-green), #059669);
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### 2.6 姿势展示区域 (Posture Display)
```css
.posture-display {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin: var(--space-4) 0;
}

.posture-avatar {
  width: 80px;
  height: 80px;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.posture-avatar.good {
  border-color: var(--primary-green);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
}

.posture-avatar.warning {
  border-color: var(--warning-yellow);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
}

.posture-avatar.danger {
  border-color: var(--danger-red);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.posture-info {
  flex: 1;
}

.posture-status {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-1);
}

.posture-duration {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
```

### 2.7 统计卡片 (Stats Cards)
```css
.stats-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
  margin: var(--space-4) 0;
}

.stat-card {
  padding: var(--space-3);
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  text-align: center;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: var(--leading-tight);
}

/* 特定状态的统计卡片 */
.stat-card.good .stat-value { color: var(--primary-green); }
.stat-card.warning .stat-value { color: var(--warning-yellow); }
.stat-card.danger .stat-value { color: var(--danger-red); }
```

### 2.8 通知组件 (Notification)
```css
.notification {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  width: 320px;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border-left: 4px solid var(--primary-green);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
}

.notification.warning {
  border-left-color: var(--warning-yellow);
}

.notification.danger {
  border-left-color: var(--danger-red);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-header {
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}

.notification-content {
  padding: var(--space-4);
}

.notification-actions {
  padding: var(--space-3) var(--space-4);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
```

### 2.9 设置页面组件 (Settings Components)
```css
.settings-container {
  display: flex;
  min-height: 600px;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.settings-sidebar {
  width: 200px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-light);
  padding: var(--space-4);
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  margin-bottom: var(--space-1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.settings-nav-item:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.settings-nav-item.active {
  background: var(--primary-green);
  color: var(--text-white);
}

.settings-content {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}

.settings-section {
  margin-bottom: var(--space-8);
}

.settings-section h3 {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

.setting-item {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-2);
  color: var(--text-primary);
}

.setting-description {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
  line-height: var(--leading-relaxed);
}
```

### 2.10 表单控件 (Form Controls)
```css
/* 滑块控件 */
.slider-container {
  margin: var(--space-3) 0;
}

.slider {
  width: 100%;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: var(--primary-green);
  border-radius: var(--radius-full);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--primary-green);
  border-radius: var(--radius-full);
  cursor: pointer;
  border: none;
}

/* 开关控件 */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--border-medium);
  transition: 0.2s;
  border-radius: 24px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .switch-slider {
  background: var(--primary-green);
}

input:checked + .switch-slider:before {
  transform: translateX(20px);
}

/* 选择框 */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.radio-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s ease;
}

.radio-item:hover {
  background: var(--bg-secondary);
}

.radio-item input[type="radio"] {
  width: 16px;
  height: 16px;
  margin: 0;
}

.radio-item label {
  flex: 1;
  cursor: pointer;
  font-size: var(--text-sm);
}
```

## 3. 响应式设计

### 3.1 移动端适配
```css
@media (max-width: 480px) {
  .popup-container {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
  
  .stats-container {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
  
  .settings-container {
    flex-direction: column;
  }
  
  .settings-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }
}
```

### 3.2 高DPI屏幕支持
```css
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .extension-icon {
    width: 32px;
    height: 32px;
    /* 高清图标 */
  }
}
```

这个组件规范提供了完整的视觉设计标准，确保整个扩展的界面保持一致性和专业性。每个组件都包含了具体的CSS实现，可以直接用于开发。 