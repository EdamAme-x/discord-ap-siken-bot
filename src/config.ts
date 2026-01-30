import fs from 'node:fs/promises';
import type { PollData } from 'discord.js';
import type { ApkakomonConfig } from './apkakomon.js';
import type { RequestOptions } from './scraper.js';

type Config = {
  token: string;
  channelId: string;
  targetUrl: string;
  proxy?: string | null;
  questionSelector?: string;
  choiceSelector?: string;
  choiceLabelSelector?: string;
  choiceTextSelector?: string;
  baseUrl?: string;
  cron?: string;
  timezone?: string;
  pollDurationHours?: number;
  pollAllowMultiselect?: boolean;
  pollLayoutType?: PollData['layoutType'];
  request?: RequestOptions;
  apkakomon?: ApkakomonConfig;
};

const REQUIRED_FIELDS: Array<keyof Config> = [
  'token',
  'channelId',
  'targetUrl'
];

export async function loadConfig(path = 'config.json'): Promise<Required<Config>> {
  const raw = await fs.readFile(path, 'utf8');
  const config = JSON.parse(raw) as Config;

  const missing = REQUIRED_FIELDS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing config fields: ${missing.join(', ')}`);
  }

  return {
    cron: '0 5 * * *',
    timezone: 'Asia/Tokyo',
    questionSelector: 'h3.qno + div',
    choiceSelector: 'ul.selectList li',
    choiceLabelSelector: 'button.selectBtn',
    choiceTextSelector: 'span',
    pollDurationHours: 24,
    pollAllowMultiselect: false,
    request: {},
    apkakomon: { enabled: true },
    ...config
  } as Required<Config>;
}