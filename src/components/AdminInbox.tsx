import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Tag,
  MessageSquare,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  User,
  Check,
} from 'lucide-react';
import { Feedback, FeedbackCategory, FeedbackStatus } from '../types/feedback';
import { getFeedbacks, replyFeedback, updateFeedbackStatus, deleteFeedback } from '../services/api';

interface AdminInboxProps {
  onGoToSmtp?: () => void;
}

export const AdminInbox: React.FC<AdminInboxProps> = ({ onGoToSmtp }) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>('FB-20261011-0004'); // default expand first item
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedStatus, setSelectedStatus] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reply state
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyLoadingMap, setReplyLoadingMap] = useState<Record<string, boolean>>({});
  const [replyNoticeMap, setReplyNoticeMap] = useState<Record<string, { type: 'success' | 'error'; msg: string } | null>>({});

  const quickTemplates = [
    { label: 'Bug修复中', text: '感谢您的反馈！该Bug已得到确认并进入技术排查流程，我们将在下个补丁中修复。感谢您对游戏的支持！' },
    { label: '违规已处罚', text: '您举报的违规行为经安全系统核实成立，已对相关涉事违规账号执行封禁/禁言处罚。感谢您共同维护良好的游戏生态！' },
    { label: '充值补发', text: '您好，您反馈的充值订单已完成核实与补单，相应道具/点券已发放至您的游戏邮箱内，请登录查收。' },
    { label: '采纳建议', text: '非常感谢您提出的宝贵建议！我们已记录并提交至策划组评估，后续版本会持续优化玩家游戏体验。' },
  ];

  const fetchList = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await getFeedbacks({
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
      });
      setFeedbacks(res.data);
    } catch (err) {
      console.error('Failed to load feedbacks', err);
    } finally {
      setLoading(false);
      if (!isSilent) setRefreshing(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchList();
    // Real-time polling every 6 seconds as indicated by "实时刷新中"
    const interval = setInterval(() => {
      fetchList(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchList]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSendReply = async (feedback: Feedback) => {
    const text = replyTextMap[feedback.id] || '';
    if (!text.trim()) {
      setReplyNoticeMap((prev) => ({
        ...prev,
        [feedback.id]: { type: 'error', msg: '请先输入回复内容' },
      }));
      return;
    }

    setReplyLoadingMap((prev) => ({ ...prev, [feedback.id]: true }));
    setReplyNoticeMap((prev) => ({ ...prev, [feedback.id]: null }));

    try {
      const res = await replyFeedback(feedback.id, text.trim());
      // Update local state
      setFeedbacks((prev) =>
        prev.map((item) => (item.id === feedback.id ? res.feedback : item))
      );
      setReplyTextMap((prev) => ({ ...prev, [feedback.id]: '' }));

      const isSimulated = res.sendResult?.isSimulated;
      const successNotice = isSimulated
        ? '回复已保存！(提示: 当前SMTP授权码未设置，已记录回复并执行模拟投递，设置SMTP密码后即可真实发件)'
        : '✓ 回复邮件已成功通过 SMTP 发送至玩家邮箱！';

      setReplyNoticeMap((prev) => ({
        ...prev,
        [feedback.id]: { type: 'success', msg: successNotice },
      }));
    } catch (err: any) {
      setReplyNoticeMap((prev) => ({
        ...prev,
        [feedback.id]: { type: 'error', msg: err.message || 'SMTP 发送失败，请检查 SMTP 配置' },
      }));
    } finally {
      setReplyLoadingMap((prev) => ({ ...prev, [feedback.id]: false }));
    }
  };

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    try {
      const updated = await updateFeedbackStatus(id, { status: newStatus });
      setFeedbacks((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确认删除此条反馈记录吗？')) return;
    try {
      await deleteFeedback(id);
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case 'Bug反馈':
        return 'bg-amber-950/70 text-amber-300 border border-amber-600/60';
      case '举报违规':
        return 'bg-red-950/70 text-red-300 border border-red-600/60';
      case '充值问题':
        return 'bg-purple-950/70 text-purple-300 border border-purple-600/60';
      case '游戏建议':
        return 'bg-sky-950/70 text-sky-300 border border-sky-600/60';
      case '账号安全':
        return 'bg-rose-950/70 text-rose-300 border border-rose-600/60';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Row matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white tracking-tight">
            收件箱 <span className="text-sm font-normal text-slate-400">（共 {feedbacks.length} 条）</span>
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => fetchList()}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>刷新</span>
          </button>

          {/* Screenshot 2 indicator: ● 实时刷新中 */}
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>实时刷新中</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#161b22] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Categories Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {['全部', 'Bug反馈', '举报违规', '充值问题', '游戏建议', '账号安全'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#21262d] border border-slate-700 rounded-lg text-slate-300 text-xs px-2.5 py-1.5 focus:outline-none"
          >
            <option value="全部">全部状态</option>
            <option value="待处理">待处理</option>
            <option value="已回复">已回复</option>
          </select>

          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索玩家或内容..."
              className="w-full bg-[#21262d] border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Feedback List matching Screenshot 2 design */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
          <p className="text-sm">加载反馈列表中...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="py-16 text-center bg-[#161b22] border border-slate-800 rounded-xl space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-medium">暂无符合条件的反馈记录</p>
          <p className="text-xs text-slate-500">可在上方重置筛选条件，或切换至玩家端提交新的反馈测试</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((item) => {
            const isExpanded = expandedId === item.id;
            const currentReplyText = replyTextMap[item.id] || '';
            const isReplying = replyLoadingMap[item.id] || false;
            const notice = replyNoticeMap[item.id];

            return (
              <div
                key={item.id}
                className="bg-[#161b22] border border-slate-800 rounded-xl transition-all overflow-hidden hover:border-slate-700/80"
              >
                {/* Main Card Summary Row matching Screenshot 2 */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                    {/* Left: Nickname <Email> + Category Tag + Status Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white text-base tracking-tight">
                        {item.nickname}
                      </span>
                      <span className="text-sm text-slate-400 font-normal">
                        &lt;{item.email}&gt;
                      </span>

                      {/* Category Tag (Bug反馈 / 违规举报 / etc.) */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${getCategoryBadgeStyle(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>

                      {/* Status Badge (已回复 / 待处理) */}
                      {item.status === '已回复' ? (
                        <span className="text-xs px-2 py-0.5 rounded font-medium bg-[#064e3b]/80 text-emerald-300 border border-emerald-600/60">
                          已回复
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-950/60 text-amber-300 border border-amber-700/60">
                          待处理
                        </span>
                      )}

                      {/* Auto Tag */}
                      {item.autoTags?.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Right: Timestamp */}
                    <div className="text-xs text-slate-400 font-mono tabular-nums shrink-0">
                      {item.createdAt}
                    </div>
                  </div>

                  {/* Toggle button: 查看详情 ⌵ */}
                  <div className="mt-1 flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
                    >
                      <span>{isExpanded ? '收起详情' : '查看详情'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">{item.id}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="删除记录"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content Preview (matches Screenshot 2 text line) */}
                  <div className="mt-2 text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {item.content}
                  </div>
                </div>

                {/* Expanded Details & SMTP Reply Section */}
                {isExpanded && (
                  <div className="border-t border-slate-800/90 bg-[#0d1117] p-4 sm:p-6 space-y-6">
                    {/* Full Content & Attachments */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          详细反馈内容
                        </span>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>主题：<strong className="text-slate-200">{item.subject}</strong></span>
                          <span>优先级：<strong className="text-amber-400">{item.priority}</strong></span>
                        </div>
                      </div>

                      <div className="p-4 bg-[#161b22] border border-slate-800 rounded-xl text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </div>

                      {/* Attached Screenshots */}
                      {item.images && item.images.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>玩家上传截图 ({item.images.length} 张，点击放大查看)</span>
                          </span>
                          <div className="flex flex-wrap gap-3">
                            {item.images.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewImage(img)}
                                className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-700 bg-black cursor-pointer hover:border-emerald-500 transition-all"
                              >
                                <img
                                  src={img}
                                  alt={`截图附件 ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs">
                                  点击放大
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Historical Reply Thread */}
                    {item.replies && item.replies.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span>已发送的官方邮件回复记录 ({item.replies.length})</span>
                        </span>
                        <div className="space-y-2">
                          {item.replies.map((rep) => (
                            <div
                              key={rep.id}
                              className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-xs space-y-2"
                            >
                              <div className="flex items-center justify-between text-slate-400">
                                <span className="font-medium text-emerald-300">
                                  发件人: {rep.sentBy}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{rep.sentAt}</span>
                                  {rep.emailStatus === 'sent' && (
                                    <span className="text-emerald-400 font-medium">✓ SMTP 已送达</span>
                                  )}
                                  {rep.emailStatus === 'simulated' && (
                                    <span className="text-amber-400 font-medium">⚡ 模拟发送</span>
                                  )}
                                  {rep.emailStatus === 'failed' && (
                                    <span className="text-red-400 font-medium">✗ 发送异常</span>
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                                {rep.content}
                              </p>
                              {rep.smtpResponse && (
                                <p className="text-[11px] text-slate-500 font-mono">
                                  服务器响应: {rep.smtpResponse}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Reply via SMTP Form */}
                    <div className="p-4 bg-[#161b22] border border-slate-800 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Send className="w-4 h-4 text-emerald-400" />
                          <span>通过 SMTP 给玩家邮箱回复结果</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          收件人: <strong className="text-slate-200">{item.email}</strong>
                        </span>
                      </div>

                      {/* Quick Template Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-slate-500">快速填入模版：</span>
                        {quickTemplates.map((tpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setReplyTextMap((prev) => ({
                                ...prev,
                                [item.id]: tpl.text,
                              }))
                            }
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors"
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>

                      {/* Reply Textarea */}
                      <textarea
                        value={currentReplyText}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="输入官方处理结果与回复内容，系统将自动套用邮件模板并调用 SMTP 服务器发往该玩家邮箱..."
                        rows={3}
                        className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm leading-relaxed"
                      />

                      {/* Notice Banner */}
                      {notice && (
                        <div
                          className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 ${
                            notice.type === 'success'
                              ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                              : 'bg-red-950/40 border border-red-800 text-red-300'
                          }`}
                        >
                          <span>{notice.msg}</span>
                          {notice.type === 'error' && onGoToSmtp && (
                            <button
                              onClick={onGoToSmtp}
                              className="underline hover:text-white shrink-0"
                            >
                              去配置SMTP
                            </button>
                          )}
                        </div>
                      )}

                      {/* Submit Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                item.id,
                                item.status === '待处理' ? '已回复' : '待处理'
                              )
                            }
                            className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors"
                          >
                            标记为{item.status === '待处理' ? '已处理' : '待处理'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSendReply(item)}
                          disabled={isReplying}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-950"
                        >
                          {isReplying ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>SMTP 发送中...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>通过 SMTP 发送反馈邮件</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="放大截图"
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-slate-800 text-white p-2 rounded-full border border-slate-600 hover:bg-slate-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
