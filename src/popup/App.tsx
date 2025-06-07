import { useState, useEffect } from 'react';
import { PostureStatus } from '@shared/types';
import PermissionRequest from './components/PermissionRequest';
import LightDetection from './components/LightDetection';
import PostureMonitor from './components/PostureMonitor';
import PostureAlert from './components/PostureAlert';

// 应用状态枚举
enum AppState {
  PERMISSION_REQUEST = 'permission_request',
  LIGHT_DETECTION = 'light_detection', 
  LIGHT_DETECTION_FAILED = 'light_detection_failed',
  POSTURE_MONITORING = 'posture_monitoring',
  POSTURE_ALERT = 'posture_alert'
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.PERMISSION_REQUEST);
  const [currentPostureStatus, setCurrentPostureStatus] = useState<PostureStatus>(PostureStatus.GOOD);
  const [lightLevel, setLightLevel] = useState<number>(0);

  // 组件挂载时检查权限状态
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  // 检查权限状态
  const checkPermissionStatus = async () => {
    try {
      // 检查摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      stream.getTracks().forEach(track => track.stop());
      
      // 检查通知权限
      await Notification.requestPermission();
      
      // 如果权限已获取，直接进入环境光检测
      setAppState(AppState.LIGHT_DETECTION);
    } catch (error) {
      console.log('权限检查失败，需要重新申请');
      setAppState(AppState.PERMISSION_REQUEST);
    }
  };

  // 权限申请成功处理
  const handlePermissionGranted = () => {
    setAppState(AppState.LIGHT_DETECTION);
  };

  // 权限申请失败处理
  const handlePermissionDenied = () => {
    // 保持在权限申请状态
  };

  // 环境光检测完成处理
  const handleLightDetectionComplete = (brightness: number, isAdequate: boolean) => {
    setLightLevel(brightness);
    
    if (isAdequate) {
      setAppState(AppState.POSTURE_MONITORING);
    } else {
      setAppState(AppState.LIGHT_DETECTION_FAILED);
    }
  };

  // 环境光检测失败后重试
  const handleLightDetectionRetry = () => {
    setAppState(AppState.LIGHT_DETECTION);
  };

  // 忽略光线问题，继续监控
  const handleLightDetectionIgnore = () => {
    setAppState(AppState.POSTURE_MONITORING);
  };

  // 姿势状态变化处理
  const handlePostureChange = (status: PostureStatus) => {
    setCurrentPostureStatus(status);
    
    // 如果检测到不良姿势，显示提醒界面
    if (status === PostureStatus.WARNING || status === PostureStatus.DANGER) {
      setAppState(AppState.POSTURE_ALERT);
    }
  };

  // 姿势提醒确认处理
  const handlePostureAlertAcknowledge = () => {
    setAppState(AppState.POSTURE_MONITORING);
  };

  // 根据当前状态渲染对应组件
  const renderCurrentState = () => {
    switch (appState) {
      case AppState.PERMISSION_REQUEST:
        return (
          <PermissionRequest
            onPermissionGranted={handlePermissionGranted}
            onPermissionDenied={handlePermissionDenied}
          />
        );

      case AppState.LIGHT_DETECTION:
        return (
          <LightDetection
            onDetectionComplete={handleLightDetectionComplete}
          />
        );

      case AppState.LIGHT_DETECTION_FAILED:
        return (
          <LightDetection
            onDetectionComplete={handleLightDetectionComplete}
            onRetry={handleLightDetectionRetry}
            onIgnore={handleLightDetectionIgnore}
            failed={true}
            brightness={lightLevel}
          />
        );

      case AppState.POSTURE_MONITORING:
        return (
          <PostureMonitor
            currentStatus={currentPostureStatus}
            onPostureChange={handlePostureChange}
            onOpenSettings={() => {
              // 打开设置页面
              chrome.runtime.openOptionsPage();
            }}
          />
        );

      case AppState.POSTURE_ALERT:
        return (
          <PostureAlert
            postureStatus={currentPostureStatus}
            onAcknowledge={handlePostureAlertAcknowledge}
            onOpenSettings={() => {
              chrome.runtime.openOptionsPage();
            }}
          />
        );

      default:
        return <div>加载中...</div>;
    }
  };

  return (
    <div className="app">
      {renderCurrentState()}
    </div>
  );
} 