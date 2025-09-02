export async function trySSE(
    url: string,
    body: any,
    onDelta: (text: string) => void,
    onMeta?: (meta: any) => void,
  ): Promise<void> {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
    });
  
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('text/event-stream') || !res.body) {
      throw new Error(`SSE not available (status ${res.status}, ct=${ct})`);
    }
  
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
  
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
  
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
  
        const lines = event.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === '[DONE]') continue;
  
          if (data.startsWith('{')) {
            try {
              const obj = JSON.parse(data);
              if (obj && obj.meta && onMeta) {
                onMeta(obj.meta);
                continue;
              }
            } catch {
              // 非 JSON，继续当增量文本处理
            }
          }
          onDelta(data);
        }
      }
    }
  }
  