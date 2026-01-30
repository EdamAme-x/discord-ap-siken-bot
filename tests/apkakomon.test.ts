import { describe, expect, it } from 'vitest';
import { buildApkakomonBody, buildApkakomonRequest } from '../src/apkakomon.js';

describe('buildApkakomonBody', () => {
  it('builds form data with defaults and sid', () => {
    const body = buildApkakomonBody({}, () => 'test-sid');
    const params = new URLSearchParams(body);

    expect(params.get('sid')).toBe('test-sid');
    expect(params.getAll('times[]').length).toBeGreaterThan(0);
    expect(params.getAll('fields[]')).toEqual(['te_all', 'ma_all', 'st_all']);
    expect(params.getAll('categories[]').length).toBeGreaterThan(0);
    expect(params.get('moshi')).toBe('mix_all');
  });

  it('allows overrides', () => {
    const body = buildApkakomonBody(
      {
        times: ['x'],
        fields: ['f'],
        categories: [99],
        options: ['random'],
        moshi: 'custom',
        moshiCnt: 1,
        addition: 2,
        mode: 3,
        qno: 4
      },
      () => 'sid'
    );
    const params = new URLSearchParams(body);

    expect(params.getAll('times[]')).toEqual(['x']);
    expect(params.getAll('fields[]')).toEqual(['f']);
    expect(params.getAll('categories[]')).toEqual(['99']);
    expect(params.get('moshi')).toBe('custom');
    expect(params.get('moshi_cnt')).toBe('1');
    expect(params.get('addition')).toBe('2');
    expect(params.get('mode')).toBe('3');
    expect(params.get('qno')).toBe('4');
  });
});

describe('buildApkakomonRequest', () => {
  it('returns a POST request with form headers', () => {
    const request = buildApkakomonRequest({}, () => 'sid');

    expect(request.method).toBe('POST');
    expect(request.headers['content-type']).toBe('application/x-www-form-urlencoded');
    expect(request.body).toContain('sid=sid');
  });
});