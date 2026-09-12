import canvasConfetti from 'canvas-confetti';

let workerConfetti: ReturnType<typeof canvasConfetti.create> | null = null;
let confettiCanvas: HTMLCanvasElement | null = null;
let resizeFrame: number | null = null;

function removeConfettiSurface(resetAnimation: boolean): void {
  if (resizeFrame !== null) {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
  }

  window.removeEventListener('resize', scheduleConfettiReset);
  document.removeEventListener('visibilitychange', handleVisibilityChange);

  const currentConfetti = workerConfetti;
  const currentCanvas = confettiCanvas;
  workerConfetti = null;
  confettiCanvas = null;

  if (resetAnimation) currentConfetti?.reset();
  currentCanvas?.remove();
}

function scheduleConfettiReset(): void {
  if (resizeFrame !== null) return;

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null;
    // A viewport change is rare and celebration-only. Ending the short effect
    // is cheaper and safer than resizing a transferred canvas while it paints.
    removeConfettiSurface(true);
  });
}

function handleVisibilityChange(): void {
  if (document.hidden) removeConfettiSurface(true);
}

function getConfetti(): ReturnType<typeof canvasConfetti.create> {
  if (workerConfetti) return workerConfetti;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(window.innerWidth));
  canvas.height = Math.max(1, Math.round(window.innerHeight));
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '100',
  });
  document.body.appendChild(canvas);

  confettiCanvas = canvas;
  workerConfetti = canvasConfetti.create(canvas, {
    // The library's resize path reads and writes layout synchronously. The
    // wrapper owns viewport changes and batches cancellation in one frame.
    resize: false,
    useWorker: true,
    disableForReducedMotion: true,
  });
  window.addEventListener('resize', scheduleConfettiReset, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return workerConfetti;
}

function shouldDisableConfetti(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return true;

  const device = navigator as Navigator & { deviceMemory?: number };
  return (device.deviceMemory !== undefined && device.deviceMemory <= 4)
    || (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4);
}

/**
 * Keep celebration effects off low-end devices and move them to a worker when
 * supported. This avoids repeated full-window canvas work on the UI thread.
 */
export function gameConfetti(options: canvasConfetti.Options = {}): Promise<undefined> | null {
  if (shouldDisableConfetti()) return null;
  const confetti = getConfetti();
  if (confettiCanvas) confettiCanvas.style.zIndex = String(options.zIndex ?? 100);

  const animation = confetti({
    ...options,
    particleCount: Math.min(options.particleCount ?? 50, 120),
  });

  if (animation) {
    void animation.then(() => {
      if (workerConfetti === confetti) removeConfettiSurface(false);
    });
  }

  return animation as Promise<undefined> | null;
}
