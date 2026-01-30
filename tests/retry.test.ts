import { describe, expect, it, vi } from 'vitest';
import { retry } from '../src/retry.js';

describe('retry', () => {
  it('retries until the function succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('ok');

    const result = await retry(fn, { attempts: 3 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error after exhausting attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always-fail'));

    await expect(retry(fn, { attempts: 2 })).rejects.toThrow('always-fail');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
