/**
 * 转人工检测关键词
 */
export const HANDOFF_KEYWORDS = ['转人工', '转接人工', '人工客服'] as const

/**
 * 风险意图关键词
 */
export const RISK_INTENT_KEYWORDS = ['投诉', '退款', '退换', '差评', '质量', '服务态度'] as const

/**
 * Excel 字段名称候选值配置
 */
export const EXCEL_FIELD_CANDIDATES = {
  sessionId: ['session_id', 'sessionId', 'session', '会话id', '会话'],
  question: ['question', '问题', '提问'],
  answer: ['answer', '回答', '回复'],
  questionTime: ['question_time', 'questionTime', '提问时间', '问询时间'],
  answerTime: ['answer_time', 'answerTime', '回答时间', '回复时间'],
  intent: ['intent', '意图', '标签'],
  projectName: ['project_name', 'projectName', '项目', '项目名'],
} as const

/**
 * 时间日期相关常量
 */
export const DATE_CONSTANTS = {
  /**
   * 日期时间格式显示
   */
  DATE_FORMAT: {
    /**
     * 月-日 时:分 格式 (如: 03-30 14:30)
     */
    MD_HM: 'MM-DD HH:mm',
    /**
     * ISO 字符串格式
     */
    ISO: 'iso',
  } as const,

  /**
   * 秒转时间单位的阈值
   */
  TIME_THRESHOLDS: {
    MILLISECOND: 1, // 小于 1 秒显示毫秒
    SECOND: 60, // 小于 60 秒显示秒
  } as const,
} as const

/**
 * 主题相关常量
 */
export const THEME_CONSTANTS = {
  DARK: 'dark' as const,
  LIGHT: 'light' as const,
  STORAGE_KEY: 'agent_dashboard_theme',
} as const

/**
 * UI 相关常量
 */
export const UI_CONSTANTS = {
  /**
   * 图表配置
   */
  CHART: {
    DEFAULT_TOP_N: 12, // 默认显示前 N 条
    DEFAULT_HEIGHT: 320, // 默认图表高度
  } as const,

  /**
   * 表格配置
   */
  TABLE: {
    LATEST_ROWS_LIMIT: 5, // 最新记录显示限制
  } as const,

  /**
   * 模态框相关
   */
  MODAL: {
    OVERLAY_ROLE: 'presentation' as const,
    MODAL_ROLE: 'dialog' as const,
  } as const,

  /**
   * 键盘快捷键
   */
  KEYBOARD: {
    ESCAPE: 'Escape' as const,
  } as const,

  /**
   * 本地存储键
   */
  STORAGE: {
    MOCK_DATA_PATH: '/mockData.xlsx',
  } as const,

  /**
   * 默认显示文本
   */
  DISPLAY: {
    EMPTY: '-',
    UNNAMED: '未命名',
    ALL: '全部',
    UNLABELED: '未标注',
  } as const,
} as const

/**
 * CSV 导出配置
 */
export const CSV_CONSTANTS = {
  /**
   * CSV 头部字段
   */
  HEADERS: ['session_id', 'question_time', 'answer_time', 'project_name', 'intent', 'question', 'answer'],
  /**
   * BOM 标记 (确保 UTF-8 兼容性)
   */
  BOM: '\uFEFF',
  /**
   * 文件名前缀
   */
  FILENAME_PREFIX: 'agent_dashboard_',
} as const

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
  PARSE_FAILED: '解析失败',
  MOCK_DATA_NOT_FOUND: '示例数据未找到（public/mockData.xlsx）',
  LOAD_MOCK_FAILED: '加载示例失败',
  FETCH_ONLINE_FAILED: '线上数据拉取失败',
  INVALID_JSON_RESPONSE: '接口 data 字段不是合法 JSON 字符串',
  NON_JSON_RESPONSE: '线上接口返回非 JSON：',
} as const

/**
 * API 相关常量
 */
export const API_CONSTANTS = {
  /**
   * API 端点
   */
  ENDPOINTS: {
    WORKFLOW: '/api/workflow',
    MOCK_DATA: '/mockData.xlsx',
  } as const,

  /**
   * API 响应码
   */
  RESPONSE_CODE: {
    SUCCESS: 0,
  } as const,

  /**
   * 环境检测
   */
  EXPORT_KEYWORD: 'export',
} as const

export const INTENT_LABELS = {
  '1': '规则匹配',
  '2': '操作指导',
  '3': '案例归因',
  '4': '代码问题',
  '5': '主动反馈',
  '6': '闲聊',
} as const
