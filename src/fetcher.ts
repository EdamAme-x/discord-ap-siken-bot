import type { ScrapeOptions } from './scraper.js';
import { buildApkakomonRequest } from './apkakomon.js';

function buildRequestInit(options: ScrapeOptions): RequestInit | undefined {
  let init: RequestInit | undefined;

  if (options.apkakomon?.enabled) {
    const apkRequest = buildApkakomonRequest(options.apkakomon);
    init = {
      method: apkRequest.method,
      headers: { ...apkRequest.headers, Referer: options.targetUrl },
      body: apkRequest.body,
      redirect: 'manual'
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

function getCookieHeader(response: Response): string | undefined {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = headers.getSetCookie?.();
  if (cookies?.length) return cookies.join('; ');
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return undefined;
  return setCookie;
}

export async function fetchHtml(options: ScrapeOptions): Promise<string> {
  const init = buildRequestInit(options);
  const response = await fetch(options.targetUrl, init);

  const isRedirect = response.status >= 300 && response.status < 400;
  const location = response.headers.get('location');

  if (options.apkakomon?.enabled && isRedirect && location) {
    const redirectUrl = location.startsWith('http') ? location : new URL(location, options.targetUrl).toString();
    const cookieHeader = getCookieHeader(response);
    const redirectInit: RequestInit = {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(cookieHeader ? { Cookie: cookieHeader } : {})
      },
      redirect: 'follow'
    };
    const redirectResponse = await fetch(redirectUrl, redirectInit);
    if (!redirectResponse.ok) {
      throw new Error(`Failed to fetch redirect ${redirectUrl}: ${redirectResponse.status}`);
    }
    return redirectResponse.text();
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${options.targetUrl}: ${response.status}`);
  }
  return response.text();
}