import fs from 'node:fs/promises';
import { load } from 'cheerio';

const raw = await fs.readFile(new URL('../config.json', import.meta.url), 'utf8');
const config = JSON.parse(raw);

const response = await fetch(config.targetUrl, { headers: { Referer: config.targetUrl } });
const html = await response.text();

const $ = load(html);
const question = $(config.questionSelector).first();
const choiceNodes = $(config.choiceSelector).toArray();

console.log('questionText:', question.text().trim().slice(0, 200));
console.log('choiceCount:', choiceNodes.length);
console.log('firstChoiceHtml:', choiceNodes[0] ? $.html(choiceNodes[0]).slice(0, 500) : 'none');
