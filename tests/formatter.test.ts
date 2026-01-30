import { describe, expect, it } from 'vitest';
import { buildPollData, buildQuestionMessage } from '../src/formatter.js';

describe('buildQuestionMessage', () => {
  it('formats question text and images', () => {
    const question = {
      questionText: 'What is 2 + 2?',
      questionImages: ['https://example.com/q.png'],
      choices: [
        { label: 'A', text: '3', images: [] },
        { label: 'B', text: '4', images: ['https://example.com/b.png'] }
      ]
    };

    const message = buildQuestionMessage(question);

    expect(message.content).toBe('What is 2 + 2?');
    expect(message.imageUrls).toEqual([
      'https://example.com/q.png',
      'https://example.com/b.png'
    ]);
  });
});

describe('buildPollData', () => {
  it('builds poll data using config defaults', () => {
    const question = {
      questionText: 'Question text',
      questionImages: [],
      choices: [
        { label: 'A', text: 'Alpha', images: [] },
        { label: 'B', text: 'Beta', images: [] }
      ]
    };

    const poll = buildPollData(question, { pollDurationHours: 12, pollAllowMultiselect: false });

    expect(poll.question.text).toBe('Question text');
    expect(poll.answers).toEqual([{ text: 'A. Alpha' }, { text: 'B. Beta' }]);
    expect(poll.duration).toBe(12);
    expect(poll.allowMultiselect).toBe(false);
  });
});
