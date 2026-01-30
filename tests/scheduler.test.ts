import { describe, expect, it, vi } from 'vitest';
import { scheduleDaily } from '../src/scheduler.js';

describe('scheduleDaily', () => {
  it('registers a cron job with timezone', () => {
    const schedule = vi.fn();
    const cron = { schedule };
    const job = vi.fn();

    scheduleDaily(cron, '0 5 * * *', 'Asia/Tokyo', job);

    expect(schedule).toHaveBeenCalledWith('0 5 * * *', job, { timezone: 'Asia/Tokyo' });
  });
});