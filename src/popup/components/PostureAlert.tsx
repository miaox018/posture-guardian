import { PostureStatus } from '@shared/types';

interface PostureAlertProps {
  postureStatus: PostureStatus;
  onAcknowledge: () => void;
  onOpenSettings: () => void;
}

export default function PostureAlert({ 
  postureStatus, 
  onAcknowledge, 
  onOpenSettings 
}: PostureAlertProps) {
  
  const getAlertInfo = (status: PostureStatus) => {
    switch (status) {
      case PostureStatus.WARNING:
        return {
          emoji: '😊',
          title: '轻微姿势问题',
          problem: '颈部轻微前倾',
          color: '#F59E0B',
          bgColor: '#FEF3C7'
        };
      case PostureStatus.DANGER:
        return {
          emoji: '😰',
          title: '姿势需要调整',
          problem: '颈部明显前倾',
          color: '#EF4444',
          bgColor: '#FEF2F2'
        };
      default:
        return {
          emoji: '😊',
          title: '姿势提醒',
          problem: '检测到异常',
          color: '#F59E0B',
          bgColor: '#FEF3C7'
        };
    }
  };

  const alertInfo = getAlertInfo(postureStatus);

  const getSuggestions = (status: PostureStatus) => {
    const commonSuggestions = [
      '抬起头部，视线平视屏幕',
      '肩膀放松，避免耸肩',
      '调整椅子高度到合适位置'
    ];

    if (status === PostureStatus.DANGER) {
      return [
        '立即调整坐姿，挺直背部',
        '将屏幕调整到视线平行位置',
        '每30分钟起身活动一下',
        '考虑使用外接键盘和鼠标'
      ];
    }

    return commonSuggestions;
  };

  return (
    <div className="popup-container">
      <div className="popup-header" style={{ background: alertInfo.color }}>
        姿势提醒 💡
      </div>
      
      <div className="popup-content">
        {/* 姿势状态显示 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          padding: '16px',
          background: alertInfo.bgColor,
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            fontSize: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            background: '#FFFFFF',
            borderRadius: '50%',
            border: `3px solid ${alertInfo.color}`
          }}>
            {alertInfo.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: alertInfo.color === '#EF4444' ? '#B91C1C' : '#92400E'
            }}>
              检测到：{alertInfo.problem}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6B7280' 
            }}>
              持续时间：15分钟
            </div>
          </div>
        </div>

        {/* 建议内容 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            💡 温馨建议：
          </div>
          
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            fontSize: '14px',
            color: '#374151'
          }}>
            {getSuggestions(postureStatus).map((suggestion, index) => (
              <li key={index} style={{ 
                marginBottom: '8px',
                paddingLeft: '16px',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  color: alertInfo.color,
                  fontWeight: '600'
                }}>
                  •
                </span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* 智能提醒说明 */}
        <div style={{ 
          background: '#F3F4F6',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ⏰ <span style={{ fontWeight: '500' }}>智能提醒策略：</span>
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6B7280',
            marginTop: '4px'
          }}>
            系统将温和地观察您的调整情况，提醒后5分钟内不再打扰
          </div>
        </div>

        {/* 确认按钮 */}
        <button 
          className="btn btn-primary"
          onClick={onAcknowledge}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          我知道了
        </button>
      </div>

      {/* 底部操作 */}
      <div className="popup-footer">
        <button 
          className="btn btn-secondary"
          onClick={onOpenSettings}
        >
          打开设置
        </button>
        <div style={{ 
          fontSize: '12px', 
          color: '#6B7280',
          textAlign: 'center',
          flex: 1
        }}>
          {postureStatus === PostureStatus.DANGER ? '严重' : '轻微'}提醒
        </div>
      </div>
    </div>
  );
} 