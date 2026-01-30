type RetryOptions = {
  attempts: number;
  delayMs?: number;
};

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const attempts = Math.max(1, options.attempts);
  const delayMs = options.delayMs ?? 0;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts && delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}
