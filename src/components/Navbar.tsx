import React from 'react';
import { Gamepad2, Inbox, Settings, BarChart2, Sparkles } from 'lucide-react';

export type NavTab = 'player' | 'inbox' | 'smtp' | 'analytics';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  totalFeedbacks: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  totalFeedbacks,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('player')}
          className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span>GameFeedback Hub</span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onSelectTab('player')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'player'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>玩家反馈端</span>
          </button>

          <button
            onClick={() => onSelectTab('inbox')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'inbox'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>后台收件箱</span>
            {totalFeedbacks > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded text-[11px] font-mono">
                {totalFeedbacks}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('smtp')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              currentTab === 'smtp'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>SMTP 配置</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`hidden md:flex px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors items-center gap-1.5 ${
              currentTab === 'analytics'
                ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>分类统计</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          {currentTab === 'player' ? (
            <button
              onClick={() => onSelectTab('inbox')}
              className="px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 hover:bg-emerald-900/60 rounded-lg transition-colors whitespace-nowrap"
            >
              进入管理后台 →
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('player')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap"
            >
              体验玩家填表
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
