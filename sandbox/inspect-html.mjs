import fs from 'node:fs/promises';

const raw = await fs.readFile(new URL('../config.json', import.meta.url), 'utf8');
const config = JSON.parse(raw);

const response = await fetch(config.targetUrl, { headers: { Referer: config.targetUrl } });
const html = await response.text();

console.log('status:', response.status);
console.log('hasSelectList:', html.includes('selectList'));
console.log('hasQno:', html.includes('qno'));
console.log('headSnippet:', html.slice(0, 500));
