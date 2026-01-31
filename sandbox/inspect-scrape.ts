import { readFile } from 'node:fs/promises';
import { fetchHtml } from '../src/fetcher.js';
import { parseQuestionFromHtml } from '../src/scraper.js';

const raw = await readFile(new URL('../config.json', import.meta.url), 'utf8');
const config = JSON.parse(raw);

const html = await fetchHtml(config);
const parsed = parseQuestionFromHtml(html, config);

console.log('questionText:', parsed.questionText.slice(0, 200));
console.log('choices:', parsed.choices.length);
console.log('choice0:', parsed.choices[0]);
console.log('answer:', parsed.answer);
console.log('explanation:', parsed.explanation ? parsed.explanation.slice(0, 200) : '');
