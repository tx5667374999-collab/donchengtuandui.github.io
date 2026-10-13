import nodemailer from 'nodemailer';
import { Feedback, SmtpConfig } from '../src/types/feedback';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
  isSimulated?: boolean;
}

export function compileTemplate(
  template: string,
  vars: {
    name: string;
    subject: string;
    reply_content: string;
    site: string;
    id?: string;
    content?: string;
  }
): string {
  let output = template || '{reply_content}';
  output = output.replace(/\{name\}/g, vars.name || '玩家');
  output = output.replace(/\{subject\}/g, vars.subject || '反馈');
  output = output.replace(/\{reply_content\}/g, vars.reply_content || '');
  output = output.replace(/\{site\}/g, vars.site || '游戏运营团队');
  if (vars.id) output = output.replace(/\{id\}/g, vars.id);
  if (vars.content) output = output.replace(/\{content\}/g, vars.content);
  return output;
}

export async function createTransporter(config: SmtpConfig) {
  const port = Number(config.port) || 587;
  // Standard rule: port 465 is secure (SSL/TLS), port 587 is STARTTLS
  const secure = config.secure ?? (port === 465);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port,
    secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
}

export async function testSmtp(
  config: SmtpConfig,
  testRecipient?: string
): Promise<{ success: boolean; details: string; error?: string }> {
  if (!config.host || !config.user) {
    return {
      success: false,
      details: '请先填写完整 SMTP 主机与用户名',
      error: 'Host or User missing',
    };
  }

  // If password is blank
  if (!config.pass) {
    return {
      success: false,
      details: '未设置 SMTP 密码/授权码。请在输入框填入您的邮箱授权码后测试。',
      error: 'Password missing',
    };
  }

  try {
    const transporter = await createTransporter(config);
    await transporter.verify();

    if (testRecipient && testRecipient.trim()) {
      const info = await transporter.sendMail({
        from: `"${config.fromName || '反馈中心'}" <${config.fromEmail || config.user}>`,
        to: testRecipient.trim(),
        subject: `[测试邮件] 来自 ${config.fromName || '游戏反馈中心'} 的SMTP连接测试`,
        text: `这是一封测试邮件。\n\n恭喜！您的 SMTP 邮件服务器配置正常！\nSMTP 主机: ${config.host}:${config.port}\n发件人: ${config.fromName} <${config.fromEmail}>\n测试时间: ${new Date().toLocaleString('zh-CN')}`,
        html: `
          <div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #10b981; margin-top: 0;">✓ SMTP 服务器连接测试成功</h2>
            <p>这是一封来自 <strong>${config.fromName || '游戏反馈中心'}</strong> 的自动测试邮件。</p>
            <div style="background: #1e293b; padding: 16px; border-radius: 6px; font-size: 14px; line-height: 1.8;">
              <div><strong>SMTP 主机:</strong> ${config.host}:${config.port}</div>
              <div><strong>发件账号:</strong> ${config.fromEmail || config.user}</div>
              <div><strong>测试时间:</strong> ${new Date().toLocaleString('zh-CN')}</div>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">现在您可以在后台直接为玩家发送反馈回复邮件了！</p>
          </div>
        `,
      });
      return {
        success: true,
        details: `SMTP 连接测试成功！测试邮件已成功发送至 ${testRecipient} (MessageId: ${info.messageId})`,
      };
    }

    return {
      success: true,
      details: `SMTP 服务器认证成功 (${config.host}:${config.port})！服务器准备就绪。`,
    };
  } catch (err: any) {
    console.error('SMTP test failed:', err);
    return {
      success: false,
      details: `连接失败: ${err.message || '未知错误'}`,
      error: err.code || err.message,
    };
  }
}

export async function sendPlayerReply(
  feedback: Feedback,
  replyContent: string,
  config: SmtpConfig
): Promise<SendEmailResult> {
  const formattedBody = compileTemplate(config.template || '{reply_content}', {
    name: feedback.nickname,
    subject: feedback.subject,
    reply_content: replyContent,
    site: config.fromName || '东城团队',
    id: feedback.id,
    content: feedback.content,
  });

  // If SMTP is not fully configured with password, or in sandbox testing environment
  if (!config.host || !config.user || !config.pass) {
    return {
      success: true,
      isSimulated: true,
      response: 'SMTP 授权码尚未填写，已生成回复记录并在控制台模拟发送完成。',
    };
  }

  try {
    const transporter = await createTransporter(config);
    const info = await transporter.sendMail({
      from: `"${config.fromName || '游戏团队'}" <${config.fromEmail || config.user}>`,
      to: feedback.email,
      subject: `【${config.fromName || '游戏团队'}】关于您提交的「${feedback.subject}」反馈回复`,
      text: formattedBody,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b1120; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px 28px;">
            <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #d1fae5; margin-bottom: 4px;">游戏运营服务中心</div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">反馈处理结果通知</h1>
          </div>

          <!-- Body -->
          <div style="padding: 28px;">
            <p style="margin: 0 0 16px 0; font-size: 16px; color: #e2e8f0;">
              尊敬的玩家 <strong style="color: #34d399;">${feedback.nickname}</strong>：
            </p>

            <div style="background-color: #1e293b; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 6px; margin-bottom: 24px;">
              <div style="font-size: 13px; color: #94a3b8; margin-bottom: 6px;">
                单号: <span style="font-family: monospace; color: #cbd5e1;">${feedback.id}</span> · 主题: <span style="color: #cbd5e1;">${feedback.subject}</span>
              </div>
              <div style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
                <strong>您的反馈：</strong>${feedback.content}
              </div>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="font-size: 14px; font-weight: 600; color: #10b981; margin-bottom: 10px; display: flex; align-items: center;">
                <span>官方处理答复：</span>
              </div>
              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 18px; font-size: 15px; line-height: 1.8; color: #f1f5f9; white-space: pre-wrap;">
${formattedBody}
              </div>
            </div>

            <div style="border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 28px; font-size: 13px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 4px 0;">此邮件为系统自动回复，如需进一步咨询请在游戏内继续反馈。</p>
              <p style="margin: 0;">发件方：<strong>${config.fromName || '东城团队'}</strong></p>
            </div>
          </div>
        </div>
      `,
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (err: any) {
    console.error('Failed to send SMTP email:', err);
    return {
      success: false,
      error: err.message || 'SMTP 发送失败',
    };
  }
}
