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

    expect(message.content).toBe('What is 2 + 2?\n\nA. 3\nB. 4');
    expect(message.imageUrls).toEqual([
      'https://example.com/q.png',
      'https://example.com/b.png'
    ]);
  });

  it('keeps only the question text when there are no choices', () => {
    const question = {
      questionText: 'Solo question',
      questionImages: [],
      choices: []
    };

    const message = buildQuestionMessage(question);

    expect(message.content).toBe('Solo question');
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

    expect(poll.question.text).toBe('選択肢');
    expect(poll.answers).toEqual([{ text: 'A. Alpha' }, { text: 'B. Beta' }]);
    expect(poll.duration).toBe(12);
    expect(poll.allowMultiselect).toBe(false);
  });

  it('limits answers to 10 when choices exceed Discord limit', () => {
    const question = {
      questionText: 'Many choices',
      questionImages: [],
      choices: Array.from({ length: 12 }, (_, i) => ({
        label: String.fromCharCode(65 + i),
        text: `Option ${i + 1}`,
        images: [] as string[]
      }))
    };

    const poll = buildPollData(question, {});

    expect(poll.answers).toHaveLength(10);
    expect(poll.answers[0].text).toBe('A. Option 1');
    expect(poll.answers[9].text).toBe('J. Option 10');
  });

  it('returns empty answers when choices is empty', () => {
    const question = {
      questionText: 'No choices',
      questionImages: [],
      choices: []
    };

    const poll = buildPollData(question, {});

    expect(poll.answers).toHaveLength(0);
  });

  it('truncates answer text to 55 characters max', () => {
    const question = {
      questionText: 'Long choice',
      questionImages: [],
      choices: [
        {
          label: 'ア',
          text: 'This is a very long choice text that exceeds the Discord poll answer limit of 55 characters and should be truncated',
          images: []
        }
      ]
    };

    const poll = buildPollData(question, {});

    expect(poll.answers).toHaveLength(1);
    expect(poll.answers[0].text.length).toBeLessThanOrEqual(55);
    expect(poll.answers[0].text).toMatch(/^ア\. .*\.\.\.$/);
  });
});
