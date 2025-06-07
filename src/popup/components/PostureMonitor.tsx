import { useState, useEffect } from 'react';
import { PostureStatus, UsageMode } from '@shared/types';

interface PostureMonitorProps {
  currentStatus: PostureStatus;
  onPostureChange: (status: PostureStatus) => void;
  onOpenSettings: () => void;
}

export default function PostureMonitor({ 
  currentStatus, 
  onPostureChange, 
  onOpenSettings 
}: PostureMonitorProps) {
  const [monitoringDuration, setMonitoringDuration] = useState(0);
  const [todayStats] = useState({
    good: 85,
    warning: 12,
    danger: 3,
    totalTime: 8.5
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [currentMode, setCurrentMode] = useState<UsageMode>(UsageMode.COMPUTER_WORK);

  // 加载保存的模式状态
  useEffect(() => {
    const loadSavedMode = async () => {
      try {
        const result = await chrome.storage.sync.get(['usageMode']);
        if (result.usageMode) {
          setCurrentMode(result.usageMode);
          console.log('加载保存的模式:', result.usageMode);
        }
      } catch (error) {
        console.error('加载模式状态失败:', error);
      }
    };

    loadSavedMode();

    // 监听storage变化（跨标签页同步）
    const handleStorageChange = (changes: any) => {
      if (changes.usageMode) {
        setCurrentMode(changes.usageMode.newValue);
        console.log('模式状态同步更新:', changes.usageMode.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 监控时长计时器
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMonitoring) {
        setMonitoringDuration(prev => prev + 1);
      }
    }, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // 模拟姿势检测 (实际应该从content script接收)
  useEffect(() => {
    const simulatePostureDetection = () => {
      // 模拟随机姿势状态变化
      const random = Math.random();
      let newStatus: PostureStatus;
      
      if (random < 0.8) {
        newStatus = PostureStatus.GOOD;
      } else if (random < 0.95) {
        newStatus = PostureStatus.WARNING;
      } else {
        newStatus = PostureStatus.DANGER;
      }
      
      if (newStatus !== currentStatus) {
        onPostureChange(newStatus);
      }
    };

    const interval = setInterval(simulatePostureDetection, 10000); // 每10秒检查一次
    return () => clearInterval(interval);
  }, [currentStatus, onPostureChange]);

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

  const getStatusColor = (status: PostureStatus) => {
    switch (status) {
      case PostureStatus.GOOD: return '#10B981';
      case PostureStatus.WARNING: return '#F59E0B';
      case PostureStatus.DANGER: return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins}分`;
  };

  const handleToggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  const handleOpenHistory = () => {
    // 打开历史记录页面 (可以在设置页面中实现)
    onOpenSettings();
  };

  // 新增：处理模式切换
  const handleModeChange = (mode: UsageMode) => {
    setCurrentMode(mode);
    
    // 发送消息给content script更新模式
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'UPDATE_MONITORING_SETTINGS',
          data: { usageMode: mode }
        }).catch(() => {
          console.log('发送模式更新消息失败');
        });
      }
    });

    // 保存到本地存储
    chrome.storage.sync.set({ usageMode: mode });
    
    console.log('切换到模式:', mode);
  };

  // 获取模式配置
  const getModeConfig = (mode: UsageMode) => {
    switch (mode) {
      case UsageMode.COMPUTER_WORK:
        return {
          icon: '💻',
          name: '电脑工作',
          description: '图标→弹窗→声音',
          color: '#3B82F6'
        };
      case UsageMode.STUDY_READING:
        return {
          icon: '📚',
          name: '学习阅读',
          description: '图标→直接声音',
          color: '#10B981'
        };
      case UsageMode.SILENT:
        return {
          icon: '🎧',
          name: '静音模式',
          description: '仅视觉提醒',
          color: '#8B5CF6'
        };
      default:
        return {
          icon: '⚙️',
          name: '自定义',
          description: '个性化设置',
          color: '#6B7280'
        };
    }
  };

  return (
    <div className="popup-container">
      <div className="popup-header">
        姿势监控中 📐
      </div>
      
      <div className="popup-content">
        {/* 实时姿势显示 */}
        <div className="posture-display">
          <div className={`posture-avatar ${currentStatus}`}>
            {getStatusEmoji(currentStatus)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: getStatusColor(currentStatus)
            }}>
              当前状态：{getStatusText(currentStatus)}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6B7280' 
            }}>
              监控时长：{formatDuration(monitoringDuration)}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: isMonitoring ? '#10B981' : '#EF4444',
              marginTop: '4px'
            }}>
              {isMonitoring ? '● 监控中' : '○ 已暂停'}
            </div>
          </div>
        </div>

        {/* 场景模式选择 */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '600' 
          }}>
            🎯 场景模式：
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '8px' 
          }}>
            {[UsageMode.COMPUTER_WORK, UsageMode.STUDY_READING, UsageMode.SILENT].map(mode => {
              const config = getModeConfig(mode);
              const isActive = currentMode === mode;
              
              return (
                <button 
                  key={mode}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    fontSize: '11px', 
                    padding: '8px 4px',
                    minHeight: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    backgroundColor: isActive ? config.color : undefined,
                    borderColor: isActive ? config.color : undefined,
                    color: isActive ? 'white' : undefined
                  }}
                  onClick={() => handleModeChange(mode)}
                >
                  <div style={{ fontSize: '16px' }}>{config.icon}</div>
                  <div style={{ fontWeight: '600' }}>{config.name}</div>
                  <div style={{ 
                    fontSize: '9px', 
                    opacity: 0.8,
                    lineHeight: '1.2'
                  }}>
                    {config.description}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* 当前模式说明 */}
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#F3F4F6',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#4B5563'
          }}>
            {(() => {
              switch (currentMode) {
                case UsageMode.COMPUTER_WORK:
                  return '💻 适合办公环境，渐进式提醒避免干扰工作';
                case UsageMode.STUDY_READING:
                  return '📚 适合看书学习，快速音效提醒保持专注';
                case UsageMode.SILENT:
                  return '🎧 会议或特殊场合，只有视觉提醒无声音';
                default:
                  return '⚙️ 个性化配置，在设置页面自定义参数';
              }
            })()}
          </div>
        </div>

        {/* 今日统计 */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '16px', 
            fontWeight: '600' 
          }}>
            📊 今日统计：
          </h4>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '8px' 
          }}>
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
          
          <div style={{ 
            textAlign: 'center', 
            marginTop: '12px', 
            fontSize: '14px', 
            color: '#6B7280' 
          }}>
            总时长：{todayStats.totalTime}小时
          </div>
        </div>

        {/* 主要操作按钮 */}
        <button 
          className={`btn ${isMonitoring ? 'btn-warning' : 'btn-primary'}`}
          onClick={handleToggleMonitoring}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          {isMonitoring ? '暂停监控' : '开始监控'}
        </button>
      </div>

      {/* 底部导航 */}
      <div className="popup-footer">
        <button 
          className="btn btn-secondary"
          onClick={onOpenSettings}
        >
          设置
        </button>
        <button 
          className="btn btn-secondary"
          onClick={handleOpenHistory}
        >
          历史记录
        </button>
      </div>
    </div>
  );
} 