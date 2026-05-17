type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to checklist mutations (insert/delete/update elsewhere should call {@link notifyChecklistChanged}). */
export function subscribeChecklistChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Fire after Supabase checklist writes so tabs stay in sync without relying only on tab focus. */
export function notifyChecklistChanged(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* listener failures must not block others */
    }
  });
}
