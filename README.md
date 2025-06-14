# 姿势守护者 (Posture Guardian)

实时监测坐姿并给予友好提醒的Chrome扩展，采用Multi-Agent开发模式，使用MediaPipe BlazePose进行姿势检测，所有处理均在本地进行以保护隐私。

## 🚨 最新修复 (用户体验优化)

### ⚡ 问题解决
针对用户反馈的"倾斜时有时没反应"和"坐直了反而提醒"问题，进行了重大优化：

#### 🔧 **检测敏感度提升**
- **置信度阈值**: 0.5 → 0.3 (更容易检测到姿势变化)
- **头部前倾阈值**: 15° → 12° (更敏感的警告)
- **危险角度阈值**: 25° → 20° (更及时的危险提醒)
- **肩膀倾斜阈值**: 8° → 6° (更早发现问题)

#### ⚡ **状态重置优化**
- **立即重置**: 姿势良好时立刻清除所有提醒状态
- **定时器管理**: 使用清晰的定时器避免延迟冲突
- **冷却期保护**: 冷却期内跳过坏姿势处理，避免误报

#### 🎯 **用户体验改进**
- **即时反馈**: 第一次倾斜立即图标变色
- **状态同步**: 改正姿势立即恢复绿色图标
- **逻辑清晰**: 移除复杂的延迟机制导致的困惑

#### 🔊 **音频系统修复**
- **消息传递**: 修复Content Script对音频提醒消息的监听
- **音效播放**: 完善Web Audio API音效生成
- **时机优化**: 电脑工作模式5秒后直接声音提醒

#### ⏱️ **响应速度优化**
- **自适应检测**: 好姿势1秒检测，坏姿势0.5秒检测
- **及时变化**: 状态改变更快反映到图标颜色

### 📋 **现在的表现**
✅ **倾斜 → 立即图标变红**  
✅ **坐直 → 立即图标变绿**  
✅ **5秒坏姿势 → 准时声音提醒**  
✅ **改正后 → 所有状态立即重置**  
✅ **三种音效 → 明显区别**

## 🎯 项目目标

帮助电脑工作者和学生保持良好坐姿，通过智能、非干扰的方式提醒用户调整姿势，预防颈椎和脊椎问题。

## ✨ 核心功能

### 1. 智能姿势检测
- 使用MediaPipe BlazePose进行实时姿势分析
- 检测头部前倾、肩膀倾斜等不良姿势
- 本地处理，保护用户隐私

### 2. 场景自适应提醒
- **🖥️ 电脑工作模式**: 图标变色 → 轻柔弹窗 → 声音提醒
- **📚 学习阅读模式**: 图标变色 → 直接声音提醒（适合看书做作业）
- **⚙️ 自定义模式**: 个性化配置所有参数

### 3. 智能冷却机制
- 提醒后5分钟内静默，避免频繁打扰
- 给用户充分时间调整和适应
- 智能学习用户习惯

### 4. 环境光检测
- 首次使用检测环境光线是否充足
- 提供改善建议
- 可选择忽略继续使用

## 🚀 开发进度

### ✅ 已完成功能

#### 第一阶段：项目架构和设计 (100%)
- [x] 完整的原型设计 (`docs/wireframes.md`)
- [x] 用户流程设计 (`docs/user-flow.md`) 
- [x] 组件规范 (`docs/component-specs.md`)
- [x] 开发指南 (`docs/development-guide.md`)
- [x] 场景自适应提醒策略设计

#### 第二阶段：基础框架搭建 (100%)
- [x] 项目初始化和依赖配置
- [x] TypeScript + React + Vite 开发环境
- [x] Chrome扩展基础配置 (manifest.json)
- [x] 目录结构和模块化设计
- [x] CSS设计系统和全局样式

#### 第三阶段：核心组件开发 (100%)
- [x] 权限申请组件 (`PermissionRequest.tsx`)
- [x] 环境光检测组件 (`LightDetection.tsx`)
- [x] 姿势监控主界面 (`PostureMonitor.tsx`)
- [x] 姿势提醒组件 (`PostureAlert.tsx`)
- [x] 主应用状态管理 (`App.tsx`)

#### 第四阶段：后台服务和内容脚本 (100%)
- [x] Background Script (`src/background/index.ts`)
  - 扩展状态管理
  - 消息传递系统
  - 图标状态更新
  - 通知管理
- [x] Content Script (`src/content/index.ts`)
  - 用户活动检测
  - 温和提醒系统
  - 音效管理
  - 模式检测

#### 第五阶段：设置页面 (100%)
- [x] 完整的设置界面 (`src/options/index.html`)
- [x] 使用场景选择
- [x] 提醒参数配置
- [x] 高级设置选项
- [x] 数据导出功能

#### 第六阶段：构建和部署 (100%)
- [x] 项目成功构建
- [x] 占位图标创建
- [x] 构建配置优化
- [x] 扩展包生成

#### 第七阶段：姿势检测核心 (100%)
- [x] MediaPipe BlazePose集成 (`src/shared/utils/postureDetector.ts`)
- [x] 摄像头管理器 (`src/shared/utils/cameraManager.ts`)
- [x] 姿势监控服务 (`src/shared/services/postureMonitoringService.ts`)
- [x] Content Script监控入口 (`src/content/postureMonitoringEntry.ts`)
- [x] Background Script消息处理
- [x] 实时姿势分析算法
- [x] 头部前倾和肩膀倾斜检测
- [x] 置信度计算和过滤
- [x] 错误处理和用户反馈

### 🔄 待完成功能

#### 第八阶段：智能提醒系统 (0%)
- [ ] 场景自动切换优化
- [ ] 智能学习算法
- [ ] 用户行为分析
- [ ] 个性化适应
- [ ] 提醒效果优化

#### 第九阶段：测试和优化 (0%)
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] 用户体验测试
- [ ] 真实环境测试

#### 第十阶段：发布准备 (0%)
- [ ] 专业图标设计
- [ ] 多语言支持
- [ ] 用户文档
- [ ] Chrome Web Store发布

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite + @crxjs/vite-plugin
- **姿势检测**: MediaPipe BlazePose
- **状态管理**: Zustand
- **样式系统**: CSS Variables + 自定义设计系统
- **开发工具**: ESLint + TypeScript

## 📁 项目结构

```
posture-guardian/
├── src/
│   ├── shared/           # 共享类型和样式
│   ├── popup/            # 弹窗界面
│   ├── background/       # 后台脚本
│   ├── content/          # 内容脚本
│   └── options/          # 设置页面
├── docs/                 # 设计文档
├── public/               # 静态资源
└── dist/                 # 构建输出
```

## 🎨 设计特点

### 界面设计
| 设计原则 | 具体体现 |
|----------|----------|
| **场景自适应提醒** | 🖥️ 电脑工作模式：图标(10秒) → 弹窗(1分钟) → 声音 <br> 📚 学习阅读模式：图标(10秒) → 直接声音提醒 |
| **智能冷却机制** | 提醒后5分钟内静默，避免频繁打扰，给用户充分调整时间 |
| **零干扰体验** | 前两级提醒无需用户操作，学习模式快速升级到有效的声音提醒 |
| **上下文感知** | 自动检测Chrome窗口状态和用户活动，智能切换提醒策略 |
| **隐私优先** | 首次使用清晰说明摄像头权限用途和数据处理方式 |

### 智能场景识别
| 使用场景 | 检测特征 | 提醒策略 | 适用人群 |
|----------|----------|----------|----------|
| 🖥️ **电脑工作模式** | Chrome窗口活跃<br>鼠标键盘操作频繁 | 图标变色 → 轻柔弹窗 → 声音提醒 | 办公人员<br>程序员<br>网页设计师 |
| 📚 **学习阅读模式** | Chrome最小化<br>长时间无电脑操作 | 图标变色 → 直接声音提醒 | 学生做作业<br>看书学习<br>纸质材料阅读 |
| ⚙️ **自定义模式** | 用户手动设置 | 个性化配置 | 特殊需求用户 |

## 🚀 快速开始

### 开发环境设置

```bash
# 克隆项目
git clone <repository-url>
cd posture-guardian

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建项目
npm run build
```

### 安装扩展

1. 打开Chrome浏览器
2. 进入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 📋 开发计划

### 近期目标 (1-2周)
- [ ] 完成MediaPipe姿势检测集成
- [ ] 实现基础的姿势分析算法
- [ ] 完善智能提醒逻辑

### 中期目标 (1个月)
- [ ] 完成所有核心功能
- [ ] 进行用户测试和反馈收集
- [ ] 性能优化和bug修复

### 长期目标 (2-3个月)
- [ ] 专业UI/UX设计
- [ ] 多语言支持
- [ ] Chrome Web Store发布

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

---

**当前状态**: 姿势检测核心已完成，MediaPipe BlazePose成功集成

**完成度**: 70% (7/10 阶段完成)

**最后更新**: 2024年12月1日

## 🎉 重要里程碑

### 已实现的核心功能
✅ **完整的Chrome扩展框架** - 所有基础组件和页面已完成  
✅ **MediaPipe BlazePose集成** - 实时姿势检测算法已实现  
✅ **智能场景识别** - 自动区分电脑工作和学习阅读模式  
✅ **多级提醒系统** - 图标变色 → 温和弹窗 → 声音提醒  
✅ **摄像头管理** - 完整的权限处理和错误管理  
✅ **消息传递系统** - Background Script和Content Script通信  

### 技术特点
🔧 **TypeScript + React** - 类型安全的现代开发框架  
🎯 **MediaPipe BlazePose** - Google的高精度姿势检测  
🛡️ **隐私保护** - 所有处理均在本地进行  
⚡ **性能优化** - 智能检测间隔和置信度过滤  
🎨 **现代UI** - 美观的设计系统和用户体验  

### 下一步计划
🔄 **智能提醒优化** - 提升提醒效果和用户体验  
🧪 **全面测试** - 单元测试、集成测试和真实环境验证  
🚀 **发布准备** - 专业图标设计和Chrome Web Store上架

## 🚨 紧急故障排除指南

### 问题：Console完全没有输出

如果打开Chrome控制台没有看到任何日志输出，请按以下步骤检查：

#### 1. 检查扩展加载状态
1. 打开Chrome → 更多工具 → 扩展程序 (或地址栏输入 `chrome://extensions/`)
2. 确认**姿势守护者**扩展已启用
3. 如果显示错误，点击"错误"查看详情

#### 2. 强制重新加载扩展
1. 在扩展程序页面点击**刷新**按钮（🔄）
2. 或点击**移除** → 重新**加载已解压的扩展程序**
3. 选择项目的 `dist` 文件夹

#### 3. 检查Console正确性
1. 确保在正确的页面打开Console（任意网页，如Google首页）
2. **不要**在 `chrome://extensions/` 页面检查Console
3. F12 → Console 标签页

#### 4. 验证构建产物
确认 `dist` 目录包含以下文件：
```
dist/
├── manifest.json
├── assets/index.ts-loader.aa85cc71.js
├── chunks/index.ts.7a77b5bb.js
└── 其他文件...
```

#### 5. 预期的Console输出
如果扩展正常加载，您应该看到：
```
Content Script onExecute 被调用
启动Content Script系统...
姿势监控入口已创建: PostureMonitoringEntry {...}
正在自动初始化姿势监控...
🔄 直接调用初始化方法...
```

#### 6. 如果仍无输出
1. 重启Chrome浏览器
2. 重新运行 `npm run build`
3. 重新加载扩展
4. 确认没有其他扩展冲突

如果以上步骤都无效，请检查Chrome版本是否支持Manifest V3（Chrome 88+）。

## 📋 功能特性

### 🎯 智能姿势监控
- **实时检测**: 使用MediaPipe BlazePose技术实时分析身体姿势
- **多维度判断**: 综合头部前倾角度和肩膀倾斜度评估姿势健康度
- **高精度识别**: 基于33个关键点的精确姿势分析

### ⚡ 基于时间的智能提醒系统
新版本采用更人性化的**时间驱动提醒逻辑**，而非简单的次数统计：

#### 💻 电脑工作模式 (渐进式提醒)
1. **第1次检测到坏姿势** → 🔴 图标变色
2. **连续5秒没改正** → 💬 温和弹窗提醒  
3. **再连续5秒没改正** → 🔊 声音提醒
4. **完整周期后** → ⏰ 5分钟冷却期

#### 📚 学习阅读模式 (快速提醒)
1. **第1次检测到坏姿势** → 🔴 图标变色
2. **连续5秒没改正** → 🔊 直接声音提醒
3. **完整周期后** → ⏰ 5分钟冷却期

#### 🔇 静音模式 (仅视觉提醒)
1. **第1次检测到坏姿势** → 🔴 图标变色
2. **连续5秒没改正** → 💬 强化弹窗提醒（更明显）
3. **完整周期后** → ⏰ 5分钟冷却期

### ⚙️ 高度可配置
- **提醒延迟**: 3秒/5秒/10秒 (第一次提醒延迟)
- **升级延迟**: 3秒/5秒/10秒 (第二次提醒延迟)  
- **冷却期**: 3分钟/5分钟/10分钟
- **检测间隔**: 2秒/5秒/10秒
- **音效选择**: 3种不同音调和音色
- **音量调节**: 0-100% 可调节

## 📋 **开发规范**

### **改动后检查流程**
参见: `scripts/check-after-changes.md`

**每次代码修改必须执行**:
1. 构建验证 (npm run build)
2. 扩展重新加载  
3. 基础功能验证
4. 核心功能测试

**验收标准**:
- 姿势变化1秒内图标更新
- 坏姿势5秒准时提醒
- 改正姿势立即停止提醒
