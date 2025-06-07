import { createRoot } from 'react-dom/client';
import App from './App';

// 确保CSS样式被正确导入
import '../shared/styles/globals.css';

const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('无法找到popup-root容器');
} 