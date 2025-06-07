import { Pose, Results, NormalizedLandmark } from '@mediapipe/pose';
import { PostureDetectionResult, PostureStatus } from '@shared/types';

// MediaPipe BlazePose姿势检测器
export class PostureDetector {
  private pose: Pose | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private isInitialized = false;
  private isDetecting = false;
  private onResultCallback?: (result: PostureDetectionResult) => void;

  constructor() {
    this.initializePose();
  }

  // 初始化MediaPipe Pose
  private async initializePose() {
    try {
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.pose.onResults(this.onResults.bind(this));
      this.isInitialized = true;
      console.log('MediaPipe Pose 初始化完成');
    } catch (error) {
      console.error('MediaPipe Pose 初始化失败:', error);
    }
  }

  // 处理检测结果
  private onResults(results: Results) {
    if (!results.poseLandmarks || !this.onResultCallback) {
      return;
    }

    const landmarks = results.poseLandmarks;
    const postureAnalysis = this.analyzePosture(landmarks);
    
    this.onResultCallback(postureAnalysis);

    // 可选：在canvas上绘制关键点（调试用）
    if (this.canvasCtx && this.canvas) {
      this.drawLandmarks(landmarks);
    }
  }

  // 分析姿势
  private analyzePosture(landmarks: NormalizedLandmark[]): PostureDetectionResult {
    const headTiltAngle = this.calculateHeadTiltAngle(landmarks);
    const shoulderTiltAngle = this.calculateShoulderTiltAngle(landmarks);
    
    // 计算置信度（基于关键点的可见性）
    const confidence = this.calculateConfidence(landmarks);
    
    // 判断姿势状态
    const status = this.determinePostureStatus(headTiltAngle, shoulderTiltAngle);

    return {
      status,
      confidence,
      landmarks,
      headTiltAngle,
      shoulderTiltAngle,
      timestamp: Date.now()
    };
  }

  // 计算头部前倾角度
  private calculateHeadTiltAngle(landmarks: NormalizedLandmark[]): number {
    const nose = landmarks[0];           // 鼻子
    const leftEar = landmarks[7];        // 左耳
    const rightEar = landmarks[8];       // 右耳
    const leftShoulder = landmarks[11];  // 左肩
    const rightShoulder = landmarks[12]; // 右肩

    if (!nose || !leftEar || !rightEar || !leftShoulder || !rightShoulder) {
      return 0;
    }

    // 计算头部中心点（耳朵的中点）
    const headCenter = {
      x: (leftEar.x + rightEar.x) / 2,
      y: (leftEar.y + rightEar.y) / 2
    };

    // 计算肩膀中心点
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };

    // 理想情况下，头部应该在肩膀正上方
    // 计算头部相对于肩膀的前倾程度
    const horizontalOffset = Math.abs(headCenter.x - shoulderCenter.x);
    const verticalDistance = Math.abs(shoulderCenter.y - headCenter.y);
    
    // 防止除零错误
    if (verticalDistance < 0.01) {
      return 0;
    }
    
    // 计算前倾角度（使用反正切）
    const tiltAngle = Math.atan(horizontalOffset / verticalDistance) * (180 / Math.PI);
    
    // 添加调试日志
    console.log('🔍 姿势检测详情:', {
      headCenter: { x: headCenter.x.toFixed(3), y: headCenter.y.toFixed(3) },
      shoulderCenter: { x: shoulderCenter.x.toFixed(3), y: shoulderCenter.y.toFixed(3) },
      horizontalOffset: horizontalOffset.toFixed(3),
      verticalDistance: verticalDistance.toFixed(3),
      tiltAngle: tiltAngle.toFixed(1) + '°'
    });
    
    return tiltAngle;
  }

  // 计算肩膀倾斜角度
  private calculateShoulderTiltAngle(landmarks: NormalizedLandmark[]): number {
    const leftShoulder = landmarks[11];   // 左肩
    const rightShoulder = landmarks[12];  // 右肩

    if (!leftShoulder || !rightShoulder) {
      return 0;
    }

    // 计算肩膀连线与水平线的角度
    const deltaY = rightShoulder.y - leftShoulder.y;
    const deltaX = rightShoulder.x - leftShoulder.x;
    
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    return Math.abs(angle);
  }

  // 计算检测置信度
  private calculateConfidence(landmarks: NormalizedLandmark[]): number {
    const keyPoints = [0, 7, 8, 11, 12]; // 关键点索引
    let totalVisibility = 0;
    let validPoints = 0;

    keyPoints.forEach(index => {
      if (landmarks[index]) {
        totalVisibility += landmarks[index].visibility || 0;
        validPoints++;
      }
    });

    return validPoints > 0 ? totalVisibility / validPoints : 0;
  }

  // 判断姿势状态
  private determinePostureStatus(headTiltAngle: number, shoulderTiltAngle: number): PostureStatus {
    // 降低阈值，让检测更敏感
    const headTiltThreshold = 12;    // 头部前倾警告阈值 (从15降到12)
    const headTiltDanger = 20;       // 头部前倾危险阈值 (从25降到20)
    const shoulderTiltThreshold = 6; // 肩膀倾斜警告阈值 (从8降到6)
    const shoulderTiltDanger = 12;   // 肩膀倾斜危险阈值 (从15降到12)

    // 判断危险状态
    if (headTiltAngle > headTiltDanger || shoulderTiltAngle > shoulderTiltDanger) {
      return PostureStatus.DANGER;
    }

    // 判断警告状态
    if (headTiltAngle > headTiltThreshold || shoulderTiltAngle > shoulderTiltThreshold) {
      return PostureStatus.WARNING;
    }

    // 良好状态
    return PostureStatus.GOOD;
  }

  // 在canvas上绘制关键点（调试用）
  private drawLandmarks(landmarks: NormalizedLandmark[]) {
    if (!this.canvasCtx || !this.canvas) return;

    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制关键点
    landmarks.forEach((landmark) => {
      if (landmark.visibility && landmark.visibility > 0.5) {
        const x = landmark.x * this.canvas!.width;
        const y = landmark.y * this.canvas!.height;
        
        this.canvasCtx!.beginPath();
        this.canvasCtx!.arc(x, y, 3, 0, 2 * Math.PI);
        this.canvasCtx!.fillStyle = '#00FF00';
        this.canvasCtx!.fill();
      }
    });
  }

  // 开始检测
  async startDetection(
    videoElement: HTMLVideoElement,
    onResult: (result: PostureDetectionResult) => void,
    canvasElement?: HTMLCanvasElement
  ): Promise<boolean> {
    if (!this.isInitialized || !this.pose) {
      console.error('MediaPipe Pose 未初始化');
      return false;
    }

    this.video = videoElement;
    this.onResultCallback = onResult;
    
    if (canvasElement) {
      this.canvas = canvasElement;
      this.canvasCtx = canvasElement.getContext('2d');
    }

    this.isDetecting = true;
    
    // 开始检测循环
    this.detectLoop();
    
    return true;
  }

  // 检测循环
  private async detectLoop() {
    if (!this.isDetecting || !this.video || !this.pose) {
      return;
    }

    if (this.video.videoWidth > 0 && this.video.videoHeight > 0) {
      await this.pose.send({ image: this.video });
    }

    // 继续下一次检测
    if (this.isDetecting) {
      requestAnimationFrame(() => this.detectLoop());
    }
  }

  // 停止检测
  stopDetection() {
    this.isDetecting = false;
    this.onResultCallback = undefined;
  }

  // 清理资源
  dispose() {
    this.stopDetection();
    
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    
    this.video = null;
    this.canvas = null;
    this.canvasCtx = null;
    this.isInitialized = false;
  }

  // 获取初始化状态
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  // 获取检测状态
  getDetectionStatus(): boolean {
    return this.isDetecting;
  }
} 