import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Server,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SmtpConfig } from '../types/feedback';
import { getSmtpConfig, saveSmtpConfig, testSmtpConnection } from '../services/api';

export const AdminSmtpSettings: React.FC = () => {
  const [host, setHost] = useState('smtp.qq.com');
  const [port, setPort] = useState(587);
  const [user, setUser] = useState('3993661034@qq.com');
  const [pass, setPass] = useState('gmwmiyivbysicgcd');
  const [hasPass, setHasPass] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [fromEmail, setFromEmail] = useState('3993661034@qq.com');
  const [fromName, setFromName] = useState('东城团队');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [template, setTemplate] = useState(
    '东城团队验证码523596，如果你不是你注册过的请忽略此验证码😻骗你的\n此致</br>\n东城团队'
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Test modal/state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState('tx5667374999@gmail.com');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    details: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getSmtpConfig();
      if (data) {
        setHost(data.host || 'smtp.qq.com');
        setPort(data.port || 587);
        setUser(data.user || '3993661034@qq.com');
        setFromEmail(data.fromEmail || data.user || '3993661034@qq.com');
        setFromName(data.fromName || '东城团队');
        setNotificationEmail(data.notificationEmail || '');
        if (data.template) setTemplate(data.template);
        setPass(data.pass || 'gmwmiyivbysicgcd');
        setHasPass(true);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    const persistentPass = pass && pass.trim() !== '' ? pass.trim() : 'gmwmiyivbysicgcd';

    try {
      await saveSmtpConfig({
        host,
        port: Number(port),
        user,
        pass: persistentPass,
        fromEmail,
        fromName,
        notificationEmail,
        template,
      });

      setSaveSuccess(true);
      setHasPass(true);
      setPass(persistentPass);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setSaveError(err.message || '保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testSmtpConnection({
        host,
        port: Number(port),
        user,
        pass: pass.trim() !== '' ? pass.trim() : undefined,
        fromEmail,
        fromName,
        recipient: testRecipient.trim() || undefined,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        details: err.message || '网络或接口异常',
        error: err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const applyPreset = (presetName: string) => {
    if (presetName === 'qq') {
      setHost('smtp.qq.com');
      setPort(587);
      if (!fromEmail || fromEmail.endsWith('@qq.com')) {
        setFromEmail(user || 'your-qq@qq.com');
      }
    } else if (presetName === '163') {
      setHost('smtp.163.com');
      setPort(465);
    } else if (presetName === 'gmail') {
      setHost('smtp.gmail.com');
      setPort(587);
    } else if (presetName === 'outlook') {
      setHost('smtp.office365.com');
      setPort(587);
    }
  };

  const resetTemplateToStandard = () => {
    setTemplate(
      '东城团队验证码523596，如果你不是你注册过的请忽略此验证码😻骗你的\n此致</br>\n东城团队'
    );
  };

  const setProTemplate = () => {
    setTemplate(
      '尊敬的玩家 {name}：\n\n关于您提交的「{subject}」反馈，官方处理答复如下：\n{reply_content}\n\n感谢您对游戏的支持与陪伴！\n此致\n{site}'
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm">读取 SMTP 设置中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Title & Preset Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">SMTP 邮件服务器配置</h2>
          <p className="text-xs text-slate-400 mt-1">
            配置用于向玩家邮箱发送反馈结果的 SMTP 账号与邮件模板，支持 QQ邮箱、163网易、Gmail 等主流服务
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500">常用预设:</span>
          <button
            type="button"
            onClick={() => applyPreset('qq')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            QQ邮箱
          </button>
          <button
            type="button"
            onClick={() => applyPreset('163')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            163网易
          </button>
          <button
            type="button"
            onClick={() => applyPreset('gmail')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            Gmail
          </button>
          <button
            type="button"
            onClick={() => applyPreset('outlook')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            Outlook
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Field 1: SMTP 主机 matching Screenshot 3 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            SMTP 主机
          </label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="例如: smtp.qq.com"
            className="w-full px-4 py-3 bg-[#161b22] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
          />
        </div>

        {/* Field 2: SMTP 端口 matching Screenshot 3 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">
              SMTP 端口
            </label>
            <span className="text-xs text-slate-500">
              QQ/Gmail 常用 587 (STARTTLS) 或 465 (SSL)
            </span>
          </div>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            placeholder="587"
            className="w-full px-4 py-3 bg-[#161b22] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
          />
        </div>

        {/* Field 3: SMTP 用户名 (邮箱账号) matching Screenshot 3 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            SMTP 用户名 (邮箱账号)
          </label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="3993661034@qq.com"
            className="w-full px-4 py-3 bg-[#161b22] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
          />
        </div>

        {/* Field 4: SMTP 密码 (授权码) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-slate-300">
                SMTP 密码 (授权码)
              </label>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-600/50 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>授权码已永久保存</span>
              </span>
            </div>
            <span className="text-xs text-slate-500">
              QQ邮箱授权码: gmwmiyivbysicgcd
            </span>
          </div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="gmwmiyivbysicgcd"
              className="w-full px-4 py-3 bg-[#161b22] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono pr-20"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2 text-slate-400">
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="hover:text-slate-200 transition-colors p-1"
                title={showPass ? '隐藏授权码' : '显示授权码明文'}
              >
                {showPass ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
              </button>
              {pass && (
                <button
                  type="button"
                  onClick={() => setPass('gmwmiyivbysicgcd')}
                  className="hover:text-emerald-400 text-xs px-1 text-slate-500 transition-colors"
                  title="恢复默认授权码"
                >
                  重置
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            已永久保存授权码 <code className="text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded font-mono">gmwmiyivbysicgcd</code>，发送玩家回复邮件或测试连接时将自动使用此授权码进行认证。
          </p>
        </div>

        {/* Field 5: 发件人邮箱 matching Screenshot 3 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            发件人邮箱
          </label>
          <input
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="3993661034@qq.com"
            className="w-full px-4 py-3 bg-[#161b22] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
          />
        </div>

        {/* Field 6: 发件人名称 matching Screenshot 3 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            发件人名称
          </label>
          <input
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="东城团队"
            className="w-full px-4 py-3 bg-[#161b22] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>

        {/* Field 7: 通知接收邮箱 (留空则发给SMTP用户) matching Screenshot 3 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            通知接收邮箱 (留空则发给SMTP用户)
          </label>
          <input
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder="用于在新反馈到达时接收提醒邮件，留空则不单独转发"
            className="w-full px-4 py-3 bg-[#161b22] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
          />
        </div>

        {/* Field 8: 回复邮件模板 matching Screenshot 4 */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="block text-sm font-medium text-slate-300">
              回复邮件模板 ({'{name}'}, {'{subject}'}, {'{reply_content}'}, {'{site}'} 为占位符)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetTemplateToStandard}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                还原截图模板
              </button>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={setProTemplate}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                套用标准通知模版
              </button>
            </div>
          </div>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={5}
            placeholder="东城团队验证码523596，如果你不是你注册过的请忽略此验证码😻骗你的\n此致</br>\n东城团队"
            className="w-full px-4 py-3 bg-[#161b22] border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono leading-relaxed resize-y"
          />
        </div>

        {/* Status alerts */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>SMTP 配置已成功保存并立即生效！</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Action Buttons matching Screenshot 3 & 4 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              setShowTestModal(true);
              setTestResult(null);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>测试 SMTP 连接与发送测试邮件</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-7 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <span>保存配置</span>
            )}
          </button>
        </div>
      </form>

      {/* Test Connection Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">SMTP 发信测试</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              系统将对当前填写的 <span className="text-slate-200 font-mono">{host}:{port}</span> 服务器发起握手认证，并发送一封测试邮件。
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                测试邮件接收邮箱地址
              </label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="例如: your-email@gmail.com"
                className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-1 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                    : 'bg-red-950/40 border border-red-800 text-red-300'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testResult.success ? '测试通过' : '测试未通过'}</span>
                </div>
                <div className="leading-relaxed pl-5 whitespace-pre-wrap">{testResult.details}</div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>连接测试中...</span>
                  </>
                ) : (
                  <span>开始测试发信</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
