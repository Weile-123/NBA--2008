import React, { useState, useMemo } from 'react';
import { X, Sparkles, Trophy, Award, Zap, BarChart3, RotateCcw, HelpCircle, Check, Flame, Shield, Star, Award as AwardIcon } from 'lucide-react';

interface GoatCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Preset historic player templates for testing real-time calculator
const PLAYER_PRESETS = [
  {
    name: '迈克尔·乔丹',
    avatar: '🐐',
    mvp: 5,
    fmvp: 6,
    champion: 6,
    dpoy: 1,
    scoringTitle: 10,
    allNba1st: 10,
    allNba2nd3rd: 1,
    allDef1st: 9,
    allDef2nd: 0,
    allStar: 14,
    ppg: 30.1,
    rpg: 6.2,
    apg: 5.3,
    spg: 2.35,
    bpg: 0.83,
    topg: 2.73,
    pts: 32292,
    reb: 6672,
    ast: 5633,
    stl: 2514,
    blk: 893,
  },
  {
    name: '勒布朗·詹姆斯',
    avatar: '👑',
    mvp: 4,
    fmvp: 4,
    champion: 4,
    dpoy: 0,
    scoringTitle: 1,
    allNba1st: 13,
    allNba2nd3rd: 7,
    allDef1st: 5,
    allDef2nd: 1,
    allStar: 20,
    ppg: 27.1,
    rpg: 7.5,
    apg: 7.4,
    spg: 1.5,
    bpg: 0.75,
    topg: 3.5,
    pts: 40474,
    reb: 11185,
    ast: 11009,
    stl: 2275,
    blk: 1111,
  },
  {
    name: '科比·布莱恩特',
    avatar: '🐍',
    mvp: 1,
    fmvp: 2,
    champion: 5,
    dpoy: 0,
    scoringTitle: 2,
    allNba1st: 11,
    allNba2nd3rd: 4,
    allDef1st: 9,
    allDef2nd: 3,
    allStar: 18,
    ppg: 25.0,
    rpg: 5.2,
    apg: 4.7,
    spg: 1.44,
    bpg: 0.48,
    topg: 3.0,
    pts: 33643,
    reb: 7047,
    ast: 6306,
    stl: 1944,
    blk: 640,
  },
  {
    name: '斯蒂芬·库里',
    avatar: '🎯',
    mvp: 2,
    fmvp: 1,
    champion: 4,
    dpoy: 0,
    scoringTitle: 2,
    allNba1st: 4,
    allNba2nd3rd: 6,
    allDef1st: 0,
    allDef2nd: 0,
    allStar: 10,
    ppg: 24.8,
    rpg: 4.7,
    apg: 6.4,
    spg: 1.5,
    bpg: 0.2,
    topg: 3.1,
    pts: 23668,
    reb: 4509,
    ast: 6119,
    stl: 1473,
    blk: 235,
  },
  {
    name: '沙奎尔·奥尼尔',
    avatar: '💥',
    mvp: 1,
    fmvp: 3,
    champion: 4,
    dpoy: 0,
    scoringTitle: 2,
    allNba1st: 8,
    allNba2nd3rd: 6,
    allDef1st: 0,
    allDef2nd: 3,
    allStar: 15,
    ppg: 23.7,
    rpg: 10.9,
    apg: 2.5,
    spg: 0.6,
    bpg: 2.3,
    topg: 2.7,
    pts: 28596,
    reb: 13099,
    ast: 3026,
    stl: 739,
    blk: 2732,
  },
];

export const GoatCalculatorModal: React.FC<GoatCalculatorModalProps> = ({ isOpen, onClose }) => {
  // 1. 统治荣誉分 State
  const [mvp, setMvp] = useState<number>(5);
  const [fmvp, setFmvp] = useState<number>(6);
  const [champion, setChampion] = useState<number>(6);
  const [dpoy, setDpoy] = useState<number>(1);
  const [scoringTitle, setScoringTitle] = useState<number>(10);

  // 2. 阵容与防守分 State
  const [allNba1st, setAllNba1st] = useState<number>(10);
  const [allNba2nd3rd, setAllNba2nd3rd] = useState<number>(1);
  const [allDef1st, setAllDef1st] = useState<number>(9);
  const [allDef2nd, setAllDef2nd] = useState<number>(0);
  const [allStar, setAllStar] = useState<number>(14);

  // 3. 巅峰效率分 State
  const [ppg, setPpg] = useState<number>(30.1);
  const [rpg, setRpg] = useState<number>(6.2);
  const [apg, setApg] = useState<number>(5.3);
  const [spg, setSpg] = useState<number>(2.35);
  const [bpg, setBpg] = useState<number>(0.83);
  const [topg, setTopg] = useState<number>(2.73);

  // 4. 累计数据分 State
  const [pts, setPts] = useState<number>(32292);
  const [reb, setReb] = useState<number>(6672);
  const [ast, setAst] = useState<number>(5633);
  const [stl, setStl] = useState<number>(2514);
  const [blk, setBlk] = useState<number>(893);

  // Real-time calculation logic adhering strictly to the prompt formulas
  const calcResults = useMemo(() => {
    // 1. 统治荣誉分 (S_honor)
    // 常规赛 MVP: 350 分 / 个
    // 总决赛 FMVP: 280 分 / 个
    // 总冠军: 120 分 / 个
    // 最佳防守球员 DPOY: 100 分 / 个
    // 得分王: 80 分 / 次
    const sHonor = (mvp * 350) + (fmvp * 280) + (champion * 120) + (dpoy * 100) + (scoringTitle * 80);

    // 2. 阵容与防守分 (S_all_nba)
    // 最佳阵容一阵: 60 分 / 次
    // 最佳二阵/三阵: 30 分 / 次
    // 最佳防守一阵: 45 分 / 次
    // 最佳防守二阵: 20 分 / 次
    // 全明星: 15 分 / 次
    const sAllNba = (allNba1st * 60) + (allNba2nd3rd * 30) + (allDef1st * 45) + (allDef2nd * 20) + (allStar * 15);

    // 3. 巅峰效率分 (S_efficiency)
    // PPG_reset = 得分×1.2 + 篮板×1.0 + 助攻×1.2 + 抢断×2.0 + 盖帽×2.0 - 失误×1.5
    // S_efficiency = PPG_reset × 8
    const ppgReset = (ppg * 1.2) + (rpg * 1.0) + (apg * 1.2) + (spg * 2.0) + (bpg * 2.0) - (topg * 1.5);
    const sEfficiency = Math.round(ppgReset * 8);

    // 4. 累计数据分 (S_totals)
    // 总得分：(总得分 / 1000) × 10
    // 总篮板：(总篮板 / 1000) × 6
    // 总助攻：(总助攻 / 1000) × 8
    // 抢断与盖帽：((总抢断 + 总盖帽) / 500) × 5
    const ptsScore = (pts / 1000) * 10;
    const rebScore = (reb / 1000) * 6;
    const astScore = (ast / 1000) * 8;
    const stlBlkScore = ((stl + blk) / 500) * 5;
    const sTotalsExact = ptsScore + rebScore + astScore + stlBlkScore;
    const sTotals = Math.round(sTotalsExact);

    // 总分
    const totalScore = Math.round(sHonor + sAllNba + sEfficiency + sTotals);

    // Rank title
    let rankTitle = '联盟角色球员';
    if (totalScore >= 4500) rankTitle = 'GOAT (历史至尊神级)';
    else if (totalScore >= 3000) rankTitle = '历史前10传奇巨星';
    else if (totalScore >= 2000) rankTitle = '历史级名人堂球星';
    else if (totalScore >= 1300) rankTitle = '全明星常客 / 冠军功臣';
    else if (totalScore >= 700) rankTitle = '优质首发球星';
    else if (totalScore >= 250) rankTitle = '合格轮换球员';

    return {
      sHonor,
      sAllNba,
      sEfficiency,
      sTotals,
      sTotalsExact,
      ppgReset: Number(ppgReset.toFixed(2)),
      ptsScore: Number(ptsScore.toFixed(1)),
      rebScore: Number(rebScore.toFixed(1)),
      astScore: Number(astScore.toFixed(1)),
      stlBlkScore: Number(stlBlkScore.toFixed(1)),
      totalScore,
      rankTitle,
    };
  }, [
    mvp, fmvp, champion, dpoy, scoringTitle,
    allNba1st, allNba2nd3rd, allDef1st, allDef2nd, allStar,
    ppg, rpg, apg, spg, bpg, topg,
    pts, reb, ast, stl, blk
  ]);

  const loadPreset = (preset: typeof PLAYER_PRESETS[0]) => {
    setMvp(preset.mvp);
    setFmvp(preset.fmvp);
    setChampion(preset.champion);
    setDpoy(preset.dpoy);
    setScoringTitle(preset.scoringTitle);
    setAllNba1st(preset.allNba1st);
    setAllNba2nd3rd(preset.allNba2nd3rd);
    setAllDef1st(preset.allDef1st);
    setAllDef2nd(preset.allDef2nd);
    setAllStar(preset.allStar);
    setPpg(preset.ppg);
    setRpg(preset.rpg);
    setApg(preset.apg);
    setSpg(preset.spg);
    setBpg(preset.bpg);
    setTopg(preset.topg);
    setPts(preset.pts);
    setReb(preset.reb);
    setAst(preset.ast);
    setStl(preset.stl);
    setBlk(preset.blk);
  };

  const handleReset = () => {
    setMvp(0);
    setFmvp(0);
    setChampion(0);
    setDpoy(0);
    setScoringTitle(0);
    setAllNba1st(0);
    setAllNba2nd3rd(0);
    setAllDef1st(0);
    setAllDef2nd(0);
    setAllStar(0);
    setPpg(0);
    setRpg(0);
    setApg(0);
    setSpg(0);
    setBpg(0);
    setTopg(0);
    setPts(0);
    setReb(0);
    setAst(0);
    setStl(0);
    setBlk(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0c0f17] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#141824] via-[#1a1f30] to-[#141824] border-b border-[#23293a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white italic tracking-wide flex items-center gap-2">
                联盟 历史球星 GOAT 积分计算器
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30 not-italic">
                  最新算法 v2.0
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                实时计算：统治荣誉分 + 阵容防守分 + 巅峰效率分 + 累计数据分
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1c2233] hover:bg-[#283148] text-slate-400 hover:text-white transition-all cursor-pointer border border-[#2d3750]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Preset Template Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> 一键载入历史巨星数据模板：
              </span>
              <button
                onClick={handleReset}
                className="text-[11px] font-mono font-bold text-slate-400 hover:text-red-400 flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> 数据重置
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {PLAYER_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(p)}
                  className="px-3 py-2 rounded-xl bg-[#151a28] hover:bg-[#1f273d] border border-[#252f48] hover:border-amber-500/50 text-left transition-all cursor-pointer group flex items-center gap-2"
                >
                  <span className="text-lg shrink-0">{p.avatar}</span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                      {p.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.mvp}MVP / {p.champion}冠
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Total Score Card */}
          <div className="bg-gradient-to-br from-[#121726] via-[#171e30] to-[#111624] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Total Score & Tier */}
              <div className="md:col-span-5 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-[#263048] pb-4 md:pb-0 md:pr-4">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                  实时计算 GOAT 总积分
                </span>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 drop-shadow-md">
                    {calcResults.totalScore}
                  </span>
                  <span className="text-sm font-bold text-amber-400/80 font-mono">分</span>
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                  {calcResults.rankTitle}
                </div>
              </div>

              {/* Sub-score grid */}
              <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#0b0e17] border border-amber-500/20 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block font-mono">1. 统治荣誉分</span>
                  <span className="text-base font-black text-amber-400 font-mono">+{calcResults.sHonor}</span>
                </div>
                <div className="bg-[#0b0e17] border border-blue-500/20 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block font-mono">2. 阵容防守分</span>
                  <span className="text-base font-black text-blue-400 font-mono">+{calcResults.sAllNba}</span>
                </div>
                <div className="bg-[#0b0e17] border border-emerald-500/20 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block font-mono">3. 巅峰效率分</span>
                  <span className="text-base font-black text-emerald-400 font-mono">+{calcResults.sEfficiency}</span>
                </div>
                <div className="bg-[#0b0e17] border border-purple-500/20 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block font-mono">4. 累计数据分</span>
                  <span className="text-base font-black text-purple-400 font-mono">+{calcResults.sTotals}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Input Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. 统治荣誉分 (S_honor) */}
            <div className="bg-[#121724] border border-[#232a3f] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#21293e] pb-2">
                <h4 className="text-xs font-black text-amber-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4 shrink-0" /> 1. 统治荣誉分
                </h4>
                <span className="text-xs font-bold text-amber-300 font-mono">
                  共计 +{calcResults.sHonor} 分
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>常规赛 MVP</span>
                    <span className="text-[10px] text-amber-400/80 font-mono">350分/个</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mvp}
                    onChange={(e) => setMvp(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>总决赛 FMVP</span>
                    <span className="text-[10px] text-amber-400/80 font-mono">280分/个</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fmvp}
                    onChange={(e) => setFmvp(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>总冠军</span>
                    <span className="text-[10px] text-amber-400/80 font-mono">120分/个</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={champion}
                    onChange={(e) => setChampion(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>最佳防守球员 DPOY</span>
                    <span className="text-[10px] text-amber-400/80 font-mono">100分/个</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dpoy}
                    onChange={(e) => setDpoy(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>得分王</span>
                    <span className="text-[10px] text-amber-400/80 font-mono">80分/次</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoringTitle}
                    onChange={(e) => setScoringTitle(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. 阵容与防守分 (S_all_nba) */}
            <div className="bg-[#121724] border border-[#232a3f] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#21293e] pb-2">
                <h4 className="text-xs font-black text-blue-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 shrink-0" /> 2. 阵容与防守分
                </h4>
                <span className="text-xs font-bold text-blue-300 font-mono">
                  共计 +{calcResults.sAllNba} 分
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>最佳阵容一阵</span>
                    <span className="text-[10px] text-blue-400/80 font-mono">60分/次</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={allNba1st}
                    onChange={(e) => setAllNba1st(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>最佳二阵/三阵</span>
                    <span className="text-[10px] text-blue-400/80 font-mono">30分/次</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={allNba2nd3rd}
                    onChange={(e) => setAllNba2nd3rd(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>最佳防守一阵</span>
                    <span className="text-[10px] text-blue-400/80 font-mono">45分/次</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={allDef1st}
                    onChange={(e) => setAllDef1st(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>最佳防守二阵</span>
                    <span className="text-[10px] text-blue-400/80 font-mono">20分/次</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={allDef2nd}
                    onChange={(e) => setAllDef2nd(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>全明星</span>
                    <span className="text-[10px] text-blue-400/80 font-mono">15分/次</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={allStar}
                    onChange={(e) => setAllStar(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. 巅峰效率分 (S_efficiency) */}
            <div className="bg-[#121724] border border-[#232a3f] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#21293e] pb-2">
                <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 shrink-0" /> 3. 巅峰效率分 （重置场均得分 × 8）
                </h4>
                <span className="text-xs font-bold text-emerald-300 font-mono">
                  共计 +{calcResults.sEfficiency} 分
                </span>
              </div>

              <div className="text-[10px] font-mono text-slate-400 bg-[#0b0e17] px-2.5 py-1 rounded-lg border border-[#1e2638]">
                PPG_reset = 得分×1.2 + 篮板×1.0 + 助攻×1.2 + 抢断×2.0 + 盖帽×2.0 - 失误×1.5 = <strong className="text-emerald-400">{calcResults.ppgReset}</strong>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>场均得分</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">×1.2</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ppg}
                    onChange={(e) => setPpg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>场均篮板</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">×1.0</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={rpg}
                    onChange={(e) => setRpg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>场均助攻</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">×1.2</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={apg}
                    onChange={(e) => setApg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>场均抢断</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">×2.0</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={spg}
                    onChange={(e) => setSpg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>场均盖帽</span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">×2.0</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bpg}
                    onChange={(e) => setBpg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>场均失误</span>
                    <span className="text-[10px] text-red-400/80 font-mono">-1.5</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={topg}
                    onChange={(e) => setTopg(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. 累计数据分 (S_totals) */}
            <div className="bg-[#121724] border border-[#232a3f] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#21293e] pb-2">
                <h4 className="text-xs font-black text-purple-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 shrink-0" /> 4. 累计数据分
                </h4>
                <span className="text-xs font-bold text-purple-300 font-mono">
                  共计 +{calcResults.sTotals} 分
                </span>
              </div>

              <div className="text-[10px] font-mono text-slate-400 bg-[#0b0e17] px-2.5 py-1 rounded-lg border border-[#1e2638] flex flex-wrap gap-x-3 gap-y-0.5">
                <span>得分: +{calcResults.ptsScore}</span>
                <span>篮板: +{calcResults.rebScore}</span>
                <span>助攻: +{calcResults.astScore}</span>
                <span>抢断+盖帽: +{calcResults.stlBlkScore}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>生涯总得分</span>
                    <span className="text-[10px] text-purple-400/80 font-mono">10分/千分</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pts}
                    onChange={(e) => setPts(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>生涯总篮板</span>
                    <span className="text-[10px] text-purple-400/80 font-mono">6分/千分</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reb}
                    onChange={(e) => setReb(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>生涯总助攻</span>
                    <span className="text-[10px] text-purple-400/80 font-mono">8分/千分</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ast}
                    onChange={(e) => setAst(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>生涯总抢断</span>
                    <span className="text-[10px] text-purple-400/80 font-mono">5分/500个</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stl}
                    onChange={(e) => setStl(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>生涯总盖帽</span>
                    <span className="text-[10px] text-purple-400/80 font-mono">5分/500个</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={blk}
                    onChange={(e) => setBlk(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#0b0e17] border border-[#26314a] rounded-xl px-3 py-1.5 text-white font-mono text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#121622] border-t border-[#23293a] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>算法公式已实时同步更新</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-lg transition-all cursor-pointer active:scale-95"
          >
            完成评估
          </button>
        </div>
      </div>
    </div>
  );
};
