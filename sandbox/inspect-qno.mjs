import fs from 'node:fs/promises';

const raw = await fs.readFile(new URL('../config.json', import.meta.url), 'utf8');
const config = JSON.parse(raw);

const response = await fetch(config.targetUrl, { headers: { Referer: config.targetUrl } });
const html = await response.text();

const idx = html.indexOf('qno');
console.log('qnoIndex', idx);
console.log(html.slice(idx - 200, idx + 800));
