import React, { useState, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { submitFeedback } from '../services/api';
import { Feedback } from '../types/feedback';

interface PlayerFeedbackFormProps {
  onFeedbackSubmitted?: (feedback: Feedback) => void;
  onGoToAdmin?: () => void;
}

export const PlayerFeedbackForm: React.FC<PlayerFeedbackFormProps> = ({
  onFeedbackSubmitted,
  onGoToAdmin,
}) => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('举报违规');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<Feedback | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 3) {
      setErrorMessage('最多只能上传 3 张截图');
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`图片 ${file.name} 超过 5MB 限制`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImages((prev) => (prev.length < 3 ? [...prev, reader.result as string] : prev));
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nickname.trim()) {
      setErrorMessage('请输入您的游戏ID或昵称');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('请输入有效的电子邮箱地址，以便接收处理通知');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('请详细描述您遇到的问题');
      return;
    }

    setSubmitting(true);
    try {
      const feedback = await submitFeedback({
        nickname: nickname.trim(),
        email: email.trim(),
        subject,
        content: content.trim(),
        images,
      });

      setSubmittedFeedback(feedback);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedback);
      }
    } catch (err: any) {
      setErrorMessage(err.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedFeedback(null);
    setNickname('');
    setEmail('');
    setSubject('举报违规');
    setContent('');
    setImages([]);
    setErrorMessage('');
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Background ambient glow */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-600/20 via-teal-500/10 to-emerald-800/20 rounded-2xl blur-xl opacity-70 pointer-events-none" />

      {/* Main Form Container - Stylized Dark Glassmorphism matching Screenshot 1 */}
      <div className="relative bg-[#161b22]/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-slate-100">
        {submittedFeedback ? (
          /* Submission Success State */
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">反馈已成功接收</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                系统已自动将您的反馈识别为 <span className="text-emerald-400 font-medium">{submittedFeedback.category}</span> 并归档入库。
              </p>
            </div>

            <div className="bg-[#0d1117] border border-slate-800 rounded-xl p-5 text-left space-y-3 max-w-md mx-auto text-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">反馈编号</span>
                <span className="font-mono text-emerald-400 font-semibold">{submittedFeedback.id}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">接收邮箱</span>
                <span className="text-slate-300">{submittedFeedback.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">优先级评估</span>
                <span className="text-amber-400">{submittedFeedback.priority}优先级</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">智能分类标签</span>
                <div className="flex gap-1.5">
                  {submittedFeedback.autoTags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 text-xs text-emerald-300/90 leading-relaxed text-left max-w-md mx-auto">
              ✉️ 当管理员在后台处理完毕并发出答复时，系统将使用 SMTP 服务器直接向您的邮箱 (<span className="text-emerald-200 underline">{submittedFeedback.email}</span>) 发送处理结果。
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                再次提交其他问题
              </button>
              {onGoToAdmin && (
                <button
                  type="button"
                  onClick={onGoToAdmin}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  前往管理员后台查阅与回信 →
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Feedback Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field 1: 您的昵称 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                您的昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入游戏ID或昵称"
                className="w-full px-4 py-3 bg-[#21262d] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
              />
            </div>

            {/* Field 2: 联系邮箱 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                联系邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="用于接收回复的邮箱地址"
                className="w-full px-4 py-3 bg-[#21262d] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
              />
            </div>

            {/* Field 3: 主题 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                主题
              </label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-[#21262d] border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none text-sm pr-10 cursor-pointer"
                >
                  <option value="举报违规">举报违规</option>
                  <option value="Bug反馈">Bug反馈</option>
                  <option value="充值问题">充值问题</option>
                  <option value="游戏建议">游戏建议</option>
                  <option value="账号安全">账号安全</option>
                  <option value="其他问题">其他问题</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Field 4: 详细内容 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                详细内容
              </label>
              <div className="relative bg-[#21262d] border border-slate-700/80 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请详细描述您遇到的问题..."
                  rows={4}
                  className="w-full px-4 pt-3 pb-2 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none resize-y text-sm min-h-[110px]"
                />

                {/* Attached image preview thumbnails */}
                {images.length > 0 && (
                  <div className="px-4 pb-3 flex flex-wrap gap-2.5">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-600 bg-black/40">
                        <img
                          src={img}
                          alt={`截图 ${idx + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPreviewImage(img)}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 transition-opacity"
                          title="移除图片"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bottom toolbar inside textarea container */}
                <div className="px-4 py-2.5 border-t border-slate-700/50 bg-[#1a1f26]/60 flex items-center justify-between">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={images.length >= 3}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2d333b] hover:bg-[#373e47] disabled:opacity-50 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>添加图片</span>
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    最多3张，每张≤5MB
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button - Vibrant Green matching Screenshot 1 */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-60 text-white font-semibold text-base rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>处理中...</span>
                </>
              ) : (
                <>
                  <span>发送邮件</span>
                  <Send className="w-4 h-4 fill-white text-white" />
                </>
              )}
            </button>

            {/* Helpful Hint */}
            <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>系统将实时分析内容并自动分类，处理结果将发送至您的邮箱</span>
            </div>
          </form>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="放大查看"
              className="max-w-full max-h-[85vh] object-contain rounded-lg border border-slate-700 shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-slate-800 text-white p-2 rounded-full border border-slate-600 hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
