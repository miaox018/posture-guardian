import { ChromeMessage, ExtensionState, PostureStatus, UsageMode, ReminderLevel } from '@shared/types';

// 扩展状态管理
let extensionState: ExtensionState = {
  isActive: false,
  currentMode: UsageMode.COMPUTER_WORK,
  postureStatus: PostureStatus.GOOD,
  reminderLevel: ReminderLevel.ICON_CHANGE,
  lastReminderTime: 0,
  isInCooldown: false,
  permissionStatus: {
    camera: false,
    notifications: false,
    granted: false
  }
};

// 监听扩展安装
chrome.runtime.onInstalled.addListener(() => {
  console.log('姿势守护者扩展已安装');
  
  // 设置默认图标
  updateExtensionIcon(PostureStatus.GOOD);
  
  // 初始化存储
  chrome.storage.sync.set({
    usageMode: UsageMode.COMPUTER_WORK,
    reminderSound: 'gentle-chime.mp3',
    reminderVolume: 0.3,
    confirmModeSwitch: false,
    enableLightDetection: true,
    lightThreshold: 150,
    postureThreshold: {
      headTilt: 15,
      shoulderTilt: 8
    },
    cooldownPeriod: 5,
    language: 'zh-CN'
  });
});

// 监听来自popup和content script的消息
chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
  console.log('Background收到消息:', message);

  switch (message.type) {
    case 'GET_EXTENSION_STATE':
      sendResponse(extensionState);
      break;

    case 'UPDATE_POSTURE_STATUS':
      handlePostureStatusUpdate(message.data);
      sendResponse({ success: true });
      break;

    case 'UPDATE_USAGE_MODE':
      extensionState.currentMode = message.data;
      sendResponse({ success: true });
      break;

    case 'PERMISSION_GRANTED':
      handlePermissionGranted();
      sendResponse({ success: true });
      break;

    case 'START_MONITORING':
      startMonitoring();
      sendResponse({ success: true });
      break;

    case 'STOP_MONITORING':
      stopMonitoring();
      sendResponse({ success: true });
      break;

    case 'SHOW_NOTIFICATION':
      showNotification(message.data);
      sendResponse({ success: true });
      break;

    // 新增：姿势监控相关消息
    case 'POSTURE_MONITORING_INITIALIZED':
      console.log('姿势监控服务已初始化');
      sendResponse({ success: true });
      break;

    case 'MONITORING_STARTED':
      console.log('姿势监控已开始');
      extensionState.isActive = true;
      sendResponse({ success: true });
      break;

    case 'MONITORING_STOPPED':
      console.log('姿势监控已停止');
      extensionState.isActive = false;
      sendResponse({ success: true });
      break;

    case 'POSTURE_DETECTION_RESULT':
      handlePostureDetectionResult(message.data);
      sendResponse({ success: true });
      break;

    case 'TRIGGER_ICON_REMINDER':
      handleIconReminder(message.data);
      sendResponse({ success: true });
      break;

    case 'TRIGGER_GENTLE_POPUP':
      handleGentlePopup(message.data);
      sendResponse({ success: true });
      break;

    case 'TRIGGER_AUDIO_REMINDER':
      handleAudioReminder(message.data);
      sendResponse({ success: true });
      break;

    case 'MONITORING_ERROR':
      handleMonitoringError(message.data);
      sendResponse({ success: true });
      break;

    case 'CAMERA_ERROR':
      handleCameraError(message.data);
      sendResponse({ success: true });
      break;

    default:
      console.warn('未知的消息类型:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // 保持消息通道开放
});

// 处理姿势状态更新
function handlePostureStatusUpdate(status: PostureStatus) {
  const previousStatus = extensionState.postureStatus;
  extensionState.postureStatus = status;
  
  // 更新图标
  updateExtensionIcon(status);
  
  // 如果状态变为良好，重置提醒级别
  if (status === PostureStatus.GOOD && previousStatus !== PostureStatus.GOOD) {
    extensionState.reminderLevel = ReminderLevel.ICON_CHANGE;
    extensionState.isInCooldown = false;
  }
  
  // 通知content script状态变化
  broadcastToAllTabs('POSTURE_STATUS_CHANGED', status);
}

// 更新扩展图标
function updateExtensionIcon(status: PostureStatus) {
  let iconPath: string;
  let badgeText = '';
  let badgeColor = '';

  switch (status) {
    case PostureStatus.GOOD:
      iconPath = 'assets/icons/icon-good';
      badgeColor = '#10B981'; // 绿色
      break;
    case PostureStatus.WARNING:
      iconPath = 'assets/icons/icon-warning';
      badgeText = '!';
      badgeColor = '#F59E0B'; // 黄色
      break;
    case PostureStatus.DANGER:
      iconPath = 'assets/icons/icon-danger';
      badgeText = '!';
      badgeColor = '#EF4444'; // 红色
      break;
    default:
      iconPath = 'assets/icons/icon';
      badgeColor = '#6B7280'; // 灰色
  }

  // 修正文件扩展名为.bmp
  chrome.action.setIcon({
    path: {
      16: `${iconPath}16.bmp`,
      32: `${iconPath}32.bmp`, 
      48: `${iconPath}48.bmp`,
      128: `${iconPath}128.bmp`
    }
  });

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

// 处理权限授予
function handlePermissionGranted() {
  extensionState.permissionStatus = {
    camera: true,
    notifications: true,
    granted: true
  };
  
  extensionState.isActive = true;
  
  // 通知所有tabs权限已授予
  broadcastToAllTabs('PERMISSION_GRANTED', null);
}

// 开始监控
function startMonitoring() {
  extensionState.isActive = true;
  broadcastToAllTabs('START_MONITORING', null);
}

// 停止监控
function stopMonitoring() {
  extensionState.isActive = false;
  broadcastToAllTabs('STOP_MONITORING', null);
}

// 显示通知
function showNotification(data: { title: string; message: string }) {
  if (!extensionState.permissionStatus.notifications) {
    console.warn('通知权限未授予');
    return;
  }

  const notificationId = `posture-${Date.now()}`;
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'assets/icons/icon48.bmp',
    title: data.title,
    message: data.message,
    requireInteraction: false,
    priority: 1
  });

  // 5秒后自动清除通知
  setTimeout(() => {
    chrome.notifications.clear(notificationId);
  }, 5000);
}

// 向所有标签页广播消息
function broadcastToAllTabs(type: string, data: any) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type,
          data,
          timestamp: Date.now()
        }).catch(() => {
          // 忽略发送失败的情况（tab可能已关闭或不支持content script）
        });
      }
    });
  });
}

// 监听通知点击
chrome.notifications.onClicked.addListener((_notificationId) => {
  // 打开popup或设置页面
  chrome.action.openPopup();
});

// 监听tab更新，用于检测用户活动
chrome.tabs.onActivated.addListener((activeInfo) => {
  // 检测用户是否切换到了Chrome窗口
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && !tab.url.startsWith('chrome://')) {
      broadcastToAllTabs('TAB_ACTIVATED', { url: tab.url });
    }
  });
});

// 监听窗口焦点变化
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Chrome失去焦点
    broadcastToAllTabs('CHROME_FOCUS_LOST', null);
  } else {
    // Chrome获得焦点
    broadcastToAllTabs('CHROME_FOCUS_GAINED', null);
  }
});

// 定期检查扩展状态
setInterval(() => {
  // 每分钟检查一次扩展状态
  if (extensionState.isActive) {
    // 这里可以添加定期检查逻辑
    console.log('扩展状态检查:', extensionState);
  }
}, 60000);

// 新增：处理姿势检测结果
function handlePostureDetectionResult(data: {
  status: PostureStatus;
  headTiltAngle: number;
  shoulderTiltAngle: number;
  confidence: number;
  timestamp: number;
}) {
  // 更新扩展状态
  extensionState.postureStatus = data.status;
  
  // 更新图标
  updateExtensionIcon(data.status);
  
  // 记录检测数据（可以用于统计）
  console.log('姿势检测结果:', {
    status: data.status,
    headTilt: data.headTiltAngle.toFixed(1),
    shoulderTilt: data.shoulderTiltAngle.toFixed(1),
    confidence: (data.confidence * 100).toFixed(1) + '%'
  });
}

// 新增：处理图标提醒
function handleIconReminder(data: { status: PostureStatus }) {
  console.log('触发图标提醒:', data.status);
  
  // 更新图标状态
  updateExtensionIcon(data.status);
  
  // 记录提醒时间
  extensionState.lastReminderTime = Date.now();
  extensionState.reminderLevel = ReminderLevel.ICON_CHANGE;
}

// 新增：处理温和弹窗
function handleGentlePopup(data: { status: PostureStatus; message: string }) {
  console.log('💬 触发温和弹窗:', data.status, data.message);
  
  // 修复：向所有标签页广播弹窗消息
  broadcastToAllTabs('TRIGGER_GENTLE_POPUP', data);
  
  extensionState.reminderLevel = ReminderLevel.GENTLE_POPUP;
}

// 新增：处理音频提醒
function handleAudioReminder(data: { 
  status: PostureStatus; 
  soundName: string; 
  volume: number; 
}) {
  console.log('🔊 触发音频提醒:', data.status, data.soundName);
  
  // 修复：向所有标签页广播音频消息，而不是只向当前活跃标签页
  // 因为姿势监控可能在任何标签页运行
  broadcastToAllTabs('TRIGGER_AUDIO_REMINDER', data);
  
  // 也显示系统通知作为备选
  showNotification({
    title: '🔊 姿势提醒',
    message: data.status === PostureStatus.DANGER 
      ? '⚠️ 请立即调整坐姿，避免颈椎压力' 
      : '💡 建议调整坐姿，保持健康'
  });
  
  extensionState.reminderLevel = ReminderLevel.AUDIO_REMINDER;
  extensionState.isInCooldown = true;
  
  // 5分钟后解除冷却
  setTimeout(() => {
    extensionState.isInCooldown = false;
    console.log('音频提醒冷却期结束');
  }, 5 * 60 * 1000);
}

// 新增：处理监控错误
function handleMonitoringError(data: { message: string }) {
  console.error('监控错误:', data.message);
  
  // 显示错误通知
  showNotification({
    title: '姿势监控错误',
    message: data.message
  });
  
  // 停止监控
  extensionState.isActive = false;
}

// 新增：处理摄像头错误
function handleCameraError(data: { message: string; error: string }) {
  console.error('摄像头错误:', data.message, data.error);
  
  // 显示错误通知
  showNotification({
    title: '摄像头访问失败',
    message: data.message
  });
}

console.log('姿势守护者后台脚本已启动'); 