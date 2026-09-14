import { useEffect, useState, type RefObject } from 'react';

interface MobilePersistentScrollbarProps {
  scrollRef: RefObject<HTMLElement | null>;
  tone?: 'amber' | 'cyan';
}

export function MobilePersistentScrollbar({ scrollRef, tone = 'amber' }: MobilePersistentScrollbarProps) {
  const [thumb, setThumb] = useState({ visible: false, top: 0, height: 44 });

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { clientHeight, scrollHeight, scrollTop } = element;
        if (clientHeight <= 0 || scrollHeight <= clientHeight + 1) {
          setThumb({ visible: false, top: 0, height: Math.max(44, clientHeight) });
          return;
        }
        const height = Math.max(44, Math.round((clientHeight / scrollHeight) * clientHeight));
        const top = Math.round((scrollTop / Math.max(1, scrollHeight - clientHeight)) * (clientHeight - height));
        setThumb({ visible: true, top, height });
      });
    };

    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
    const mutationObserver = typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver(sync);
    element.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    resizeObserver?.observe(element);
    mutationObserver?.observe(element, { childList: true, subtree: true, characterData: true });
    sync();

    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [scrollRef]);

  if (!thumb.visible) return null;
  const thumbClass = tone === 'cyan'
    ? 'bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.75)]'
    : 'bg-amber-500 shadow-[0_0_7px_rgba(245,158,11,0.75)]';

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-30 w-2 rounded-full border border-slate-700 bg-[#090c12] sm:hidden">
      <div
        className={`absolute left-0.5 right-0.5 rounded-full ${thumbClass}`}
        style={{ top: thumb.top, height: thumb.height }}
      />
    </div>
  );
}
