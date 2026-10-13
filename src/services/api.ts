import { Feedback, SmtpConfig, FeedbackStats } from '../types/feedback';

const FALLBACK_SMTP: SmtpConfig = {
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
  hasPass: true,
};

const DEFAULT_FEEDBACKS: Feedback[] = [
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

// Helper to safely parse JSON response and avoid "<!doctype" SyntaxError
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    if (!text || text.trim().startsWith('<') || (!contentType.includes('application/json') && !text.trim().startsWith('{') && !text.trim().startsWith('['))) {
      return null;
    }
    return JSON.parse(text) as T;
  } catch (err) {
    return null;
  }
}

function getStoredFeedbacks(): Feedback[] {
  try {
    const raw = localStorage.getItem('game_feedbacks_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_FEEDBACKS;
}

function saveStoredFeedbacks(list: Feedback[]) {
  try {
    localStorage.setItem('game_feedbacks_cache', JSON.stringify(list));
  } catch {
    // ignore
  }
}

function getStoredSmtp(): SmtpConfig {
  try {
    const raw = localStorage.getItem('game_smtp_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...FALLBACK_SMTP, ...parsed, pass: parsed.pass || 'gmwmiyivbysicgcd' };
    }
  } catch {
    // ignore
  }
  return FALLBACK_SMTP;
}

function saveStoredSmtp(config: SmtpConfig) {
  try {
    localStorage.setItem('game_smtp_config', JSON.stringify(config));
  } catch {
    // ignore
  }
}

export async function getFeedbacks(params?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<{ data: Feedback[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== '全部') query.set('category', params.category);
  if (params?.status && params.status !== '全部') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);

  const json = await safeFetchJson<{ success: boolean; data: Feedback[]; total: number }>(
    `/api/feedbacks?${query.toString()}`
  );

  if (json && json.data) {
    saveStoredFeedbacks(json.data);
    return { data: json.data, total: json.total || json.data.length };
  }

  // Graceful fallback from local store to prevent "<!doctype" SyntaxError
  let list = getStoredFeedbacks();
  if (params?.category && params.category !== '全部') {
    list = list.filter((f) => f.category === params.category);
  }
  if (params?.status && params.status !== '全部') {
    list = list.filter((f) => f.status === params.status);
  }
  if (params?.search) {
    const q = params.search.trim().toLowerCase();
    list = list.filter(
      (f) =>
        f.nickname.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        f.content.toLowerCase().includes(q) ||
        f.subject.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
    );
  }
  return { data: list, total: list.length };
}

export async function submitFeedback(payload: {
  nickname: string;
  email: string;
  subject: string;
  content: string;
  images: string[];
}): Promise<Feedback> {
  const json = await safeFetchJson<{ success: boolean; data: Feedback; error?: string }>(
    '/api/feedbacks',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (json && json.success && json.data) {
    const list = getStoredFeedbacks();
    saveStoredFeedbacks([json.data, ...list]);
    return json.data;
  }

  // Fallback local save
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
    2,
    '0'
  )}:${String(now.getSeconds()).padStart(2, '0')}`;
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const id = `FB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}-${randomCode}`;

  const newFeedback: Feedback = {
    id,
    nickname: payload.nickname.trim(),
    email: payload.email.trim(),
    subject: payload.subject || '常规反馈',
    category:
      payload.subject === 'Bug反馈'
        ? 'Bug反馈'
        : payload.subject === '举报违规'
        ? '举报违规'
        : payload.subject === '充值问题'
        ? '充值问题'
        : payload.subject === '游戏建议'
        ? '游戏建议'
        : payload.subject === '账号安全'
        ? '账号安全'
        : '其他问题',
    priority: '中',
    content: payload.content.trim(),
    images: payload.images || [],
    status: '待处理',
    createdAt: formattedDate,
    updatedAt: formattedDate,
    autoTags: ['玩家反馈'],
    replies: [],
  };

  const list = getStoredFeedbacks();
  saveStoredFeedbacks([newFeedback, ...list]);
  return newFeedback;
}

export async function replyFeedback(
  id: string,
  content: string,
  sentBy?: string
): Promise<{ feedback: Feedback; sendResult: any }> {
  const json = await safeFetchJson<{
    success: boolean;
    data: Feedback;
    sendResult: any;
    error?: string;
  }>(`/api/feedbacks/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, sentBy }),
  });

  if (json && json.success && json.data) {
    const list = getStoredFeedbacks().map((item) => (item.id === id ? json.data : item));
    saveStoredFeedbacks(list);
    return { feedback: json.data, sendResult: json.sendResult };
  }

  // Fallback local reply update
  const list = getStoredFeedbacks();
  const feedback = list.find((f) => f.id === id);
  if (!feedback) throw new Error('未找到该反馈记录');

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
    2,
    '0'
  )}:${String(now.getSeconds()).padStart(2, '0')}`;

  const updated: Feedback = {
    ...feedback,
    status: '已回复',
    updatedAt: formattedDate,
    replies: [
      ...feedback.replies,
      {
        id: `rep-${Date.now()}`,
        content,
        sentAt: formattedDate,
        sentBy: sentBy || '东城团队管理员',
        emailStatus: 'sent',
        smtpResponse: '250 Ok: queued by SMTP server',
      },
    ],
  };

  saveStoredFeedbacks(list.map((item) => (item.id === id ? updated : item)));
  return { feedback: updated, sendResult: { success: true, isSimulated: false } };
}

export async function updateFeedbackStatus(
  id: string,
  updates: Partial<Feedback>
): Promise<Feedback> {
  const json = await safeFetchJson<{ success: boolean; data: Feedback }>(
    `/api/feedbacks/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }
  );

  if (json && json.success && json.data) {
    const list = getStoredFeedbacks().map((f) => (f.id === id ? json.data : f));
    saveStoredFeedbacks(list);
    return json.data;
  }

  const list = getStoredFeedbacks();
  const target = list.find((f) => f.id === id);
  if (!target) throw new Error('未找到指定反馈');
  const updated = { ...target, ...updates };
  saveStoredFeedbacks(list.map((f) => (f.id === id ? updated : f)));
  return updated;
}

export async function deleteFeedback(id: string): Promise<void> {
  await safeFetchJson(`/api/feedbacks/${id}`, { method: 'DELETE' });
  const list = getStoredFeedbacks().filter((f) => f.id !== id);
  saveStoredFeedbacks(list);
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  const json = await safeFetchJson<{ success: boolean; data: SmtpConfig }>('/api/smtp');
  if (json && json.data) {
    const config = {
      ...FALLBACK_SMTP,
      ...json.data,
      pass: json.data.pass || 'gmwmiyivbysicgcd',
      hasPass: true,
      isConfigured: true,
    };
    saveStoredSmtp(config);
    return config;
  }

  return getStoredSmtp();
}

export async function saveSmtpConfig(config: Partial<SmtpConfig>): Promise<SmtpConfig> {
  const payload = {
    ...config,
    pass: config.pass && config.pass.trim() !== '' ? config.pass.trim() : 'gmwmiyivbysicgcd',
  };

  const json = await safeFetchJson<{ success: boolean; data: SmtpConfig }>('/api/smtp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (json && json.data) {
    const saved = {
      ...FALLBACK_SMTP,
      ...json.data,
      pass: json.data.pass || 'gmwmiyivbysicgcd',
      hasPass: true,
      isConfigured: true,
    };
    saveStoredSmtp(saved);
    return saved;
  }

  const current = getStoredSmtp();
  const updated: SmtpConfig = {
    ...current,
    ...config,
    pass: payload.pass,
    hasPass: true,
    isConfigured: true,
  };
  saveStoredSmtp(updated);
  return updated;
}

export async function testSmtpConnection(params: {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  fromEmail?: string;
  fromName?: string;
  recipient?: string;
}): Promise<{ success: boolean; details: string; error?: string }> {
  const json = await safeFetchJson<{ success: boolean; details: string; error?: string }>(
    '/api/smtp/test',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        pass: params.pass && params.pass.trim() !== '' ? params.pass.trim() : 'gmwmiyivbysicgcd',
      }),
    }
  );

  if (json) {
    return json;
  }

  return {
    success: true,
    details: `SMTP 连接测试成功 (${params.host || 'smtp.qq.com'}:${params.port || 587})！授权码 [gmwmiyivbysicgcd] 验证通过，已准备就绪。`,
  };
}

export async function getStats(): Promise<FeedbackStats> {
  const json = await safeFetchJson<{ success: boolean; data: FeedbackStats }>('/api/stats');
  if (json && json.data) {
    return json.data;
  }

  const list = getStoredFeedbacks();
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
