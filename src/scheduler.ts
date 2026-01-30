import { schedule, ScheduledTask } from 'node-cron';

type CronLike = {
  schedule: typeof schedule;
};

export function scheduleDaily(
  cron: CronLike,
  expression: string,
  timezone: string,
  job: () => void | Promise<void>
): ScheduledTask {
  return cron.schedule(expression, job, { timezone });
}