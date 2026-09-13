import { Bell, CalendarClock, X } from 'lucide-react';
import React from 'react';
import { UPDATE_ANNOUNCEMENTS } from '../data/updateAnnouncements';

interface UpdateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateAnnouncementModal: React.FC<UpdateAnnouncementModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-announcement-title"
      onClick={onClose}
    >
      <section
        className="flex h-[min(82vh,720px)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-[#11151f] text-left shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[#273044] bg-gradient-to-r from-amber-950/70 to-[#151a26] px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15">
              <Bell className="h-4.5 w-4.5 text-amber-400" />
            </span>
            <div>
              <h2 id="update-announcement-title" className="text-base font-black text-white">游戏更新公告</h2>
              <p className="text-[11px] font-mono text-amber-400">UPDATE NOTES</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-amber-500/50 hover:text-white"
            aria-label="关闭更新公告"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {UPDATE_ANNOUNCEMENTS.map((announcement, index) => (
            <article key={announcement.id} className="rounded-xl border border-[#283148] bg-[#0c1018] p-3.5">
              <div className="mb-3 flex items-start justify-between gap-3 border-b border-[#242c3d] pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    {index === 0 && (
                      <span className="rounded border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black text-amber-300">最新</span>
                    )}
                    <h3 className="text-sm font-black text-amber-300 sm:text-base">{announcement.title}</h3>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-slate-500">
                    <CalendarClock className="h-3 w-3" />
                    {announcement.publishedAt}
                  </div>
                </div>
              </div>
              <div className="space-y-2 rounded-lg border border-amber-500/15 bg-amber-500/[0.04] p-3">
                {announcement.introduction.map((paragraph) => (
                  <p key={paragraph} className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                {announcement.versions.map((version) => (
                  <section key={version.version} className="border-t border-[#242c3d] pt-3 first:border-t-0 first:pt-0">
                    <div className="mb-2 inline-flex rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-1 font-mono text-xs font-black uppercase text-amber-300">
                      {version.version}
                    </div>
                    <div className="space-y-3">
                      {version.sections.map((section, sectionIndex) => (
                        <div key={section.title}>
                          <h4 className="mb-1.5 text-xs font-black text-white sm:text-sm">
                            {sectionIndex + 1}. {section.title}
                          </h4>
                          <ul className="space-y-1.5">
                            {section.items.map((item) => (
                              <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                                <span className="shrink-0 text-slate-400">-</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>

        <footer className="shrink-0 border-t border-[#273044] bg-[#0d111a] p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-black text-black transition-colors hover:bg-amber-400"
          >
            我知道了
          </button>
        </footer>
      </section>
    </div>
  );
};
