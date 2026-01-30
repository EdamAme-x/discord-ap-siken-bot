/**
 * Run: npx tsx sandbox/fetch-apkakomon-response.mts
 * Fetches apkakomon POST response (following redirect with cookies) and parses question/choices.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchHtml } from '../src/fetcher.js';
import { parseQuestionFromHtml } from '../src/scraper.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetUrl = 'https://www.ap-siken.com/apkakomon.php';
const baseUrl = 'https://www.ap-siken.com/';
const options = {
  targetUrl,
  baseUrl,
  questionSelector: 'h3.qno + div',
  choiceSelector: 'ul.selectList li',
  choiceLabelSelector: 'button.selectBtn',
  choiceTextSelector: 'span',
  apkakomon: { enabled: true }
};

const html = await fetchHtml(options);
const outPath = join(__dirname, 'apkakomon-live-response.html');
writeFileSync(outPath, html, 'utf8');
console.log('Saved response to', outPath);

const parsed = parseQuestionFromHtml(html, options);
console.log('questionText length:', parsed.questionText?.length ?? 0);
console.log('choices count:', parsed.choices.length);
if (parsed.choices.length > 0) {
  console.log('first choice:', parsed.choices[0]);
}
