import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { PlayerFeedbackForm } from './components/PlayerFeedbackForm';
import { AdminInbox } from './components/AdminInbox';
import { AdminSmtpSettings } from './components/AdminSmtpSettings';
import { AdminAnalytics } from './components/AdminAnalytics';
import { Feedback } from './types/feedback';
import { getFeedbacks } from './services/api';
import {
  Sparkles,
  Inbox,
  Settings,
  Gamepad2,
  Send,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('player');
  const [feedbacksCount, setFeedbacksCount] = useState<number>(4);
  const [recentSubmitted, setRecentSubmitted] = useState<Feedback | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Poll count
  useEffect(() => {
    const checkCount = async () => {
      try {
        const res = await getFeedbacks();
        setFeedbacksCount(res.total);
      } catch (err) {
        // silent
      }
    };
    checkCount();
    const interval = setInterval(checkCount, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleFeedbackSubmitted = (newFeedback: Feedback) => {
    setRecentSubmitted(newFeedback);
    setFeedbacksCount((prev) => prev + 1);
    setShowToast(`收到来自玩家「${newFeedback.nickname}」的「${newFeedback.category}」反馈，已入库！`);
    setTimeout(() => setShowToast(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        totalFeedbacks={feedbacksCount}
      />

      {/* Real-time Notification Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161b22] border border-emerald-500/80 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 max-w-md animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-white">新反馈已录入数据库</p>
            <p className="text-slate-300 mt-0.5">{showToast}</p>
          </div>
          <button
            onClick={() => {
              setShowToast(null);
              setCurrentTab('inbox');
            }}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 ml-auto underline shrink-0"
          >
            去查看
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === 'player' && (
          <div className="py-4 sm:py-8">
            {/* Top Intro Section */}
            <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-700/50 rounded-full text-xs text-emerald-300 font-medium mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>东城团队 · 游戏官方玩家反馈中心</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                遇到问题？随时向我们反馈
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                无论是外挂作弊、Bug故障、充值掉单还是玩法建议，提交后系统将智能分类归档，官方将通过邮件给您回复处理结果。
              </p>
            </div>

            {/* Feedback Form matching Screenshot 1 */}
            <PlayerFeedbackForm
              onFeedbackSubmitted={handleFeedbackSubmitted}
              onGoToAdmin={() => setCurrentTab('inbox')}
            />
          </div>
        )}

        {currentTab === 'inbox' && (
          <div className="py-2">
            <AdminInbox onGoToSmtp={() => setCurrentTab('smtp')} />
          </div>
        )}

        {currentTab === 'smtp' && (
          <div className="py-2">
            <AdminSmtpSettings />
          </div>
        )}

        {currentTab === 'analytics' && (
          <div className="py-2">
            <AdminAnalytics />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0d1117] py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>东城团队 · 游戏反馈接收与 SMTP 自动化邮件处理系统</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setCurrentTab('player')}
              className="hover:text-emerald-400 transition-colors"
            >
              玩家端
            </button>
            <span>·</span>
            <button
              onClick={() => setCurrentTab('inbox')}
              className="hover:text-emerald-400 transition-colors"
            >
              收件箱
            </button>
            <span>·</span>
            <button
              onClick={() => setCurrentTab('smtp')}
              className="hover:text-emerald-400 transition-colors"
            >
              SMTP 设置
            </button>
            <span>·</span>
            <button
              onClick={() => setCurrentTab('analytics')}
              className="hover:text-emerald-400 transition-colors"
            >
              分类统计
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
