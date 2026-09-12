/** Defer the app scroll-container write until the browser's next paint frame. */
export function scheduleRootScrollToTop(): number {
  return window.requestAnimationFrame(() => {
    document.getElementById('root')?.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  });
}
