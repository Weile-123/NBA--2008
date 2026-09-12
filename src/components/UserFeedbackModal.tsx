import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquareText, Send, X } from 'lucide-react';
import { feedbackContentLength, submitUserFeedback } from '../lib/userFeedback';

interface UserFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserFeedbackModal: React.FC<UserFeedbackModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentLength = feedbackContentLength(content);
  const canSubmit = contentLength >= 1 && contentLength <= 2000 && !isSubmitting;

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => textareaRef.current?.focus(), 50);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setMessage('');
    setIsSuccess(false);
    try {
      await submitUserFeedback(content);
      setContent('');
      setIsSuccess(true);
      setMessage('反馈已提交，感谢你帮助我们改进游戏！');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '反馈提交失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/35 bg-[#111620] text-left shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between border-b border-[#283044] bg-gradient-to-r from-amber-500/10 to-transparent px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
              <MessageSquareText className="h-5 w-5 text-amber-400" />
            </span>
            <div>
              <h2 id="feedback-title" className="text-base font-black italic text-white">用户反馈</h2>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400">Locker Room Feedback</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="关闭反馈窗口"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-xs leading-relaxed text-slate-400">
            遇到问题，或者对玩法有新想法？告诉我们你的建议，每一条反馈都会帮助《篮坛传奇》继续进步。
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="feedback-content" className="text-xs font-bold text-slate-200">反馈内容</label>
              <span className={`font-mono text-[10px] ${contentLength > 2000 ? 'text-red-400' : 'text-slate-500'}`}>
                {contentLength}/2000
              </span>
            </div>
            <textarea
              ref={textareaRef}
              id="feedback-content"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                if (message) {
                  setMessage('');
                  setIsSuccess(false);
                }
              }}
              disabled={isSubmitting}
              rows={7}
              maxLength={4000}
              placeholder="请描述遇到的问题、操作过程或你希望加入的新玩法……"
              className="w-full resize-none select-text rounded-xl border border-[#2b3449] bg-[#0a0e16] px-3.5 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10 disabled:opacity-60"
            />
          </div>

          <div aria-live="polite" className={`min-h-5 text-xs ${isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
            {message}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl bg-[#202838] px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-[#2b364c] disabled:opacity-40"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex min-w-28 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-black shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSubmitting ? '提交中' : '提交反馈'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
