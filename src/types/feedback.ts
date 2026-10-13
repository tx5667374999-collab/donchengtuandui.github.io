export type FeedbackCategory =
  | '举报违规'
  | 'Bug反馈'
  | '充值问题'
  | '游戏建议'
  | '账号安全'
  | '网络/性能'
  | '其他问题';

export type FeedbackStatus = '待处理' | '处理中' | '已回复' | '已归档';

export type FeedbackPriority = '普通' | '中' | '高' | '紧急';

export interface FeedbackReply {
  id: string;
  content: string;
  sentAt: string;
  sentBy: string;
  emailStatus: 'sent' | 'simulated' | 'failed';
  smtpResponse?: string;
  error?: string;
}

export interface Feedback {
  id: string;
  nickname: string;
  email: string;
  subject: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  content: string;
  images: string[];
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  autoTags: string[];
  replies: FeedbackReply[];
  clientIp?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string;
  hasPass?: boolean;
  fromEmail: string;
  fromName: string;
  notificationEmail: string;
  template: string;
  isConfigured: boolean;
  updatedAt?: string;
}

export interface FeedbackStats {
  total: number;
  repliedCount: number;
  pendingCount: number;
  categoryCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  latestToday: number;
}
