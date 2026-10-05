import { useEffect, useState } from 'react';
import { useCare } from './useCare';
import { unreadCount } from './logic';

// Unread chat messages for the tab badge. "Seen" is the newest message's timestamp the last time the
// chat was open, per patient and user, kept on this device.
// ponytail: device-local, not read receipts (messages.read_at would need an update policy); a second
// device starts with everything unread.
export function useUnread(): number {
  const { patientId, me, screen, messages } = useCare();
  const key = `lazo.seen.${patientId}.${me.id}`;
  const [seen, setSeen] = useState(() => read(key));
  const open = screen === 'mensajes';
  const latest = messages.at(-1)?.createdAt ?? '';

  useEffect(() => {
    if (open && latest > seen) {
      setSeen(latest);
      // Re-read: another tab may already have stored a newer visit.
      if (latest > read(key)) try { localStorage.setItem(key, latest); } catch { /* private mode: the badge just resets */ }
    }
  }, [open, latest, seen, key]);

  return open ? 0 : unreadCount(messages, seen);
}

function read(key: string) {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}
