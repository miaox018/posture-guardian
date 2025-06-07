// 摄像头管理器
export class CameraManager {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private isInitialized = false;

  constructor() {
    this.createVideoElement();
  }

  // 创建视频元素
  private createVideoElement() {
    this.video = document.createElement('video');
    this.video.style.display = 'none'; // 隐藏视频元素
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;
    
    // 将视频元素添加到body（但不可见）
    document.body.appendChild(this.video);
  }

  // 申请摄像头权限并初始化
  async initialize(): Promise<boolean> {
    try {
      // 申请摄像头权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: 'user' // 前置摄像头
        }
      });

      if (!this.video) {
        this.createVideoElement();
      }

      // 设置视频源
      this.video!.srcObject = this.stream;
      
      // 等待视频加载完成
      await new Promise<void>((resolve, reject) => {
        this.video!.onloadedmetadata = () => {
          this.video!.play().then(resolve).catch(reject);
        };
        this.video!.onerror = reject;
      });

      this.isInitialized = true;
      console.log('摄像头初始化成功');
      return true;

    } catch (error) {
      console.error('摄像头初始化失败:', error);
      this.handleCameraError(error as Error);
      return false;
    }
  }

  // 处理摄像头错误
  private handleCameraError(error: Error) {
    let errorMessage = '摄像头访问失败';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = '摄像头权限被拒绝，请在浏览器设置中开启摄像头权限';
    } else if (error.name === 'NotFoundError') {
      errorMessage = '未找到摄像头设备';
    } else if (error.name === 'NotReadableError') {
      errorMessage = '摄像头正在被其他应用使用';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = '摄像头不支持请求的配置';
    }

    // 通知用户错误信息
    console.error(errorMessage, error);
    
    // 可以在这里发送消息给popup显示错误
    chrome.runtime.sendMessage({
      type: 'CAMERA_ERROR',
      data: { message: errorMessage, error: error.name }
    }).catch(() => {
      // 忽略发送失败
    });
  }

  // 获取视频元素
  getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  // 获取媒体流
  getStream(): MediaStream | null {
    return this.stream;
  }

  // 检查初始化状态
  isReady(): boolean {
    return this.isInitialized && this.video !== null && this.stream !== null;
  }

  // 暂停摄像头
  pause() {
    if (this.video) {
      this.video.pause();
    }
  }

  // 恢复摄像头
  resume() {
    if (this.video) {
      this.video.play().catch(console.error);
    }
  }

  // 获取摄像头列表
  async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('获取摄像头设备列表失败:', error);
      return [];
    }
  }

  // 切换摄像头
  async switchCamera(deviceId: string): Promise<boolean> {
    try {
      // 停止当前流
      this.stopStream();

      // 获取新的流
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });

      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }

      return true;
    } catch (error) {
      console.error('切换摄像头失败:', error);
      return false;
    }
  }

  // 停止摄像头流
  private stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
  }

  // 清理资源
  dispose() {
    this.stopStream();
    
    if (this.video) {
      if (this.video.parentNode) {
        this.video.parentNode.removeChild(this.video);
      }
      this.video = null;
    }
    
    this.isInitialized = false;
  }

  // 检查摄像头权限状态
  static async checkPermissionStatus(): Promise<PermissionState> {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return permission.state;
    } catch (error) {
      console.error('检查摄像头权限失败:', error);
      return 'denied';
    }
  }

  // 测试摄像头是否可用
  static async testCameraAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1, height: 1 } 
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  // 获取视频尺寸信息
  getVideoInfo(): { width: number; height: number; } | null {
    if (!this.video) return null;
    
    return {
      width: this.video.videoWidth,
      height: this.video.videoHeight
    };
  }

  // 截取当前帧
  captureFrame(): ImageData | null {
    if (!this.video || !this.isInitialized) return null;

    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.video, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
} 