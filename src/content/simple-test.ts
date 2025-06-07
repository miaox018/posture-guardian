// 极简Content Script - 用于测试基本加载功能
console.log('🎯 极简Content Script已加载！', {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  readyState: document.readyState
});

// 设置全局标识符
(window as any).postureGuardianContentScript = {
  version: '0.1.0-simple',
  loadTime: new Date().toISOString(),
  initialized: true,
  mode: 'simple-test'
};

// 导出onExecute函数
export function onExecute() {
  console.log('🚀 极简onExecute被调用');
  console.log('📍 Chrome API可用:', typeof chrome !== 'undefined');
  console.log('📍 扩展ID:', chrome?.runtime?.id);
  
  // 再次设置全局标识符，确保在onExecute中也能被检测到
  (window as any).postureGuardianContentScript = {
    version: '0.1.0-simple',
    loadTime: new Date().toISOString(),
    initialized: true,
    mode: 'simple-test',
    onExecuteCalled: true
  };
  console.log('🏷️ 全局标识符已在onExecute中重新设置');
  
  // 创建一个简单的消息监听器
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      console.log('📨 收到消息:', message);
      sendResponse({ received: true, timestamp: Date.now() });
      return true;
    });
    console.log('✅ 消息监听器已设置');
  }
  
  console.log('🎉 极简Content Script初始化完成');
}

console.log('📁 极简Content Script文件加载完成'); 