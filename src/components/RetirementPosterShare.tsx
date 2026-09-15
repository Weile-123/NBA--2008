import React, { useEffect, useRef, useState } from 'react';
import { RetiredPlayerRecord } from '../types';

const RETIREMENT_POST_DESTINATION = {
  tagName: '篮坛传奇：重返2008', tagId: '156671', topicName: '步行街主干道', topicId: '1',
} as const;

type PosterStatus = 'idle' | 'uploading' | 'opening' | 'done' | 'error';

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawClassicPoster(ctx: CanvasRenderingContext2D, record: RetiredPlayerRecord) {
  const { player, careerAccolades } = record;
  ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, 750, 1120);
  ctx.fillStyle = '#f59e0b'; ctx.fillRect(32, 32, 686, 4);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 54px sans-serif'; ctx.fillText(player.name.slice(0, 12), 60, 125);
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 25px sans-serif'; ctx.fillText(`${player.position} · #${player.jerseyNum}  生涯谢幕`, 60, 172);
  ctx.fillStyle = '#cbd5e1'; ctx.font = '24px sans-serif'; ctx.fillText(`退役：${record.retireAge} 岁 · 选秀：${player.draftYear} 年第 ${player.draftPick} 顺位`, 60, 220);
  const cards = [['GOAT 积分', `${record.goatScore}`], ['最高综评 OVR', `${record.peakOvr}`], ['生涯总得分', `${record.totalPoints}`], ['生涯总篮板', `${record.totalRebounds}`], ['生涯总助攻', `${record.totalAssists}`], ['生涯出场数', `${record.totalGames}`]];
  cards.forEach(([label, value], i) => {
    const x = 48 + (i % 2) * 340, y = 285 + Math.floor(i / 2) * 140;
    ctx.strokeStyle = '#334155'; ctx.strokeRect(x, y, 315, 110);
    ctx.fillStyle = '#94a3b8'; ctx.font = '20px sans-serif'; ctx.fillText(label, x + 18, y + 38);
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 34px sans-serif'; ctx.fillText(value, x + 18, y + 84);
  });
  ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 27px sans-serif'; ctx.fillText('生涯成就与荣誉汇总', 48, 760);
  const honors = [`${careerAccolades.championships} 次 联盟总冠军`, `${careerAccolades.mvps} 次 常规赛 MVP`, `${careerAccolades.fmvps} 次 总决赛 FMVP`, `${careerAccolades.dpoys} 次 最佳防守球员`, `${careerAccolades.allStarApps} 次 全明星正赛`];
  honors.forEach((item, i) => { ctx.fillStyle = '#e2e8f0'; ctx.font = '23px sans-serif'; ctx.fillText(`🏆 ${item}`, 64, 815 + i * 46); });
  if (record.retiredJerseys.length) {
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`退役球衣：${record.retiredJerseys.map((item) => `${item.teamName} #${item.jerseyNum}`).join('、').slice(0, 30)}`, 48, 1070);
  }
}

function drawParallelPoster(ctx: CanvasRenderingContext2D, record: RetiredPlayerRecord) {
  const { player, careerAccolades } = record;
  const background = ctx.createLinearGradient(0, 0, 750, 1120);
  background.addColorStop(0, '#06172b'); background.addColorStop(0.5, '#10143b'); background.addColorStop(1, '#260b3d');
  ctx.fillStyle = background; ctx.fillRect(0, 0, 750, 1120);

  ctx.save(); ctx.globalAlpha = 0.13; ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1;
  for (let x = -300; x < 1050; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 520, 1120); ctx.stroke(); }
  for (let y = 0; y < 1120; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(750, y); ctx.stroke(); }
  ctx.restore();

  const glow = ctx.createRadialGradient(610, 160, 10, 610, 160, 330);
  glow.addColorStop(0, 'rgba(217,70,239,0.38)'); glow.addColorStop(1, 'rgba(217,70,239,0)');
  ctx.fillStyle = glow; ctx.fillRect(280, 0, 470, 520);

  roundedRect(ctx, 48, 48, 250, 46, 23); ctx.fillStyle = 'rgba(34,211,238,0.14)'; ctx.fill();
  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#67e8f9'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('平行联盟', 70, 79);
  ctx.fillStyle = '#fff'; ctx.font = '900 58px sans-serif'; ctx.fillText(player.name.slice(0, 10), 48, 175);
  ctx.fillStyle = '#c4b5fd'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('另一条时间线的传奇终章', 50, 220);
  ctx.fillStyle = '#94a3b8'; ctx.font = '21px sans-serif'; ctx.fillText(`${record.startYear}—${record.endYear} · ${record.seasonsPlayed} 个赛季`, 50, 260);

  roundedRect(ctx, 465, 115, 230, 165, 26);
  const scoreGradient = ctx.createLinearGradient(465, 115, 695, 280);
  scoreGradient.addColorStop(0, 'rgba(34,211,238,0.20)'); scoreGradient.addColorStop(1, 'rgba(217,70,239,0.24)');
  ctx.fillStyle = scoreGradient; ctx.fill(); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#a5f3fc'; ctx.font = '18px sans-serif'; ctx.fillText('GOAT SCORE', 490, 160);
  ctx.fillStyle = '#fff'; ctx.font = '900 47px sans-serif'; ctx.fillText(`${record.goatScore}`, 490, 218);
  ctx.fillStyle = '#e879f9'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(`PEAK OVR ${record.peakOvr}`, 490, 253);

  const stats: Array<[string, string | number]> = [['总得分', record.totalPoints], ['总篮板', record.totalRebounds], ['总助攻', record.totalAssists], ['出场', record.totalGames], ['场均得分', record.avgPpg.toFixed(1)], ['退役年龄', `${record.retireAge} 岁`]];
  stats.forEach(([label, value], index) => {
    const col = index % 3, row = Math.floor(index / 3), x = 48 + col * 222, y = 340 + row * 132;
    roundedRect(ctx, x, y, 202, 108, 18); ctx.fillStyle = row === 0 ? 'rgba(8,47,73,0.68)' : 'rgba(46,16,101,0.55)'; ctx.fill();
    ctx.strokeStyle = row === 0 ? 'rgba(34,211,238,0.55)' : 'rgba(192,132,252,0.55)'; ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '18px sans-serif'; ctx.fillText(label, x + 17, y + 32);
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 30px sans-serif'; ctx.fillText(String(value), x + 17, y + 78);
  });

  ctx.fillStyle = '#67e8f9'; ctx.font = 'bold 25px sans-serif'; ctx.fillText('这条时间线的荣誉坐标', 48, 640);
  const honors = [`总冠军 ${careerAccolades.championships}`, `MVP ${careerAccolades.mvps}`, `FMVP ${careerAccolades.fmvps}`, `DPOY ${careerAccolades.dpoys}`, `全明星 ${careerAccolades.allStarApps}`, `最佳阵容 ${careerAccolades.allNbaFirsts + careerAccolades.allNbaSeconds + careerAccolades.allNbaThirds}`];
  honors.forEach((honor, index) => {
    const col = index % 2, row = Math.floor(index / 2), x = 48 + col * 333, y = 680 + row * 64;
    roundedRect(ctx, x, y, 305, 46, 23); ctx.fillStyle = col === 0 ? 'rgba(6,182,212,0.14)' : 'rgba(168,85,247,0.14)'; ctx.fill();
    ctx.strokeStyle = col === 0 ? '#0891b2' : '#9333ea'; ctx.stroke();
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(honor, x + 18, y + 30);
  });

  const destinyEvents = record.unlockedDestinyEvents || [];
  roundedRect(ctx, 48, 875, 638, 145, 20); ctx.fillStyle = 'rgba(15,23,42,0.76)'; ctx.fill();
  ctx.strokeStyle = 'rgba(103,232,249,0.45)'; ctx.stroke();
  ctx.fillStyle = '#c4b5fd'; ctx.font = 'bold 19px sans-serif'; ctx.fillText(`解锁命定事件 · ${destinyEvents.length} 项`, 72, 903);
  destinyEvents.slice(0, 6).forEach((event, index) => {
    const col = index % 2; const row = Math.floor(index / 2); const x = 66 + col * 315; const y = 916 + row * 31;
    roundedRect(ctx, x, y, 295, 25, 12); ctx.fillStyle = col === 0 ? 'rgba(6,182,212,0.14)' : 'rgba(168,85,247,0.14)'; ctx.fill();
    ctx.strokeStyle = col === 0 ? 'rgba(34,211,238,0.65)' : 'rgba(192,132,252,0.65)'; ctx.lineWidth = 1; ctx.stroke();
    const label = `${event.year}  ${event.title}`.slice(0, 25);
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(label, x + 10, y + 17);
  });
  if (destinyEvents.length > 6) { ctx.fillStyle = '#94a3b8'; ctx.font = '12px sans-serif'; ctx.fillText(`+${destinyEvents.length - 6} 项`, 610, 903); }
  ctx.fillStyle = '#94a3b8'; ctx.font = '16px sans-serif'; ctx.fillText(`${player.position} · #${player.jerseyNum} · ${player.draftYear} 年第 ${player.draftPick} 顺位`, 72, 1038);
  ctx.fillStyle = '#22d3ee'; ctx.fillRect(48, 1058, 638, 3);
  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('篮坛传奇：重返2008 · 平行联盟', 48, 1092);
}

export function RetirementPosterShare({ record, onFinish }: { record: RetiredPlayerRecord; onFinish: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<PosterStatus>('idle');
  const [message, setMessage] = useState('');
  const isParallel = record.gameMode === 'random_trade';

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = 750; canvas.height = 1120;
    if (isParallel) drawParallelPoster(ctx, record); else drawClassicPoster(ctx, record);
  }, [isParallel, record]);

  const share = async () => {
    if (status !== 'idle') return;
    const canvas = canvasRef.current;
    if (!canvas || !window.ColorboxAI?.oss?.uploadFile || !window.ColorboxAI?.request?.bbs?.openPostEditor) { setStatus('error'); setMessage('请在虎扑 App 内打开后分享海报'); return; }
    setStatus('uploading');
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw Error('海报生成失败');
      const upload = await window.ColorboxAI.oss.uploadFile({ file: blob, filename: `retirement-${Date.now()}.png` });
      const url = upload.downloadUrl; if (!url || new URL(url).protocol !== 'https:') throw Error('海报上传失败');
      setStatus('opening');
      const modeName = isParallel ? '平行联盟' : '经典模式';
      const opened = await window.ColorboxAI.request.bbs.openPostEditor({ ...RETIREMENT_POST_DESTINATION, title: `${record.player.name} 的${modeName}生涯谢幕`, content: `我的球员在${modeName}以 ${record.goatScore} GOAT 积分退役，最高综评 ${record.peakOvr}。`, imageUrl: url });
      if (opened.code !== 200) throw Error(opened.message || '发帖编辑器打开失败');
      setStatus('done'); setMessage('已打开发帖编辑器');
    } catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : '分享失败'); }
  };

  return <div className={`fixed inset-0 z-[70] p-4 overflow-y-auto ${isParallel ? 'bg-[#030712]/95' : 'bg-black/85'}`}><div className="max-w-md mx-auto space-y-3"><canvas ref={canvasRef} className={`w-full rounded-2xl border ${isParallel ? 'border-cyan-400/60 shadow-lg shadow-fuchsia-500/15' : 'border-amber-500/50'}`} /><p className="text-center text-sm text-slate-200">{message}</p><button onClick={share} disabled={status === 'uploading' || status === 'opening'} className={`w-full rounded-xl py-3 font-black ${isParallel ? 'bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950' : 'bg-amber-500 text-black'}`}>{status === 'uploading' ? '正在上传海报…' : status === 'opening' ? '正在打开编辑器…' : '生成海报并发帖'}</button><button onClick={onFinish} className="w-full rounded-xl bg-slate-700 py-3 text-white font-bold">返回首页</button></div></div>;
}
