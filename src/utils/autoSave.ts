/** Coalesce rapid changes without serializing snapshots until a save is due. */
export function createAutoSave<T>(
  write: (snapshot: T) => boolean,
  delayMs = 800,
  maxWaitMs = 5000,
) {
  let pending: T | undefined;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let deadlineTimer: ReturnType<typeof setTimeout> | undefined;

  const clearTimers = () => {
    clearTimeout(debounceTimer);
    clearTimeout(deadlineTimer);
    debounceTimer = deadlineTimer = undefined;
  };
  const flush = () => {
    clearTimers();
    if (pending === undefined) return true;
    const snapshot = pending;
    pending = undefined;
    const success = write(snapshot);
    if (!success) pending = snapshot;
    return success;
  };
  return {
    schedule(snapshot: T) {
      pending = snapshot;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flush, delayMs);
      deadlineTimer ??= setTimeout(flush, maxWaitMs);
    },
    flush,
    cancel() {
      clearTimers();
      pending = undefined;
    },
  };
}
