# DMC Answer Bot Panel

智能机器人问答数据看板，用于分析和可视化问答数据。

## 功能特性

- 📊 数据可视化：问答趋势、Top 意图、Top 项目统计
- 🔍 多维度筛选：支持按项目、意图、关键词、时间范围筛选
- 📈 关键指标：问答条数、会话数、响应时间统计、转人工统计等
- 📥 数据导入：支持 Excel 文件导入和线上数据拉取
- 📤 数据导出：支持 CSV 格式导出
- 🌙 主题切换：支持亮色/暗色主题

## 技术栈

- React 19 + TypeScript
- Vite 5
- Zustand (状态管理)
- ECharts + echarts-for-react (图表)
- xlsx (Excel 解析)
- Tailwind CSS (样式)

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run start
```

## 项目结构

```
data_agent/
├── dashboard/           # 前端应用
│   ├── src/
│   │   ├── features/   # 业务功能
│   │   │   ├── api/    # API 调用
│   │   │   ├── charts/ # 图表配置
│   │   │   ├── metrics/# 数据统计
│   │   │   └── xlsx/   # Excel 解析
│   │   ├── store/      # 状态管理
│   │   ├── ui/         # UI 组件和页面
│   │   └── main.tsx    # 入口文件
│   └── package.json
├── mockData.xlsx        # 示例数据
├── package.json          # 根配置
└── README.md
```

## 数据格式

支持导入的 Excel 文件需包含以下列：
- sessionId: 会话 ID
- questionTime: 问题时间
- answerTime: 回答时间
- projectName: 项目名称
- intent: 意图
- question: 问题内容
- answer: 回答内容

## 线上数据配置

如需拉取线上数据，请在 `src/features/api/fetchOnline.ts` 中配置 API 端点。

## License

MIT
