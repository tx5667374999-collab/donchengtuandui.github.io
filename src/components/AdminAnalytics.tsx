import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { FeedbackStats } from '../types/feedback';
import { getStats } from '../services/api';

export const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="py-16 text-center text-slate-500 text-sm">
        加载统计数据中...
      </div>
    );
  }

  const replyRate = stats.total > 0 ? Math.round((stats.repliedCount / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>总计接收反馈</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {stats.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">自动入库分类存储</div>
        </div>

        <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>已回复解决</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {stats.repliedCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">回复率 {replyRate}%</div>
        </div>

        <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>待处理排队</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {stats.pendingCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">需客服或程序跟进</div>
        </div>

        <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>SMTP 邮件通道</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 font-mono tabular-nums">
            就绪
          </div>
          <div className="text-xs text-slate-500 mt-1">支持模板自动套用</div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>问题分类分布统计</span>
        </h3>

        <div className="space-y-3">
          {Object.entries(stats.categoryCounts).map(([cat, count]) => {
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat}</span>
                  <span className="text-slate-400 font-mono tabular-nums">
                    {count} 条 ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-[#21262d] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto Classification Engine Rules */}
      <div className="bg-[#161b22] border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>智能分类与自动入库机制说明</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          当玩家在前端提交反馈时，后端系统会实时提取玩家选择的主题与正文语义特征，执行自动分类、优先级标记与标签提取后持久化写入数据库：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3 bg-[#0d1117] border border-slate-800 rounded-lg space-y-1">
            <span className="font-semibold text-red-400">🚨 充值异常（紧急级）</span>
            <p className="text-slate-400">检测关键词：充值、扣款、未到账、退款、点券、钻石等，自动设为紧急优先级。</p>
          </div>
          <div className="p-3 bg-[#0d1117] border border-slate-800 rounded-lg space-y-1">
            <span className="font-semibold text-amber-400">🛡️ 违规举报（高优先级）</span>
            <p className="text-slate-400">检测外挂、透视、自瞄、演员、脚本、辱骂等涉嫌违规或破坏生态行为。</p>
          </div>
          <div className="p-3 bg-[#0d1117] border border-slate-800 rounded-lg space-y-1">
            <span className="font-semibold text-emerald-400">🐛 Bug 漏洞反馈</span>
            <p className="text-slate-400">检测闪退、崩溃、黑屏、卡死、穿模、技能异常，并提取崩溃特征标签。</p>
          </div>
          <div className="p-3 bg-[#0d1117] border border-slate-800 rounded-lg space-y-1">
            <span className="font-semibold text-sky-400">💡 玩法与体验建议</span>
            <p className="text-slate-400">汇总玩家对平衡性、UI交互、活动玩法等的创新与改进建议。</p>
          </div>
        </div>
      </div>
    </div>
  );
};
