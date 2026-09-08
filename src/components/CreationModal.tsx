import React, { useState, useMemo, useRef } from 'react';
import { Position, PlayerProfile, Attributes } from '../types';
import {
  BODY_SHAPE_PRESETS,
  POSITION_ARCHETYPES,
  calculateAttributesAndCaps,
} from '../utils/attributeCalculator';
import { NBA_TEAMS_2008 } from '../data/nbaData2008';
import { get15LifeSimulationEvents, LifeEvent, LifeOption } from '../data/lifeSimulationData';
import { calculateUserDraftPick } from '../utils/draftLogic';
import { validateSensitiveName } from '../utils/sensitiveWords';
import { WeChatPayModal } from './WeChatPayModal';
import { TeamLogo } from './TeamLogo';
import { Sparkles, Zap, Sliders, User, Trophy, Heart, Globe, Award, CheckCircle2, ArrowRight, RotateCcw, X, Search, Eye, AlertCircle, Home } from 'lucide-react';

interface CreationModalProps {
  onComplete: (player: PlayerProfile) => void;
  onBackToHome?: () => void;
}

const BIRTHPLACE_PRESETS = [
  { label: '纽约', icon: '🗽' },
  { label: '洛杉矶', icon: '🌴' },
  { label: '芝加哥', icon: '🏙️' },
  { label: '费城', icon: '🔔' },
  { label: '休斯顿', icon: '🚀' },
  { label: '迈阿密', icon: '🏖️' },
  { label: '亚特兰大', icon: '🍑' },
  { label: '西雅图', icon: '🌲' },
];

const FAMILY_BACKGROUND_PRESETS = [
  { id: '篮球世家', title: '🏀 篮球世家', desc: '父辈曾是职业球员，继承顶级篮球智商与私人特训资源' },
  { id: '街头球手', title: '🏙️ 街头球手', desc: '出身平民街头铁笼，打法桀骜强悍，高压下爆发力惊人' },
  { id: '学霸', title: '🎓 学霸', desc: '极高球商与学术底蕴，擅长运动科学与战术数据剖析，冷静克制' },
  { id: '普通人', title: '🧢 普通人', desc: '没有天赋光环与特权，凭百倍汗水与不屈韧性一步步闯出一片天' },
];

export const CreationModal: React.FC<CreationModalProps> = ({ onComplete, onBackToHome }) => {
  // Creation modal step flow:
  // 'identity' -> 'simulation' -> 'summary' -> 'customize'
  const [step, setStep] = useState<'identity' | 'simulation' | 'summary' | 'customize'>('identity');

  // Step 1: Basic identity & immersion background before simulation
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [nameErrorMsg, setNameErrorMsg] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [birthplace, setBirthplace] = useState('纽约');
  const [familyBackground, setFamilyBackground] = useState('街头球手');

  // Name validation helper
  const validateName = (): boolean => {
    if (!name.trim()) {
      setNameError(true);
      setNameErrorMsg('主角姓名未填写，请输入后再继续！');
      if (nameInputRef.current) {
        nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInputRef.current.focus();
      }
      return false;
    }

    const check = validateSensitiveName(name);
    if (!check.isValid) {
      setNameError(true);
      setNameErrorMsg(check.errorMsg || '输入包含敏感词汇，请重新输入');
      if (nameInputRef.current) {
        nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInputRef.current.focus();
      }
      return false;
    }

    setNameError(false);
    setNameErrorMsg('');
    return true;
  };

  // Step 2: 15 Life Simulation State
  const [events, setEvents] = useState<LifeEvent[]>(() =>
    get15LifeSimulationEvents(birthplace, familyBackground)
  );
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [chosenHistory, setChosenHistory] = useState<Array<{ event: LifeEvent; chosen: LifeOption }>>([]);
  const [accumulatedScore, setAccumulatedScore] = useState(65.0);
  const [earnedTags, setEarnedTags] = useState<string[]>([]);
  const [stageResult, setStageResult] = useState<{
    option: LifeOption;
    eventIndex: number;
    scoreDelta: number;
    newTotalScore: number;
  } | null>(null);

  // Calculated Base OVR (bounded 65-75) after 15 events
  const [baseOvr, setBaseOvr] = useState(68);
  const [isSkippedSimulation, setIsSkippedSimulation] = useState(false);

  // Skip simulation handler (Directly set baseOvr to 69 and proceed to customization)
  const handleSkipSimulation = (targetOvr: number = 69) => {
    if (!validateName()) return;
    setBaseOvr(targetOvr);
    setIsSkippedSimulation(true);
    setStep('customize');
  };

  // Step 4: Player Customization state
  const [jerseyNum, setJerseyNum] = useState(24);
  const [position, setPosition] = useState<Position>('PG');
  const [favoriteTeamId, setFavoriteTeamId] = useState<string>('lal');

  // Height & Weight state
  const [bodyShape, setBodyShape] = useState<'slim' | 'balanced' | 'heavy'>('balanced');
  const [heightCm, setHeightCm] = useState(198);
  const [weightKg, setWeightKg] = useState(92);

  // Position archetype state
  const currentArchetypes = useMemo(() => POSITION_ARCHETYPES[position] || POSITION_ARCHETYPES.PG, [position]);
  const [selectedArchId, setSelectedArchId] = useState<string>(currentArchetypes[0].id);

  // Paid OVR boost state
  const [paidBoostOvr, setPaidBoostOvr] = useState(0);
  const [showWeChatModal, setShowWeChatModal] = useState(false);

  // Mobile H5 UI Modal States (Team selection & Full Attributes preview)
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAllAttrsModal, setShowAllAttrsModal] = useState(false);
  const [teamConfFilter, setTeamConfFilter] = useState<'ALL' | 'East' | 'West'>('ALL');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Start / Restart Simulation
  const handleStartSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateName()) return;
    const newEvents = get15LifeSimulationEvents(birthplace, familyBackground);
    setEvents(newEvents);
    setCurrentEventIndex(0);
    setChosenHistory([]);
    setAccumulatedScore(65.0);
    setEarnedTags([]);
    setStageResult(null);
    setStep('simulation');
  };

  // Choice handler in 15 Life Events
  const handleOptionSelect = (option: LifeOption) => {
    const currentEvent = events[currentEventIndex];
    const newScore = Math.min(75, Math.max(65, accumulatedScore + option.scoreDelta));
    setAccumulatedScore(newScore);

    const updatedHistory = [...chosenHistory, { event: currentEvent, chosen: option }];
    setChosenHistory(updatedHistory);

    if (option.tag && !earnedTags.includes(option.tag)) {
      setEarnedTags([...earnedTags, option.tag]);
    }

    setStageResult({
      option,
      eventIndex: currentEventIndex,
      scoreDelta: option.scoreDelta,
      newTotalScore: newScore,
    });
  };

  // Advance to next event or finish after viewing result feedback
  const handleNextEvent = () => {
    if (!stageResult) return;
    const finishedIndex = stageResult.eventIndex;
    setStageResult(null);

    if (finishedIndex < 14) {
      setCurrentEventIndex(finishedIndex + 1);
    } else {
      // Finished all 15 events!
      const finalOvr = Math.min(75, Math.max(65, Math.round(stageResult.newTotalScore)));
      setBaseOvr(finalOvr);
      setStep('summary');
    }
  };

  // When position changes, reset archetype
  const handlePositionChange = (pos: Position) => {
    setPosition(pos);
    const newArchs = POSITION_ARCHETYPES[pos] || POSITION_ARCHETYPES.PG;
    setSelectedArchId(newArchs[0].id);
  };

  // Body shape preset select
  const handlePresetSelect = (presetId: 'slim' | 'balanced' | 'heavy') => {
    setBodyShape(presetId);
    const preset = BODY_SHAPE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setHeightCm(preset.heightCm);
      setWeightKg(preset.weightKg);
    }
  };

  // Calculate final attributes & caps based on baseOvr
  const { attributes, attributeCaps, initialOvr } = useMemo(() => {
    return calculateAttributesAndCaps(
      position,
      selectedArchId,
      heightCm,
      weightKg,
      paidBoostOvr,
      baseOvr
    );
  }, [position, selectedArchId, heightCm, weightKg, paidBoostOvr, baseOvr]);

  const activeArch = currentArchetypes.find((a) => a.id === selectedArchId) || currentArchetypes[0];

  const handleSubmitFinalPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayer: PlayerProfile = {
      name: name.trim(),
      nationality: birthplace.trim() || '纽约',
      birthplace: birthplace.trim() || '纽约',
      familyBackground,
      jerseyNum,
      height: `${heightCm}cm`,
      weight: `${weightKg}kg`,
      position,
      archetype: activeArch.name,
      attributes,
      attributeCaps,
      ovr: initialOvr,
      skillPoints: 0,
      xp: 0,
      maxXp: 500,
      level: 1,
      money: 0,
      energy: 100,
      morale: 100,
      health: { status: 'healthy' },
      currentTeamId: favoriteTeamId,
      favoriteTeamId: favoriteTeamId,
      draftPick: calculateUserDraftPick(initialOvr),
      draftYear: 2008,
      contract: {
        salaryPerYear: 3800000,
        yearsLeft: 3,
        totalYears: 3,
        isRookieContract: true,
      },
      careerStats: {
        games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
        fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, minutes: 0,
        gamesStarted: 0, turnovers: 0, offReb: 0, defReb: 0,
      },
      seasonStats: {
        games: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
        fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, minutes: 0,
        gamesStarted: 0, turnovers: 0, offReb: 0, defReb: 0,
      },
      accolades: [],
      endorsements: [],
      signatureShoe: null,
      fansCount: 10000,
      mediaReputation: 75,
      age: 19,
      peakAge: 26,
      peakOvr: 98,
      peakDuration: 8,
      isRookie: true,
    };

    onComplete(newPlayer);
  };

  const attrLabels: { key: keyof Attributes; label: string; icon: string }[] = [
    { key: 'midRange', label: '中投', icon: '🎯' },
    { key: 'threePoint', label: '三分', icon: '🏹' },
    { key: 'freeThrow', label: '罚球', icon: '🏀' },
    { key: 'layup', label: '上篮', icon: '👟' },
    { key: 'dunk', label: '扣篮', icon: '💥' },
    { key: 'insideFinish', label: '终结', icon: '🧱' },
    { key: 'postMove', label: '背身', icon: '🏛️' },
    { key: 'ballHandle', label: '控球', icon: '💫' },
    { key: 'passing', label: '传球', icon: '🧠' },
    { key: 'perimeterDef', label: '外防', icon: '🛡️' },
    { key: 'interiorDef', label: '内防', icon: '🏰' },
    { key: 'block', label: '盖帽', icon: '🛑' },
    { key: 'steal', label: '抢断', icon: '⚡' },
    { key: 'rebounding', label: '篮板', icon: '🎯' },
    { key: 'speed', label: '速度', icon: '🏃' },
    { key: 'vertical', label: '弹跳', icon: '🚀' },
    { key: 'strength', label: '力量', icon: '💪' },
    { key: 'stamina', label: '耐力', icon: '🫀' },
  ];

  // Currently selected team object
  const selectedTeamObj = useMemo(() => {
    return NBA_TEAMS_2008.find((t) => t.id === favoriteTeamId) || NBA_TEAMS_2008[0];
  }, [favoriteTeamId]);

  // Filtered teams for team selection modal
  const filteredTeams = useMemo(() => {
    return NBA_TEAMS_2008.filter((t) => {
      const matchConf = teamConfFilter === 'ALL' || t.conference === teamConfFilter;
      const matchSearch =
        !teamSearchQuery.trim() ||
        t.name.includes(teamSearchQuery) ||
        t.abbrev.toLowerCase().includes(teamSearchQuery.toLowerCase());
      return matchConf && matchSearch;
    });
  }, [teamConfFilter, teamSearchQuery]);

  // Core key attributes for quick live preview in sticky header
  const keyAttrsList = useMemo(() => {
    const keys: (keyof Attributes)[] = (() => {
      switch (position) {
        case 'PG': return ['ballHandle', 'threePoint', 'speed', 'passing'];
        case 'SG': return ['threePoint', 'midRange', 'speed', 'layup'];
        case 'SF': return ['threePoint', 'dunk', 'speed', 'perimeterDef'];
        case 'PF': return ['insideFinish', 'rebounding', 'strength', 'interiorDef'];
        case 'C': return ['dunk', 'rebounding', 'interiorDef', 'block'];
        default: return ['threePoint', 'speed', 'dunk', 'ballHandle'];
      }
    })();

    return keys.map((k) => {
      const labelObj = attrLabels.find((al) => al.key === k);
      return {
        key: k,
        label: labelObj?.label || k,
        icon: labelObj?.icon || '🏀',
        val: attributes[k],
        cap: attributeCaps[k],
      };
    });
  }, [position, attributes, attributeCaps, attrLabels]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto text-slate-200">
      <div className="bg-[#11141b] border border-[#232834] rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        {/* TOP HEADER NAVIGATION BAR */}
        {onBackToHome && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#232834]">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0d1017] hover:bg-slate-800 text-slate-300 hover:text-amber-300 text-xs font-bold border border-[#232834] hover:border-amber-500/40 transition-all cursor-pointer shadow-md group"
              title="放弃当前创建并返回主大厅"
            >
              <Home className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>返回首页大厅</span>
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              2008 传奇球星创建系统
            </span>
          </div>
        )}

        {/* STEP 1: IDENTITY & IMMERSION BACKGROUND */}
        {step === 'identity' && (
          <form onSubmit={handleStartSimulation} className="space-y-5 py-1">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5" /> 开启你的 2008 传奇生涯起源
              </div>
              <h3 className="text-2xl sm:text-3xl font-black italic text-white">打造你的球员背景档案</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                设定主角姓名、出身城市与成长出身。你的起源故事将奠定15个高中与NCAA关键选秀事件的基调。
              </p>
            </div>

            <div className="bg-[#0d1017] p-4 sm:p-5 rounded-2xl border border-[#232834] space-y-4 max-w-2xl mx-auto">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-400" /> 主角姓名 (PLAYER NAME)
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError && e.target.value.trim()) {
                      setNameError(false);
                    }
                  }}
                  className={`w-full bg-[#11141b] border rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none transition-all ${
                    nameError
                      ? 'border-red-500 ring-2 ring-red-500/30'
                      : 'border-[#232834] focus:border-amber-500'
                  }`}
                  placeholder="请输入主角姓名"
                />
                {nameError && (
                  <p className="text-xs text-red-400 font-bold flex items-center gap-1.5 mt-2 animate-bounce">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{nameErrorMsg || '主角姓名未填写，请输入后再继续！'}</span>
                  </p>
                )}
              </div>

              {/* Birthplace / City */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-amber-400" /> 出身城市 (BIRTH CITY)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BIRTHPLACE_PRESETS.map((p) => {
                    const isSelected = birthplace === p.label;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setBirthplace(p.label)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                            : 'bg-[#11141b] border-[#232834] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <span>{p.icon}</span> <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Origin & Family Background */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> 出身背景 (FAMILY BACKGROUND)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FAMILY_BACKGROUND_PRESETS.map((bg) => {
                    const isSelected = familyBackground === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setFamilyBackground(bg.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white ring-1 ring-amber-400'
                            : 'bg-[#11141b] border-[#232834] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-black text-amber-300 mb-0.5">{bg.title}</div>
                        <div className="text-[11px] text-slate-400 leading-snug">{bg.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl mx-auto pt-1">
              <button
                type="submit"
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs uppercase tracking-tight shadow-xl transition-transform active:scale-95 cursor-pointer"
              >
                开启15阶段人生模拟历程 (START 15 LIFE EVENTS) →
              </button>

              <button
                type="button"
                onClick={() => handleSkipSimulation(69)}
                className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-black italic rounded-xl text-xs uppercase tracking-tight shadow-xl border border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>跳过人生选择 (初始评分直接69)</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: 15 LIFE SIMULATION EVENTS */}
        {step === 'simulation' && (
          <div className="space-y-5 py-1">
            {/* Simulation Header & Progress Bar */}
            <div className="bg-[#0d1017] p-3.5 rounded-xl border border-[#232834] space-y-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-amber-400 font-black italic uppercase tracking-wider block">
                    {events[currentEventIndex]?.timeLabel}
                  </span>
                  <div className="text-sm font-black text-white italic">
                    {name} ({birthplace}) · {familyBackground} · 事件 {currentEventIndex + 1} / 15
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSkipSimulation(69)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>跳过模拟 (固定69分)</span>
                  </button>

                  <div className="flex items-center gap-2 bg-[#11141b] border border-amber-500/30 px-3 py-1.5 rounded-lg">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase block font-bold">当前基础评分</span>
                      <span className="text-xs font-black text-amber-400 font-mono">
                        {accumulatedScore.toFixed(1)} OVR
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#11141b] rounded-full h-2 overflow-hidden border border-[#232834]">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${((currentEventIndex + 1) / 15) * 100}%` }}
                />
              </div>
            </div>

            {/* If Stage Result is active, display the post-choice feedback view */}
            {stageResult ? (
              <div className="bg-[#0d1017] p-5 sm:p-6 rounded-2xl border border-amber-500/40 space-y-4 text-center animate-fadeIn">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 阶段 {stageResult.eventIndex + 1} 抉择后果评定
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">你的重要抉择</span>
                  <h3 className="text-base sm:text-lg font-black text-amber-300 italic">
                    "{stageResult.option.text}"
                  </h3>
                </div>

                {/* Effect desc box */}
                <div className="bg-[#11141b] p-4 rounded-xl border border-[#232834] space-y-2 text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> 事件结果与球探评估反馈:
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                    {stageResult.option.effectDesc}
                  </p>
                  {stageResult.option.tag && (
                    <div className="pt-1">
                      <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded">
                        🏷️ 获得了球场评价标签: {stageResult.option.tag}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rating delta card */}
                <div className="grid grid-cols-2 gap-3 bg-[#11141b] p-3.5 rounded-xl border border-[#232834]">
                  <div className="bg-[#0d1017] p-2.5 rounded-lg border border-[#232834]">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">本轮基础评分提升</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                      +{stageResult.scoreDelta.toFixed(2)} OVR
                    </span>
                  </div>
                  <div className="bg-[#0d1017] p-2.5 rounded-lg border border-[#232834]">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">当前累计基础评分</span>
                    <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                      {stageResult.newTotalScore.toFixed(1)} OVR
                    </span>
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  type="button"
                  onClick={handleNextEvent}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs uppercase tracking-tight shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>
                    {stageResult.eventIndex < 14
                      ? `进入下一个阶段 (STAGE ${stageResult.eventIndex + 2} / 15)`
                      : '完成15阶段评估 · 解锁生涯初始评分'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Event Story Card */}
                <div className="bg-[#0d1017] p-4 sm:p-5 rounded-2xl border border-amber-500/20 space-y-3 relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-black px-2.5 py-0.5 rounded font-black text-[11px] italic uppercase">
                      阶段 {currentEventIndex + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white italic">
                      {events[currentEventIndex]?.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal bg-[#11141b]/80 p-3.5 rounded-xl border border-[#232834]">
                    {events[currentEventIndex]?.story}
                  </p>
                </div>

                {/* 3 Choice Cards */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 gap-2.5">
                    {events[currentEventIndex]?.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(opt)}
                        className="p-3.5 rounded-xl border border-[#232834] bg-[#11141b] hover:bg-[#181d29] hover:border-amber-500/60 transition-all text-left group relative overflow-hidden active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                              {idx + 1}
                            </span>
                            <div className="space-y-1">
                              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                                {opt.text}
                              </div>
                            </div>
                          </div>

                          {opt.tag && (
                            <div className="text-right shrink-0">
                              <div className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                🏷️ {opt.tag}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: SIMULATION SUMMARY & BASE RATING UNLOCKED */}
        {step === 'summary' && (
          <div className="space-y-5 py-2 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-2xl animate-bounce">
              🏆
            </div>

            <div>
              <span className="text-[10px] font-black italic uppercase tracking-widest text-amber-400">
                15 CAREER ORIGIN EVENTS EVALUATED
              </span>
              <h3 className="text-2xl sm:text-3xl font-black italic text-white mt-1">
                生涯历程评估完成！
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                根据你在高中与NCAA阶段的15次关键择决，系统判定了你的初始新秀实力评分！
              </p>
            </div>

            {/* Base OVR Badge */}
            <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 p-5 rounded-2xl border-2 border-amber-400 max-w-sm mx-auto shadow-2xl">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 block">
                解锁基础综合能力评级 (BASE OVR)
              </span>
              <div className="text-5xl font-black italic font-mono text-white my-1 drop-shadow-md">
                {baseOvr} <span className="text-lg text-amber-400">OVR</span>
              </div>
            </div>

            {/* Earned Personality Badges */}
            {earnedTags.length > 0 && (
              <div className="bg-[#0d1017] p-3.5 rounded-xl border border-[#232834] max-w-lg mx-auto">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-2 text-left flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> 获得了以下个人性格与球场标签:
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {/* Only show top 3 representative tags */}
                  {earnedTags.slice(-3).map((tag) => (
                    <span
                      key={tag}
                      className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                    >
                      🏷️ {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
              <button
                type="button"
                onClick={() => {
                  const newEvents = get15LifeSimulationEvents();
                  setEvents(newEvents);
                  setCurrentEventIndex(0);
                  setChosenHistory([]);
                  setAccumulatedScore(65.0);
                  setEarnedTags([]);
                  setStageResult(null);
                  setStep('simulation');
                }}
                className="flex-1 py-3 bg-[#0d1017] hover:bg-[#181d29] border border-[#232834] text-slate-300 font-bold rounded-xl text-xs uppercase flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> 重新模拟故事
              </button>

              <button
                type="button"
                onClick={() => setStep('customize')}
                className="flex-1 py-3 px-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs uppercase tracking-tight shadow-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                继续定制身材与位置 (CUSTOMIZE PROFILE) <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PLAYER CUSTOMIZATION (身材、位置、号码、模板、心仪球队) */}
        {step === 'customize' && (
          <form onSubmit={handleSubmitFinalPlayer} className="space-y-4 relative">
            {/* STICKY LIVE ATTRIBUTE & OVR HEADER (Mobile H5 Optimized: No scrolling up/down needed to inspect changes) */}
            <div className="sticky -top-5 sm:-top-7 z-20 bg-[#11141b]/95 backdrop-blur-md p-3 sm:p-3.5 -mx-5 sm:-mx-7 px-5 sm:px-7 border-b border-amber-500/30 space-y-2 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg sm:text-xl shrink-0">🏀</span>
                  <div className="min-w-0">
                    <strong className="text-white font-bold text-xs truncate block">{name} ({birthplace})</strong>
                    <span className="text-[10px] text-slate-400 block font-mono truncate">
                      {position} · {heightCm}cm / {weightKg}kg · {activeArch.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAllAttrsModal(true)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-[10px] font-bold text-amber-300 flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <Eye className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>查看18项属性</span>
                  </button>

                  <div className="bg-amber-500 text-black px-2.5 py-0.5 rounded-lg font-black text-center shadow">
                    <span className="text-[7px] sm:text-[8px] block uppercase font-bold leading-none">综合 OVR</span>
                    <span className="text-sm sm:text-base italic font-mono leading-4">{initialOvr}</span>
                  </div>
                </div>
              </div>

              {/* Mobile Live Key Attributes Quick Strip */}
              <div className="bg-[#0d1017] p-1.5 sm:p-2 rounded-xl border border-[#232834] flex items-center justify-between gap-1 overflow-x-auto text-[11px] font-mono custom-scrollbar">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase shrink-0 mr-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" /> 核心属性:
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {keyAttrsList.map((item) => (
                    <div key={item.key} className="flex items-center gap-1 bg-[#11141b] px-2 py-0.5 rounded-lg border border-[#232834]">
                      <span className="text-[9px] text-slate-300">{item.label}</span>
                      <span className="font-black text-amber-400 text-xs">{item.val}</span>
                      <span className="text-[8px] text-slate-500">/{item.cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 1: Position */}
            <div className="bg-[#0d1017] p-3.5 rounded-xl border border-[#232834] space-y-2.5">
              <h3 className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" /> 1. 场上位置 (POSITION)
              </h3>

              {/* Mobile Quick Pills for 1-Tap Switching */}
              <div className="grid grid-cols-5 gap-1.5">
                {(['PG', 'SG', 'SF', 'PF', 'C'] as Position[]).map((pos) => {
                  const isSelected = position === pos;
                  const posLabels: Record<Position, string> = {
                    PG: '控卫', SG: '分卫', SF: '小前', PF: '大前', C: '中锋'
                  };
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => handlePositionChange(pos)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-black border-amber-400 font-black shadow-lg ring-1 ring-amber-400'
                          : 'bg-[#11141b] border-[#232834] text-slate-300 font-bold hover:border-slate-600'
                      }`}
                    >
                      <div className="text-xs italic">{pos}</div>
                      <div className="text-[9px] opacity-80">{posLabels[pos]}</div>
                    </button>
                  );
                })}
              </div>

              {/* Fallback hidden select to guarantee standard DOM select binding exists */}
              <select
                value={position}
                onChange={(e) => handlePositionChange(e.target.value as Position)}
                className="hidden"
              >
                <option value="PG">PG · 控球后卫</option>
                <option value="SG">SG · 得分后卫</option>
                <option value="SF">SF · 小前锋</option>
                <option value="PF">PF · 大前锋</option>
                <option value="C">C · 中锋</option>
              </select>
            </div>

            {/* Section 2: Height & Weight Selection */}
            <div className="bg-[#0d1017] p-3.5 rounded-xl border border-[#232834] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" /> 2. 身高体重定制
                </h3>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {heightCm}cm / {weightKg}kg
                </span>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2">
                {BODY_SHAPE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetSelect(p.id)}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      bodyShape === p.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-[#11141b] border-[#232834] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-white flex items-center gap-1">
                      <span>{p.icon}</span> {p.name}
                    </div>
                  </button>
                ))}
              </div>

              {/* Fine-Tuning Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#11141b] p-3 rounded-lg border border-[#232834]">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">身高 (Height)</span>
                    <span className="font-mono font-bold text-white">{heightCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min={175}
                    max={225}
                    value={heightCm}
                    onChange={(e) => {
                      setHeightCm(Number(e.target.value));
                      setBodyShape('balanced');
                    }}
                    className="w-full accent-amber-500 bg-slate-800 rounded h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">体重 (Weight)</span>
                    <span className="font-mono font-bold text-white">{weightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min={65}
                    max={140}
                    value={weightKg}
                    onChange={(e) => {
                      setWeightKg(Number(e.target.value));
                      setBodyShape('balanced');
                    }}
                    className="w-full accent-amber-500 bg-slate-800 rounded h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>65kg (轻盈)</span>
                    <span>140kg (巨无霸)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Position-Specific Archetypes */}
            <div className="bg-[#0d1017] p-3.5 rounded-xl border border-[#232834] space-y-2.5">
              <h3 className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> 3. 【{position}】专属模板风格
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {currentArchetypes.map((arch) => (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setSelectedArchId(arch.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                      selectedArchId === arch.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-[#11141b] border-[#232834] text-slate-400 hover:bg-[#181d29]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-white uppercase italic flex items-center gap-1">
                        <span>{arch.icon}</span> {arch.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{arch.desc}</p>
                    <div className="mt-2 pt-1.5 border-t border-slate-800 text-[9px] text-amber-400/90 font-mono">
                      优势: {arch.highlights}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 4: Favorite NBA Draft Team Selection (SIMPLIFIED INTO POPUP MODAL) */}
            <div className="bg-[#0d1017] p-3.5 rounded-xl border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 4. 选择心仪选秀球队
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    选秀大会上该球队将动用专属签位指名选中你！
                  </p>
                </div>
              </div>

              {/* Compact Selected Team Card + Trigger Button */}
              <div className="bg-[#11141b] p-3 rounded-xl border border-[#232834] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <TeamLogo
                    logo={selectedTeamObj.logo}
                    abbrev={selectedTeamObj.abbrev}
                    primaryColor={selectedTeamObj.primaryColor}
                    secondaryColor={selectedTeamObj.secondaryColor}
                    className="w-9 h-9 object-contain shrink-0"
                    alt={selectedTeamObj.name}
                  />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                      <span>{selectedTeamObj.name}</span>
                      <span className="text-[9px] sm:text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                        {selectedTeamObj.abbrev}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {selectedTeamObj.conference === 'East' ? '东部联盟' : '西部联盟'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTeamModal(true)}
                  className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  <span>选择球队</span>
                </button>
              </div>
            </div>

            {/* Section 5: 18 Attributes & Caps Grid */}
            <div className="bg-[#0d1017] p-3.5 rounded-xl border border-[#232834]">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-black italic uppercase text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> 18项基础属性与个人上限
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {attrLabels.map(({ key, label, icon }) => {
                  const val = attributes[key];
                  const cap = attributeCaps[key];
                  return (
                    <div
                      key={key}
                      className="bg-[#11141b] p-2 rounded-lg border border-[#232834] flex items-center justify-between"
                    >
                      <span className="text-xs text-slate-300 flex items-center gap-1 font-medium">
                        <span>{icon}</span> {label}
                      </span>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-amber-400">{val}</span>
                        <span className="text-[10px] text-slate-500 ml-1">/ {cap}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-xs uppercase tracking-tight shadow-xl transition-all cursor-pointer"
            >
              进入2008年选秀大会
            </button>
          </form>
        )}

        {/* TEAM SELECTION POPUP MODAL */}
        {showTeamModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="bg-[#11141b] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative my-auto max-h-[88vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#232834] pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
                  <h3 className="text-base sm:text-lg font-black text-white italic">
                    选择心仪选秀球队 (30支球队)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="p-1.5 rounded-lg bg-[#0d1017] text-slate-400 hover:text-white border border-[#232834] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1 bg-[#0d1017] p-1 rounded-xl border border-[#232834]">
                  {(['ALL', 'East', 'West'] as const).map((conf) => (
                    <button
                      key={conf}
                      type="button"
                      onClick={() => setTeamConfFilter(conf)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        teamConfFilter === conf
                          ? 'bg-amber-500 text-black font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {conf === 'ALL' ? '全部 (30)' : conf === 'East' ? '东部 (15)' : '西部 (15)'}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    placeholder="搜索球队名称 / 简称..."
                    className="w-full bg-[#0d1017] border border-[#232834] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Teams Grid */}
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 custom-scrollbar min-h-[260px] max-h-[50vh]">
                {filteredTeams.map((t) => {
                  const isSelected = t.id === favoriteTeamId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setFavoriteTeamId(t.id);
                        setShowTeamModal(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 relative overflow-hidden cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg ring-1 ring-amber-400'
                          : 'bg-[#0d1017] border-[#232834] text-slate-300 hover:border-amber-500/50 hover:bg-[#181d29]'
                      }`}
                    >
                      <TeamLogo
                        logo={t.logo}
                        abbrev={t.abbrev}
                        primaryColor={t.primaryColor}
                        secondaryColor={t.secondaryColor}
                        className="w-8 h-8 object-contain shrink-0"
                        alt={t.name}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate leading-tight flex items-center justify-between">
                          <span>{t.name}</span>
                          {isSelected && <span className="text-[9px] text-amber-400 font-bold">✓ 已选</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                          {t.abbrev} · {t.conference === 'East' ? '东部' : '西部'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#232834] text-right">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-5 py-2 bg-amber-500 text-black font-black text-xs rounded-xl hover:bg-amber-400 cursor-pointer"
                >
                  确定选择
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 18 ATTRIBUTES FULL PREVIEW POPUP MODAL */}
        {showAllAttrsModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="bg-[#11141b] border border-amber-500/40 rounded-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl relative my-auto max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-[#232834] pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="text-base font-black text-white italic">
                    18项详细属性与上限概览 ({initialOvr} OVR)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllAttrsModal(false)}
                  className="p-1.5 rounded-lg bg-[#0d1017] text-slate-400 hover:text-white border border-[#232834] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2 custom-scrollbar max-h-[60vh]">
                {attrLabels.map(({ key, label, icon }) => {
                  const val = attributes[key];
                  const cap = attributeCaps[key];
                  return (
                    <div
                      key={key}
                      className="bg-[#0d1017] p-2.5 rounded-xl border border-[#232834] flex items-center justify-between"
                    >
                      <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                        <span>{icon}</span> {label}
                      </span>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-amber-400">{val}</span>
                        <span className="text-[10px] text-slate-500 ml-1">/ {cap}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#232834]">
                <button
                  type="button"
                  onClick={() => setShowAllAttrsModal(false)}
                  className="w-full py-2.5 bg-amber-500 text-black font-black text-xs rounded-xl hover:bg-amber-400 cursor-pointer"
                >
                  返回定制
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WeChat Pay Modal */}
        {showWeChatModal && (
          <WeChatPayModal
            onClose={() => setShowWeChatModal(false)}
          />
        )}
      </div>
    </div>
  );
};
