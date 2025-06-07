import { useState, useEffect } from 'react';

interface LightDetectionProps {
  onDetectionComplete: (brightness: number, isAdequate: boolean) => void;
  onRetry?: () => void;
  onIgnore?: () => void;
  failed?: boolean;
  brightness?: number;
}

export default function LightDetection({ 
  onDetectionComplete, 
  onRetry, 
  onIgnore, 
  failed = false,
  brightness = 0
}: LightDetectionProps) {
  const [isDetecting, setIsDetecting] = useState(!failed);
  const [progress, setProgress] = useState(0);
  const [currentBrightness, setCurrentBrightness] = useState(brightness);

  useEffect(() => {
    if (!failed) {
      startDetection();
    }
  }, [failed]);

  const startDetection = async () => {
    setIsDetecting(true);
    setProgress(0);

    try {
      // 获取摄像头流
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });

      // 创建视频元素和画布
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.srcObject = stream;
      await video.play();

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 模拟检测进度
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // 等待2秒进行检测
      setTimeout(() => {
        if (context) {
          context.drawImage(video, 0, 0);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const detectedBrightness = calculateBrightness(imageData);
          
          setCurrentBrightness(detectedBrightness);
          
          // 停止摄像头流
          stream.getTracks().forEach(track => track.stop());
          
          // 判断亮度是否充足 (阈值150 lux)
          const isAdequate = detectedBrightness >= 150;
          onDetectionComplete(detectedBrightness, isAdequate);
        }
        
        setIsDetecting(false);
      }, 2000);

    } catch (error) {
      console.error('环境光检测失败:', error);
      setIsDetecting(false);
      onDetectionComplete(0, false);
    }
  };

  const calculateBrightness = (imageData: ImageData): number => {
    const data = imageData.data;
    let totalBrightness = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 计算感知亮度
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      totalBrightness += brightness;
    }
    
    const averageBrightness = totalBrightness / (data.length / 4);
    // 转换为近似的lux值
    return Math.round((averageBrightness / 255) * 300);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleIgnore = () => {
    if (onIgnore) {
      onIgnore();
    }
  };

  if (failed) {
    // 检测失败界面
    return (
      <div className="popup-container">
        <div className="popup-header">
          环境光线不足 ⚠️
        </div>
        
        <div className="popup-content">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#F59E0B' }}>⚠️</div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>💡 检测结果：</strong>
            </div>
            <div style={{ marginBottom: '8px' }}>
              当前光线: <span style={{ color: '#EF4444', fontWeight: '600' }}>较暗 ({currentBrightness} lux)</span>
            </div>
            <div style={{ color: '#6B7280', fontSize: '14px' }}>
              建议光线: &gt;150 lux
            </div>
          </div>

          <div style={{ 
            background: '#FEF3C7',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              fontWeight: '600', 
              marginBottom: '8px',
              color: '#92400E'
            }}>
              🔧 改善建议：
            </div>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              fontSize: '14px',
              color: '#451A03'
            }}>
              <li style={{ marginBottom: '4px' }}>• 打开桌面台灯</li>
              <li style={{ marginBottom: '4px' }}>• 增加室内照明</li>
              <li style={{ marginBottom: '4px' }}>• 调整屏幕亮度</li>
            </ul>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleRetry}
            style={{ width: '100%', marginBottom: '16px' }}
          >
            重新检测
          </button>
        </div>
        
        <div className="popup-footer">
          <button 
            className="btn btn-secondary"
            onClick={handleIgnore}
          >
            忽略继续
          </button>
          <button className="btn btn-secondary">
            设置提醒
          </button>
        </div>
      </div>
    );
  }

  // 检测中界面
  return (
    <div className="popup-container">
      <div className="popup-header">
        环境光检测中... 💡
      </div>
      
      <div className="popup-content">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="progress-bar" style={{ marginBottom: '16px' }}>
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#10B981' }}>
            {progress}%
          </div>
        </div>

        <p style={{ 
          textAlign: 'center', 
          color: '#6B7280',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          正在分析您的工作环境光线强度
        </p>

        {isDetecting && (
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ marginBottom: '8px' }}></div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>
              请保持摄像头前方明亮...
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 