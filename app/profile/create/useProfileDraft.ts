'use client';

import { useEffect, useState } from 'react';
import { draftKey, EMPTY_PROFILE, parseProfileDraft, type ProfileFields } from '@/app/profile/create/profileDraft';

export default function useProfileDraft(userId: number | null) {
  const [owner, setOwner] = useState<number | null>(null);
  const [fields, setFields] = useState<ProfileFields>({ ...EMPTY_PROFILE });
  const [started, setStarted] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const ready = userId !== null && owner === userId;

  useEffect(() => {
    if (userId === null) { setOwner(null); return; }
    let draft = parseProfileDraft(null);
    try {
      draft = parseProfileDraft(localStorage.getItem(draftKey(userId)));
      setCanSave(true);
    } catch { setCanSave(false); }
    setFields(draft.fields);
    setStarted(draft.started);
    setOwner(userId);
  }, [userId]);

  useEffect(() => {
    if (!ready || !started) return;
    try {
      localStorage.setItem(draftKey(userId!), JSON.stringify({ version: 1, started: true, fields, updatedAt: Date.now() }));
      setCanSave(true);
    } catch { setCanSave(false); }
  }, [fields, ready, started, userId]);

  function update<K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function finish() {
    if (userId !== null) {
      try { localStorage.removeItem(draftKey(userId)); } catch { /* Storage may be unavailable. */ }
    }
    setStarted(false);
    setFields({ ...EMPTY_PROFILE });
  }

  return {
    ready, fields, started, canSave, update, finish,
    begin: () => setStarted(true),
    clearFields: () => setFields({ ...EMPTY_PROFILE }),
  };
}
