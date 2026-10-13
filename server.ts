import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { db } from './server/db.js';
import { classifyFeedback } from './server/classifier.js';
import { testSmtp, sendPlayerReply } from './server/mailer.js';
import { Feedback, FeedbackReply } from './src/types/feedback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON middleware with support for image base64 payloads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Routes
  // 1. Get all feedbacks
  app.get('/api/feedbacks', (req, res) => {
    try {
      const { category, status, search } = req.query;
      let list = db.getFeedbacks();

      if (category && category !== '全部') {
        list = list.filter((f) => f.category === category);
      }

      if (status && status !== '全部') {
        list = list.filter((f) => f.status === status);
      }

      if (search && typeof search === 'string') {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (f) =>
            f.nickname.toLowerCase().includes(q) ||
            f.email.toLowerCase().includes(q) ||
            f.content.toLowerCase().includes(q) ||
            f.subject.toLowerCase().includes(q) ||
            f.id.toLowerCase().includes(q)
        );
      }

      res.json({ success: true, data: list, total: list.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Submit new feedback (Player side)
  app.post('/api/feedbacks', (req, res) => {
    try {
      const { nickname, email, subject, content, images } = req.body;

      if (!nickname || !nickname.trim()) {
        return res.status(400).json({ success: false, error: '请输入游戏昵称或ID' });
      }
      if (!email || !email.trim() || !email.includes('@')) {
        return res.status(400).json({ success: false, error: '请输入有效的电子邮箱地址' });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: '请填写详细反馈内容' });
      }

      // Auto-classify and determine priority & tags
      const classification = classifyFeedback(subject || '反馈', content);

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

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      const newFeedback: Feedback = {
        id,
        nickname: nickname.trim(),
        email: email.trim(),
        subject: subject || '常规反馈',
        category: classification.category,
        priority: classification.priority,
        content: content.trim(),
        images: Array.isArray(images) ? images.slice(0, 3) : [],
        status: '待处理',
        createdAt: formattedDate,
        updatedAt: formattedDate,
        autoTags: classification.autoTags,
        replies: [],
        clientIp,
      };

      const saved = db.addFeedback(newFeedback);
      res.status(201).json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Update feedback
  app.patch('/api/feedbacks/:id', (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = db.updateFeedback(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: '未找到指定反馈' });
      }
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Delete feedback
  app.delete('/api/feedbacks/:id', (req, res) => {
    try {
      const { id } = req.params;
      const deleted = db.deleteFeedback(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: '未找到指定反馈' });
      }
      res.json({ success: true, message: '删除成功' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Reply to player via SMTP
  app.post('/api/feedbacks/:id/reply', async (req, res) => {
    try {
      const { id } = req.params;
      const { content, sentBy } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: '回复内容不能为空' });
      }

      const feedback = db.getFeedbackById(id);
      if (!feedback) {
        return res.status(404).json({ success: false, error: '未找到指定反馈' });
      }

      const smtpConfig = db.getSmtpConfig();

      // Trigger SMTP delivery
      const sendResult = await sendPlayerReply(feedback, content.trim(), smtpConfig);

      const now = new Date();
      const replyRecord: FeedbackReply = {
        id: `rep-${Date.now()}`,
        content: content.trim(),
        sentAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          now.getDate()
        ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
          2,
          '0'
        )}:${String(now.getSeconds()).padStart(2, '0')}`,
        sentBy: sentBy || smtpConfig.fromName || '客服团队',
        emailStatus: sendResult.success ? (sendResult.isSimulated ? 'simulated' : 'sent') : 'failed',
        smtpResponse: sendResult.response || sendResult.messageId,
        error: sendResult.error,
      };

      const updatedReplies = [...feedback.replies, replyRecord];
      const updated = db.updateFeedback(id, {
        status: '已回复',
        replies: updatedReplies,
      });

      res.json({
        success: true,
        data: updated,
        sendResult,
      });
    } catch (err: any) {
      console.error('Error replying:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Get SMTP Config
  app.get('/api/smtp', (req, res) => {
    try {
      const config = db.getSmtpConfig();
      res.json({
        success: true,
        data: {
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user,
          pass: config.pass,
          hasPass: Boolean(config.pass && config.pass.length > 0),
          fromEmail: config.fromEmail,
          fromName: config.fromName,
          notificationEmail: config.notificationEmail,
          template: config.template,
          isConfigured: config.isConfigured,
          updatedAt: config.updatedAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Save SMTP Config
  app.post('/api/smtp', (req, res) => {
    try {
      const updates = req.body;
      const saved = db.saveSmtpConfig(updates);
      res.json({
        success: true,
        data: {
          host: saved.host,
          port: saved.port,
          secure: saved.secure,
          user: saved.user,
          pass: saved.pass,
          hasPass: Boolean(saved.pass && saved.pass.length > 0),
          fromEmail: saved.fromEmail,
          fromName: saved.fromName,
          notificationEmail: saved.notificationEmail,
          template: saved.template,
          isConfigured: saved.isConfigured,
          updatedAt: saved.updatedAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Test SMTP Connection
  app.post('/api/smtp/test', async (req, res) => {
    try {
      const { host, port, user, pass, fromEmail, fromName, recipient } = req.body;
      const existing = db.getSmtpConfig();

      const testConfig = {
        ...existing,
        host: host || existing.host,
        port: Number(port) || existing.port,
        user: user || existing.user,
        pass: pass && pass.trim() !== '' ? pass.trim() : existing.pass,
        fromEmail: fromEmail || existing.fromEmail,
        fromName: fromName || existing.fromName,
      };

      const result = await testSmtp(testConfig, recipient);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, details: err.message, error: err.message });
    }
  });

  // 9. Stats endpoint
  app.get('/api/stats', (req, res) => {
    try {
      const stats = db.getStats();
      res.json({ success: true, data: stats });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware mounting for development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
