import React, { useState } from 'react';
import { PlayerProfile, Team } from '../types';
import { Building, ShieldCheck, DollarSign, Award, ArrowRight, FileText, Shirt, Check, X } from 'lucide-react';
import { TeamLogo } from './TeamLogo';
import { getUnavailableJerseyNumbers } from '../utils/jerseyHelper';

interface ContractSigningModalProps {
  player: PlayerProfile;
  team: Team;
  pick: number;
  onSignContract: (jerseyNum?: number) => void;
}

export const ContractSigningModal: React.FC<ContractSigningModalProps> = ({
  player,
  team,
  pick,
  onSignContract,
}) => {
  const [selectedJersey, setSelectedJersey] = useState<number | null>(null);
  const [isJerseyModalOpen, setIsJerseyModalOpen] = useState<boolean>(false);
  const [tempJerseyChoice, setTempJerseyChoice] = useState<number | null>(null);

  const { isUnavailable, getReason } = getUnavailableJerseyNumbers(team);

  // Salary scale based on draft pick
  let salaryPerYear = 3800000;
  if (pick === 1) salaryPerYear = 4800000;
  else if (pick <= 3) salaryPerYear = 4200000;
  else if (pick <= 5) salaryPerYear = 3600000;
  else if (pick <= 14) salaryPerYear = 2600000;
  else salaryPerYear = 1600000;

  const totalValue = salaryPerYear * 4;

  const handleOpenJerseyModal = () => {
    setTempJerseyChoice(selectedJersey);
    setIsJerseyModalOpen(true);
  };

  const handleConfirmJerseyChoice = () => {
    if (tempJerseyChoice !== null && !isUnavailable(tempJerseyChoice)) {
      setSelectedJersey(tempJerseyChoice);
      setIsJerseyModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#11141b] border-2 border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-scaleUp">
        {/* Header / Team Badge */}
        <div className="flex items-center gap-4 border-b border-[#232834] pb-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl text-white shadow-xl border p-2 shrink-0 bg-[#0d1017]"
            style={{ borderColor: team.secondaryColor || '#f59e0b' }}
          >
            <TeamLogo
              logo={team.logo}
              abbrev={team.abbrev}
              primaryColor={team.primaryColor}
              secondaryColor={team.secondaryColor}
              className="w-12 h-12 object-contain"
              alt={team.name}
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
              <FileText className="w-3.5 h-3.5 text-amber-400" /> 2008 NBA 新秀保障合同
            </div>
            <h2 className="text-xl font-black italic uppercase text-white mt-1">
              {team.name} 签约仪式
            </h2>
            <p className="text-xs text-slate-400">
              {pick <= 30 ? `首轮第 ${pick} 顺位` : `次轮第 ${pick - 30} 顺位`}指名 · {player.name}
            </p>
          </div>
        </div>

        {/* Contract Offer Card */}
        <div className="bg-[#0d1017] p-4 rounded-xl border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-[#232834] pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                合同保障年限
              </span>
              <span className="text-xs font-black text-white">
                2年保障 + 2年球队选项
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                年薪
              </span>
              <span className="text-xs font-black font-mono text-amber-400">
                ${(salaryPerYear / 1000000).toFixed(2)}M / 年
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-[#11141b] p-2.5 rounded border border-[#232834]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">合同总金额 (4年)</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                ${(totalValue / 1000000).toFixed(2)}M
              </span>
            </div>
            <div className="bg-[#11141b] p-2.5 rounded border border-[#232834]">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">发薪时间</span>
              <span className="text-sm font-black text-slate-200">
                常规赛82场结束后全额发放
              </span>
            </div>
          </div>
        </div>

        {/* Jersey Number Selection Trigger Button */}
        <div className="bg-[#0d1017] p-4 rounded-xl border border-[#232834] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-amber-400" /> 战袍背号选择
            </span>
            {selectedJersey !== null && (
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/40">
                #{selectedJersey} 号
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenJerseyModal}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-between border transition-all cursor-pointer ${
              selectedJersey !== null
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 hover:bg-amber-500/20'
                : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500 text-amber-300 hover:brightness-110 animate-pulse'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Shirt className="w-4 h-4 text-amber-400" />
              <span>
                {selectedJersey !== null
                  ? `已选择背号: #${selectedJersey} 号`
                  : '点击选择战袍背号 (0-99)'}
              </span>
            </div>
            <span className="text-[11px] font-mono underline opacity-80">
              {selectedJersey !== null ? '更换背号' : '选择背号 →'}
            </span>
          </button>
        </div>

        {/* Obligations / Terms */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-300 uppercase block text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> 球队对新秀的基本期望与条款:
          </span>
          <ul className="space-y-1.5 text-slate-400 bg-[#0d1017] p-3 rounded-xl border border-[#232834]">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>通过每场出色表现积累 XP 经验值，不断提升核心属性与评分。</span>
            </li>
          </ul>
        </div>

        {/* Sign Button - ONLY shown after jersey number is chosen */}
        {selectedJersey !== null ? (
          <button
            onClick={() => onSignContract(selectedJersey)}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black italic rounded-xl text-sm uppercase tracking-tight shadow-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>开启常规赛</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
            <p className="text-xs font-bold text-amber-300">
              ⚠️ 请先点击上方按钮选择战袍背号，选择完成后方可进行签约
            </p>
          </div>
        )}
      </div>

      {/* JERSEY SELECTION POPUP MODAL */}
      {isJerseyModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-[#11151e] border-2 border-amber-500/60 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 my-auto relative animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#232834] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-black">
                  <Shirt className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black italic text-white uppercase">
                    选择【{team.name}】战袍背号 (0-99)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    现役队友使用中及球队退役背号已自动置灰锁定
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsJerseyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Jersey Preview Bar */}
            <div className="bg-[#0d1017] p-2.5 rounded-xl border border-[#232834] flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">当前选中:</span>
              {tempJerseyChoice !== null ? (
                <span className="font-mono font-black text-amber-300 text-sm bg-amber-500/20 px-3 py-0.5 rounded border border-amber-500/40">
                  #{tempJerseyChoice} 号
                </span>
              ) : (
                <span className="text-slate-500 italic">尚未选择背号</span>
              )}
            </div>

            {/* Jersey Grid 0 - 99 */}
            <div className="max-h-64 overflow-y-auto p-2 bg-[#090b10] rounded-xl border border-[#232834] grid grid-cols-5 sm:grid-cols-10 gap-1.5 custom-scrollbar">
              {Array.from({ length: 100 }, (_, i) => i).map((n) => {
                const disabled = isUnavailable(n);
                const reason = getReason(n);
                const isSelected = tempJerseyChoice === n;

                if (disabled) {
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled
                      title={reason || '背号不可用'}
                      className="h-9 rounded-lg font-mono text-xs font-bold bg-[#0d1017] text-slate-600 border border-slate-800/60 line-through opacity-40 cursor-not-allowed flex items-center justify-center"
                    >
                      {n}
                    </button>
                  );
                }

                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTempJerseyChoice(n)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-amber-500 text-black border-2 border-amber-300 shadow-lg ring-2 ring-amber-400/50 scale-105 z-10'
                        : 'bg-[#161c28] text-slate-200 border border-[#232a3c] hover:border-amber-500/50 hover:text-amber-300 hover:bg-amber-500/10'
                    }`}
                  >
                    #{n}
                  </button>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232834]">
              <button
                type="button"
                onClick={() => setIsJerseyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={tempJerseyChoice === null || isUnavailable(tempJerseyChoice)}
                onClick={handleConfirmJerseyChoice}
                className={`px-5 py-2 rounded-xl text-xs font-black italic uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  tempJerseyChoice !== null && !isUnavailable(tempJerseyChoice)
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>确认背号 (#{tempJerseyChoice ?? '--'})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
