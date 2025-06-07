# Chrome扩展开发检查清单

## 📋 **构建前检查**

### **基础配置**
- [ ] manifest.json 语法正确
- [ ] 所有引用的文件路径存在
- [ ] 图标文件格式一致 (.png vs .bmp)
- [ ] 权限配置完整

### **Content Script**
- [ ] 导出必需的函数 (onExecute)
- [ ] 匹配规则正确 (<all_urls>)
- [ ] 注入时机合适 (document_start)

### **Background Script** 
- [ ] Service Worker配置正确
- [ ] 消息监听器完整
- [ ] 图标路径与实际文件匹配

## 🔍 **构建后验证**

### **文件存在性**
```bash
dist/
├── manifest.json ✓
├── service-worker-loader.js ✓
├── assets/icons/*.bmp ✓
└── chunks/index.ts.*.js ✓
```

### **功能测试**
- [ ] 扩展能正常加载 (无红色错误)
- [ ] Service Worker 正常运行
- [ ] Content Script 注入成功
- [ ] Console 有预期日志输出

## 🚨 **常见陷阱**

1. **图标格式不匹配**: 代码用.png但文件是.bmp
2. **Content Script导出缺失**: onExecute函数未导出
3. **路径引用错误**: 相对路径计算错误
4. **构建工具配置**: Vite/CRXJS插件配置问题

## ⚡ **自动化检查**

运行诊断脚本:
```bash
npm run diagnose
```

预期输出：
```
🎉 所有检查通过！扩展应该可以正常工作。
``` 