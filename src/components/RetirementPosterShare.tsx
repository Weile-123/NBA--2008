import React, { useEffect, useRef, useState } from 'react';
import { RetiredPlayerRecord } from '../types';

export function RetirementPosterShare({ record, onFinish }: { record: RetiredPlayerRecord; onFinish: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'opening' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = 750; canvas.height = 1120;
    const { player, careerAccolades } = record;
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, 750, 1120);
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(32, 32, 686, 4);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 54px sans-serif'; ctx.fillText(player.name.slice(0, 12), 60, 125);
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 25px sans-serif'; ctx.fillText(`${player.position} · #${player.jerseyNum}  生涯谢幕`, 60, 172);
    ctx.fillStyle = '#cbd5e1'; ctx.font = '24px sans-serif'; ctx.fillText(`退役：${record.retireAge} 岁 · 选秀：${player.draftYear} 年第 ${player.draftPick} 顺位`, 60, 220);
    const cards = [['GOAT 积分', `${record.goatScore}`], ['最高综评 OVR', `${record.peakOvr}`], ['生涯总得分', `${record.totalPoints}`], ['生涯总篮板', `${record.totalRebounds}`], ['生涯总助攻', `${record.totalAssists}`], ['生涯出场数', `${record.totalGames}`]];
    cards.forEach(([label, value], i) => { const x = 48 + (i % 2) * 340, y = 285 + Math.floor(i / 2) * 140; ctx.strokeStyle = '#334155'; ctx.strokeRect(x, y, 315, 110); ctx.fillStyle = '#94a3b8'; ctx.font = '20px sans-serif'; ctx.fillText(label, x + 18, y + 38); ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(value, x + 18, y + 84); });
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 27px sans-serif'; ctx.fillText('生涯成就与荣誉汇总', 48, 760);
    const honors = [`${careerAccolades.championships} 次 联盟总冠军`, `${careerAccolades.mvps} 次 常规赛 MVP`, `${careerAccolades.fmvps} 次 总决赛 FMVP`, `${careerAccolades.dpoys} 次 最佳防守球员`, `${careerAccolades.allStarApps} 次 全明星正赛`];
    honors.forEach((item, i) => { ctx.fillStyle = '#e2e8f0'; ctx.font = '23px sans-serif'; ctx.fillText(`🏆 ${item}`, 64, 815 + i * 46); });
    if (record.retiredJerseys.length) { ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(`退役球衣：${record.retiredJerseys.map((item) => `${item.teamName} #${item.jerseyNum}`).join('、').slice(0, 30)}`, 48, 1070); }
  };
  useEffect(draw, [record]);
  const share = async () => {
    if (status !== 'idle') return;
    const canvas = canvasRef.current; if (!canvas || !window.ColorboxAI?.oss?.uploadFile || !window.ColorboxAI?.request?.bbs?.openPostEditor) { setStatus('error'); setMessage('请在虎扑 App 内打开后分享海报'); return; }
    setStatus('uploading');
    try { const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png')); if (!blob) throw Error('海报生成失败'); const upload = await window.ColorboxAI.oss.uploadFile({ file: blob, filename: `retirement-${Date.now()}.png` }); const url = upload.downloadUrl; if (!url || new URL(url).protocol !== 'https:') throw Error('海报上传失败'); setStatus('opening'); const opened = await window.ColorboxAI.request.bbs.openPostEditor({ title: `${record.player.name} 的生涯谢幕`, content: `我的球员以 ${record.goatScore} GOAT 积分退役，最高综评 ${record.peakOvr}。`, imageUrl: url }); if (opened.code !== 200) throw Error(opened.message || '发帖编辑器打开失败'); setStatus('done'); setMessage('已打开发帖编辑器'); } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : '分享失败'); }
  };
  return <div className="fixed inset-0 z-[70] bg-black/85 p-4 overflow-y-auto"><div className="max-w-md mx-auto space-y-3"><canvas ref={canvasRef} className="w-full rounded-2xl border border-amber-500/50" /><p className="text-center text-sm text-slate-200">{message}</p><button onClick={share} disabled={status === 'uploading' || status === 'opening'} className="w-full rounded-xl bg-amber-500 py-3 text-black font-black">{status === 'uploading' ? '正在上传海报…' : status === 'opening' ? '正在打开编辑器…' : '生成海报并发帖'}</button><button onClick={onFinish} className="w-full rounded-xl bg-slate-700 py-3 text-white font-bold">返回首页</button></div></div>;
}
