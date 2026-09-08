import React, { useState, useRef } from 'react';
import { X, Save, FolderOpen, Download, Upload, Trash2, CheckCircle2, UserCheck, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { SaveSlotId, SaveSlotMeta, getAllSaveSlotsMeta, loadGameFromStorage, saveGameToStorage, exportSaveToFile, importSaveFromJson, clearSlotStorage, SavedData } from '../utils/storage';

interface SaveSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSaveData: SavedData | null;
  currentSlotId?: SaveSlotId;
  onLoadSaveData: (data: SavedData, slotId?: SaveSlotId) => void;
  onCurrentSlotDeleted?: () => void;
  onShowToast: (msg: string) => void;
}

export const SaveSlotsModal: React.FC<SaveSlotsModalProps> = ({
  isOpen,
  onClose,
  currentSaveData,
  currentSlotId = 'slot_1',
  onLoadSaveData,
  onCurrentSlotDeleted,
  onShowToast,
}) => {
  const [slots, setSlots] = useState<SaveSlotMeta[]>(() => getAllSaveSlotsMeta());
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<SaveSlotId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const refreshSlots = () => {
    setSlots(getAllSaveSlotsMeta());
  };

  const handleLoadSlot = (slotId: SaveSlotId) => {
    const data = loadGameFromStorage(slotId);
    if (data && data.player) {
      onLoadSaveData(data, slotId);
      // No floating toast on load as requested
      onClose();
    } else {
      onShowToast('❌ 读取失败：该槽位为空或文件损坏');
    }
  };

  const handleExportSlot = (slotId: SaveSlotId) => {
    const data = loadGameFromStorage(slotId);
    if (data && data.player) {
      exportSaveToFile(data);
      onShowToast(`📥 已导出 [${data.player.name}] 存档 JSON 文件`);
    } else {
      onShowToast('⚠️ 该槽位没有可以导出的存档');
    }
  };

  const handleDeleteSlot = (slotId: SaveSlotId) => {
    const isDeletingCurrent = slotId === currentSlotId && !!currentSaveData?.player;
    clearSlotStorage(slotId);
    refreshSlots();
    setConfirmDeleteSlot(null);
    onShowToast('🗑️ 已清空该槽位存档');

    if (isDeletingCurrent && onCurrentSlotDeleted) {
      onCurrentSlotDeleted();
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const importedData = importSaveFromJson(content);
        if (importedData && importedData.player) {
          const slotToUse = importedData.slotId || 'slot_1';
          saveGameToStorage(importedData, slotToUse);
          refreshSlots();
          onLoadSaveData(importedData, slotToUse);
          // No toast on load
          onClose();
        } else {
          onShowToast('❌ 导入失败：JSON 文件格式不兼容或数据缺失');
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      {/* File Input Hidden */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      <div className="relative w-full max-w-3xl bg-[#121620] border border-[#232a3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#171d2b] to-[#121620] border-b border-[#232a3d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-black text-white italic tracking-wide uppercase">
              读取生涯存档 & 槽位管理 <span className="text-xs font-normal text-amber-400 font-mono">LOAD SAVES</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2738] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Quick Import / Backup Action Bar */}
          <div className="p-3.5 rounded-xl bg-[#181e2e] border border-[#232a3d] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">⚡ 防 SL 实时自动归档模式：</span>
              您可以随时读取其它槽位的历史存档，或备份/导出 JSON 存档文件。
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>导入 JSON 存档文件</span>
              </button>
              {currentSaveData && currentSaveData.player && (
                <button
                  onClick={() => exportSaveToFile(currentSaveData)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>备份导出 JSON 存档</span>
                </button>
              )}
            </div>
          </div>

          {/* Slots List */}
          <div className="space-y-3">
            {slots.map((slot) => {
              const isCurrentSlot = currentSlotId === slot.slotId;

              return (
                <div
                  key={slot.slotId}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrentSlot
                      ? 'bg-gradient-to-r from-[#1b2333] via-[#222c40] to-[#1b2333] border-amber-500/60 shadow-lg ring-1 ring-amber-500/30'
                      : slot.isEmpty
                      ? 'bg-[#151924]/60 border-[#232a3d]/80 opacity-80'
                      : 'bg-gradient-to-r from-[#171d2b] via-[#1c2334] to-[#171d2b] border-[#2d3750] shadow-md hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left Slot Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#222b3e] flex items-center justify-center shrink-0 border border-[#2d3750]">
                        <Save className="w-5 h-5 text-blue-400" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-white">
                            {slot.slotName}
                          </span>
                          {isCurrentSlot && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono font-bold">
                              当前正在游玩
                            </span>
                          )}
                          {!slot.isEmpty && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                              已归档
                            </span>
                          )}
                          {slot.isEmpty && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-mono">
                              空槽位
                            </span>
                          )}
                        </div>

                        {!slot.isEmpty ? (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-sm font-black text-amber-300 italic flex items-center gap-2 flex-wrap">
                              <span>{slot.playerName}</span>
                              <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                OVR {slot.playerOvr}
                              </span>
                              <span className="text-xs text-slate-300 font-normal">
                                · {slot.playerPosition} · {slot.currentTeamName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {slot.currentYear}-{slot.currentYear! + 1} 赛季 第{slot.currentWeek}周 · 自动归档: {slot.updatedAt}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 mt-1">
                            尚未在这个槽位进行过游戏
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Load Button (If slot not empty) */}
                      {!slot.isEmpty && (
                        <button
                          onClick={() => handleLoadSlot(slot.slotId)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow active:scale-95 cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>读取载入</span>
                        </button>
                      )}

                      {/* Export Button (If slot not empty) */}
                      {!slot.isEmpty && (
                        <button
                          onClick={() => handleExportSlot(slot.slotId)}
                          className="p-1.5 rounded-lg bg-[#222b3e] hover:bg-[#2c3750] text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="导出 JSON 文件"
                        >
                          <Download className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}

                      {/* Delete Button (If slot not empty) */}
                      {!slot.isEmpty && (
                        confirmDeleteSlot === slot.slotId ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteSlot(slot.slotId)}
                              className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold"
                            >
                              确认删除
                            </button>
                            <button
                              onClick={() => setConfirmDeleteSlot(null)}
                              className="px-2 py-1 rounded bg-slate-700 text-slate-300 text-[10px]"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteSlot(slot.slotId)}
                            className="p-1.5 rounded-lg bg-[#222b3e] hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="删除此槽位"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#171d2b] border-t border-[#232a3d] flex items-center justify-between text-xs text-slate-400">
          <div>提示：所有存档数据均加密储存在您的浏览器本地，不依赖任何第三方服务器。</div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#222b3e] hover:bg-[#2c3750] text-white font-bold transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
