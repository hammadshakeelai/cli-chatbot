export function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = '';

  return (async function* () {
    try {
      while (true) {
        if (signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            yield data;
          }
        }
      }
      // Flush remaining buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data !== '[DONE]') yield data;
      }
    } finally {
      reader.cancel().catch(() => {});
    }
  })();
}
