import { createHash } from 'node:crypto';

type SidProvider = () => string;

export type ApkakomonConfig = {
  enabled?: boolean;
  times?: string[];
  fields?: string[];
  categories?: number[];
  moshi?: string;
  moshiCnt?: number;
  options?: string[];
  addition?: number;
  mode?: number;
  qno?: number;
  startTime?: string;
};

const DEFAULT_TIMES = [
  '07_aki', '07_haru', '06_aki', '06_haru', '05_aki', '05_haru', '04_aki', '04_haru',
  '03_aki', '03_haru', '02_aki', '01_aki', '31_haru', '30_aki', '30_haru', '29_aki',
  '29_haru', '28_aki', '28_haru', '27_aki', '27_haru', '26_aki', '26_haru', '25_aki',
  '25_haru', '24_aki', '24_haru', '23_aki', '23_toku', '22_aki', '22_haru', '21_aki',
  '21_haru', '20_aki'
];

const DEFAULT_FIELDS = ['te_all', 'ma_all', 'st_all'];
const DEFAULT_CATEGORIES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
];
const DEFAULT_OPTIONS = ['random', 'showComment'];

function defaultSidProvider(): string {
  return createHash('sha256').update(Date.now().toString()).digest('hex');
}

export function buildApkakomonBody(
  config: ApkakomonConfig = {},
  sidProvider: SidProvider = defaultSidProvider
): string {
  const params = new URLSearchParams();
  const times = config.times ?? DEFAULT_TIMES;
  const fields = config.fields ?? DEFAULT_FIELDS;
  const categories = config.categories ?? DEFAULT_CATEGORIES;
  const options = config.options ?? DEFAULT_OPTIONS;

  times.forEach((time) => params.append('times[]', time));
  fields.forEach((field) => params.append('fields[]', field));
  categories.forEach((category) => params.append('categories[]', category.toString()));
  options.forEach((option) => params.append('options[]', option));

  params.append('moshi', config.moshi ?? 'mix_all');
  params.append('moshi_cnt', (config.moshiCnt ?? 40).toString());
  params.append('addition', (config.addition ?? 0).toString());
  params.append('mode', (config.mode ?? 1).toString());
  params.append('qno', (config.qno ?? 0).toString());
  params.append('sid', sidProvider());
  params.append('_q', '');
  params.append('_r', '');
  params.append('_c', '');
  params.append('result', '-1');
  params.append('startTime', config.startTime ?? '');

  return params.toString();
}

export function buildApkakomonRequest(
  config: ApkakomonConfig = {},
  sidProvider: SidProvider = defaultSidProvider
) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: buildApkakomonBody(config, sidProvider)
  };
}