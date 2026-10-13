import fs from 'fs';
import path from 'path';
import { Feedback, SmtpConfig, FeedbackStats } from '../src/types/feedback';

interface DatabaseSchema {
  feedbacks: Feedback[];
  smtpConfig: SmtpConfig;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'feedback_store.json');

const INITIAL_SMTP: SmtpConfig = {
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  user: '3993661034@qq.com',
  pass: 'gmwmiyivbysicgcd',
  fromEmail: '3993661034@qq.com',
  fromName: '东城团队',
  notificationEmail: '',
  template: '东城团队验证码523596，如果你不是你注册过的请忽略此验证码😻骗你的\n此致</br>\n东城团队',
  isConfigured: true,
};

const INITIAL_FEEDBACKS: Feedback[] = [
  {
    id: 'FB-20261011-0004',
    nickname: 'bibubiu',
    email: 'tx5667374999@gmail.com',
    subject: 'Bug反馈',
    category: 'Bug反馈',
    priority: '中',
    content: 'hello',
    images: [],
    status: '已回复',
    createdAt: '2026-10-11 21:18:37',
    updatedAt: '2026-10-11 21:19:00',
    autoTags: ['游戏逻辑异常'],
    replies: [
      {
        id: 'rep-001',
        content: '亲爱的玩家您好，您反馈的问题东城团队已收到并已记录排查，感谢您的支持！',
        sentAt: '2026-10-11 21:19:00',
        sentBy: '东城团队管理员',
        emailStatus: 'sent',
        smtpResponse: '250 Ok: queued as 20261011211900',
      },
    ],
  },
  {
    id: 'FB-20261011-0003',
    nickname: '唐秀',
    email: 'tx5667374999@gmail.com',
    subject: 'Bug反馈',
    category: 'Bug反馈',
    priority: '中',
    content: 'hello',
    images: [],
    status: '已回复',
    createdAt: '2026-10-11 21:09:50',
    updatedAt: '2026-10-11 21:11:00',
    autoTags: ['游戏逻辑异常'],
    replies: [
      {
        id: 'rep-002',
        content: '您好，感谢您对游戏的支持，祝您游戏愉快！',
        sentAt: '2026-10-11 21:11:00',
        sentBy: '东城团队管理员',
        emailStatus: 'sent',
      },
    ],
  },
  {
    id: 'FB-20261011-0002',
    nickname: 'mst',
    email: 'tx5667374999@gmail.com',
    subject: '举报违规',
    category: '举报违规',
    priority: '高',
    content: '我去你妈',
    images: [],
    status: '已回复',
    createdAt: '2026-10-11 20:54:05',
    updatedAt: '2026-10-11 20:56:00',
    autoTags: ['不当言论/辱骂', '违规举报'],
    replies: [
      {
        id: 'rep-003',
        content: '已对被举报违规发言玩家进行核实并处以禁言处罚，净化游戏环境从我做起。',
        sentAt: '2026-10-11 20:56:00',
        sentBy: '东城团队管理员',
        emailStatus: 'sent',
      },
    ],
  },
  {
    id: 'FB-20261011-0001',
    nickname: '唐秀',
    email: 'tx5667374999@gmail.com',
    subject: '举报违规',
    category: '举报违规',
    priority: '中',
    content: '122133213313',
    images: [],
    status: '已回复',
    createdAt: '2026-10-11 16:27:12',
    updatedAt: '2026-10-11 16:30:00',
    autoTags: ['违规举报'],
    replies: [
      {
        id: 'rep-004',
        content: '收到举报信息，安全巡查员已介入取证。',
        sentAt: '2026-10-11 16:30:00',
        sentBy: '东城团队管理员',
        emailStatus: 'sent',
      },
    ],
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDir();
    this.data = this.load();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          feedbacks: parsed.feedbacks || INITIAL_FEEDBACKS,
          smtpConfig: { ...INITIAL_SMTP, ...(parsed.smtpConfig || {}) },
        };
      }
    } catch (err) {
      console.error('Error loading database file, falling back to defaults', err);
    }

    const initial = {
      feedbacks: INITIAL_FEEDBACKS,
      smtpConfig: INITIAL_SMTP,
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema) {
    try {
      this.ensureDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  public getFeedbacks(): Feedback[] {
    return [...this.data.feedbacks];
  }

  public getFeedbackById(id: string): Feedback | undefined {
    return this.data.feedbacks.find((f) => f.id === id);
  }

  public addFeedback(feedback: Feedback): Feedback {
    this.data.feedbacks.unshift(feedback);
    this.saveData(this.data);
    return feedback;
  }

  public updateFeedback(id: string, updates: Partial<Feedback>): Feedback | null {
    const idx = this.data.feedbacks.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    this.data.feedbacks[idx] = {
      ...this.data.feedbacks[idx],
      ...updates,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.saveData(this.data);
    return this.data.feedbacks[idx];
  }

  public deleteFeedback(id: string): boolean {
    const prevLen = this.data.feedbacks.length;
    this.data.feedbacks = this.data.feedbacks.filter((f) => f.id !== id);
    if (this.data.feedbacks.length !== prevLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public getSmtpConfig(): SmtpConfig {
    return { ...this.data.smtpConfig };
  }

  public saveSmtpConfig(config: Partial<SmtpConfig>): SmtpConfig {
    const prev = this.data.smtpConfig;
    // Keep password if blank or undefined, fallback to existing or default 'gmwmiyivbysicgcd'
    const pass = config.pass && config.pass.trim() !== '' ? config.pass.trim() : (prev.pass || 'gmwmiyivbysicgcd');
    const isConfigured = Boolean(config.host && config.user && pass);

    this.data.smtpConfig = {
      ...prev,
      ...config,
      pass,
      isConfigured,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.saveData(this.data);
    return this.data.smtpConfig;
  }

  public getStats(): FeedbackStats {
    const list = this.data.feedbacks;
    const categoryCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    let repliedCount = 0;
    let pendingCount = 0;

    for (const item of list) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      priorityCounts[item.priority] = (priorityCounts[item.priority] || 0) + 1;
      if (item.status === '已回复') repliedCount++;
      else if (item.status === '待处理') pendingCount++;
    }

    return {
      total: list.length,
      repliedCount,
      pendingCount,
      categoryCounts,
      priorityCounts,
      latestToday: list.length,
    };
  }
}

export const db = new Database();
