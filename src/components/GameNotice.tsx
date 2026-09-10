import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function GameNotice({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"><div className="w-full max-w-sm rounded-2xl border border-amber-500/50 bg-[#111827] p-5 shadow-2xl"><div className="flex items-start gap-3"><div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2 text-amber-400"><AlertTriangle className="h-5 w-5" /></div><div className="flex-1"><h3 className="font-black text-white">游戏提示</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p></div><button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button></div><button onClick={onClose} className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-black text-black">我知道了</button></div></div>;
}
