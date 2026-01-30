import type { ScrapeOptions } from './scraper.js';
import { buildApkakomonRequest } from './apkakomon.js';

function buildRequestInit(options: ScrapeOptions): RequestInit | undefined {
  let init: RequestInit | undefined;

  if (options.apkakomon?.enabled) {
    const apkRequest = buildApkakomonRequest(options.apkakomon);
    init = {
      method: apkRequest.method,
      headers: apkRequest.headers,
      body: apkRequest.body
    };
  }

  if (options.request) {
    init = {
      ...init,
      ...options.request,
      headers: {
        ...(init?.headers ?? {}),
        ...(options.request.headers ?? {})
      },
      body: options.request.body ?? init?.body
    };
  }

  return init;
}

export async function fetchHtml(options: ScrapeOptions): Promise<string> {
  const init = buildRequestInit(options);
  const response = await fetch(options.targetUrl, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${options.targetUrl}: ${response.status}`);
  }
  return response.text();
}