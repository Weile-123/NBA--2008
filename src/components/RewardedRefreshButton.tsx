import { MonitorPlay } from 'lucide-react';

export function RewardedRefreshButton({
  loading,
  disabled = false,
  onClick,
}: {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/70 disabled:text-slate-500"
    >
      <MonitorPlay className={`h-3.5 w-3.5 ${loading ? 'animate-pulse' : ''}`} />
      <span>{loading ? '广告加载中…' : disabled ? '已刷新' : '换一批'}</span>
    </button>
  );
}
