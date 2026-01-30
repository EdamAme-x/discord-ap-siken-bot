import { describe, expect, it, vi } from 'vitest';
import { parseQuestionFromHtml, scrapePastExams } from '../src/scraper.js';

describe('parseQuestionFromHtml', () => {
  it('extracts question text, images, and choices', () => {
    const html = `
      <h3 class="qno">Q1</h3>
      <div>Question <img src="/q.png" /><div class="img_margin"><img src="/q2.png" /></div></div>
      <div class="ansbg">
        <ul class="selectList">
          <li><button class="selectBtn">A</button><span>1x10<sup>6</sup></span></li>
          <li><button class="selectBtn">B</button><span>Choice B</span><img src="/b.png" /></li>
        </ul>
      </div>
    `;

    const parsed = parseQuestionFromHtml(html, {
      questionSelector: 'h3.qno + div',
      choiceSelector: 'ul.selectList li',
      choiceLabelSelector: 'button.selectBtn',
      choiceTextSelector: 'span',
      baseUrl: 'https://example.com'
    });

    expect(parsed.questionText).toBe('Question');
    expect(parsed.questionImages).toEqual(['https://example.com/q.png', 'https://example.com/q2.png']);
    expect(parsed.choices).toEqual([
      { label: 'A', text: '1x10^6', images: [] },
      { label: 'B', text: 'Choice B', images: ['https://example.com/b.png'] }
    ]);
  });
});

describe('scrapePastExams', () => {
  it('fetches the target URL and returns parsed question', async () => {
    const html = '<h3 class="qno"></h3><div>Question</div><ul class="selectList"></ul>';
    const fetcher = vi.fn().mockResolvedValue(html);

    const parsed = await scrapePastExams(fetcher, {
      targetUrl: 'https://example.com',
      questionSelector: 'h3.qno + div',
      choiceSelector: 'ul.selectList li'
    });

    expect(fetcher).toHaveBeenCalledWith({
      targetUrl: 'https://example.com',
      questionSelector: 'h3.qno + div',
      choiceSelector: 'ul.selectList li'
    });
    expect(parsed.questionText).toBe('Question');
  });
});
