'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { conversationTurn, type ConversationTurn } from './turns';

/** Check before enabling a newly opened saved conversation. Reads never generate. */
export function useTurnDiscovery(owner: number | undefined, cid: string | null, kind: 'bazi' | 'liuyao') {
  const valid = !!owner && !!cid && /^((bazi_conv_|liuyao_conv_|conv_)?)[1-9]\d*$/.test(cid);
  const identity = valid ? `${owner}:${cid}` : null;
  const [checked, setChecked] = useState<string | null>(null);
  const [remote, setRemote] = useState<ConversationTurn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    if (!identity || !cid) return null;
    const version = ++sequence.current;
    setChecked(null);
    try {
      const result = await conversationTurn(cid, kind);
      if (version !== sequence.current) return null;
      setRemote(result); setError(null); setChecked(identity);
      return result;
    } catch (failure) {
      if (version === sequence.current) {
        setError(failure instanceof Error ? failure.message : '暂时无法检查会话请求，请重新加载后继续。');
        setChecked(identity);
      }
      throw failure;
    }
  }, [identity, cid, kind]);
  useEffect(() => {
    setRemote(null); setError(null); setChecked(null);
    void refresh().catch(() => {});
    return () => { sequence.current += 1; };
  }, [refresh]);
  return { remote, error, checking: !!identity && checked !== identity, refresh, clear: () => setRemote(null) };
}
