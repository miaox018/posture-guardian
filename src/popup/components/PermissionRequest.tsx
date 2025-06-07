import { useState } from 'react';

interface PermissionRequestProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export default function PermissionRequest({ 
  onPermissionGranted, 
  onPermissionDenied 
}: PermissionRequestProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError('');
    
    try {
      // 申请摄像头权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      // 立即停止流，我们只是测试权限
      stream.getTracks().forEach(track => track.stop());
      
      // 申请通知权限
      await Notification.requestPermission();
      
      console.log('权限申请成功');
      onPermissionGranted();
      
    } catch (error) {
      console.error('权限申请失败:', error);
      setError('权限申请失败，请在浏览器设置中手动开启摄像头权限');
      onPermissionDenied();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleLearnMore = () => {
    // 打开帮助页面或设置页面
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        姿势守护者 📐💡
      </div>
      
      <div className="popup-content">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
          <p style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '500' }}>
            首次使用需要授权摄像头权限
          </p>
        </div>

        <div style={{ 
          background: 'rgba(16, 185, 129, 0.1)', 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#047857'
          }}>
            🔒 您的隐私我们保护：
          </div>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            fontSize: '13px',
            color: '#374151'
          }}>
            <li style={{ marginBottom: '4px' }}>• 所有检测均在本地进行</li>
            <li style={{ marginBottom: '4px' }}>• 不会上传任何视频数据</li>
            <li style={{ marginBottom: '4px' }}>• 可随时关闭或撤销权限</li>
          </ul>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2',
            color: '#B91C1C',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px',
            border: '1px solid #FECACA'
          }}>
            {error}
          </div>
        )}

        <button 
          className="btn btn-primary" 
          onClick={handleRequestPermission}
          disabled={isRequesting}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          {isRequesting ? (
            <>
              <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
              请求中...
            </>
          ) : (
            '授权摄像头'
          )}
        </button>
      </div>
      
      <div className="popup-footer">
        <button className="btn btn-secondary">
          稍后设置
        </button>
        <button 
          className="btn btn-secondary"
          onClick={handleLearnMore}
        >
          了解更多
        </button>
      </div>
    </div>
  );
} 