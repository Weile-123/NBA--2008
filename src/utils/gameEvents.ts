export const STOP_AUTO_SIM_EVENT = 'nba-career:stop-auto-sim';

/** Stop background season simulation before handling a navigation gesture. */
export function requestAutoSimStop(): void {
  window.dispatchEvent(new Event(STOP_AUTO_SIM_EVENT));
}
