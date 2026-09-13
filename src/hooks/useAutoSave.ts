import { useEffect,useLayoutEffect,useRef } from 'react';
import { createAutoSave } from '../utils/autoSave';
import { SavedData,saveGameToStorage } from '../utils/storage';
import { flushPersistentWrites } from '../lib/persistentStorage';

export function useAutoSave(snapshot: SavedData | null, onSaved: (time: string) => void, suspended = false) {
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const schedulerRef = useRef<ReturnType<typeof createAutoSave<SavedData>> | null>(null);
  if (!schedulerRef.current) {
    schedulerRef.current = createAutoSave<SavedData>((data) => {
      const updatedAt = new Date().toISOString();
      const success = saveGameToStorage({ ...data, updatedAt }, data.slotId);
      if (success) onSavedRef.current(updatedAt);
      return success;
    });
  }
  const scheduler = schedulerRef.current;
  const previousSlot = useRef(snapshot?.slotId);
  const latestSnapshotRef = useRef(snapshot);
  latestSnapshotRef.current = snapshot;

  // Commit the new snapshot before a pagehide/visibility event can flush it.
  useLayoutEffect(() => {
    if (previousSlot.current !== snapshot?.slotId && !suspended) scheduler.flush();
    previousSlot.current = snapshot?.slotId;
    if (suspended) scheduler.cancel();
    else if (snapshot?.player) scheduler.schedule(snapshot);
    else scheduler.cancel();
  }, [snapshot, scheduler, suspended]);

  useEffect(() => {
    const flush = () => {
      const latest = latestSnapshotRef.current;
      if (latest?.player) scheduler.schedule(latest);
      scheduler.flush();
      void flushPersistentWrites();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      scheduler.flush();
    };
  }, [scheduler]);

  return scheduler;
}
