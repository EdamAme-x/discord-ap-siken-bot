import { describe, expect, it, vi } from 'vitest';
import { runOnce } from '../src/app.js';
import { ImageDownloadError } from '../src/errors.js';

describe('runOnce', () => {
  it('scrapes question and sends message plus poll', async () => {
    const config = {
      pollDurationHours: 12,
      pollAllowMultiselect: false
    };

    const question = {
      questionText: 'Question text',
      questionImages: [],
      choices: [{ label: 'A', text: 'Alpha', images: [] }]
    };

    const scrapePastExams = vi.fn().mockResolvedValue(question);
    const buildQuestionMessage = vi.fn().mockReturnValue({
      content: 'message-body',
      imageUrls: []
    });
    const buildPollData = vi.fn().mockReturnValue({
      question: { text: 'Question text' },
      answers: [{ text: 'A. Alpha' }],
      duration: 12,
      allowMultiselect: false
    });
    const sender = {
      sendQuestion: vi.fn().mockResolvedValue(undefined),
      sendPoll: vi.fn().mockResolvedValue(undefined)
    };

    await runOnce(config, { scrapePastExams, buildQuestionMessage, buildPollData, sender });

    expect(scrapePastExams).toHaveBeenCalledWith(config);
    expect(buildQuestionMessage).toHaveBeenCalledWith(question);
    expect(buildPollData).toHaveBeenCalledWith(question, config);
    expect(sender.sendQuestion).toHaveBeenCalledWith({
      content: 'message-body',
      imageUrls: []
    });
    expect(sender.sendPoll).toHaveBeenCalled();
  });

  it('retries by re-scraping when image downloads fail', async () => {
    const config = {
      pollDurationHours: 12,
      pollAllowMultiselect: false
    };

    const questionA = {
      questionText: 'Question A',
      questionImages: [],
      choices: [{ label: 'A', text: 'Alpha', images: [] }]
    };
    const questionB = {
      questionText: 'Question B',
      questionImages: [],
      choices: [{ label: 'B', text: 'Beta', images: [] }]
    };

    const scrapePastExams = vi.fn()
      .mockResolvedValueOnce(questionA)
      .mockResolvedValueOnce(questionB);
    const buildQuestionMessage = vi.fn()
      .mockReturnValueOnce({ content: 'A', imageUrls: ['https://example.com/a.png'] })
      .mockReturnValueOnce({ content: 'B', imageUrls: [] });
    const buildPollData = vi.fn().mockReturnValue({
      question: { text: 'Question' },
      answers: [{ text: 'A. Alpha' }],
      duration: 12,
      allowMultiselect: false
    });
    const sender = {
      sendQuestion: vi.fn()
        .mockRejectedValueOnce(new ImageDownloadError(['https://example.com/a.png']))
        .mockResolvedValueOnce(undefined),
      sendPoll: vi.fn().mockResolvedValue(undefined)
    };

    await runOnce(config, { scrapePastExams, buildQuestionMessage, buildPollData, sender });

    expect(scrapePastExams).toHaveBeenCalledTimes(2);
    expect(sender.sendQuestion).toHaveBeenCalledTimes(2);
    expect(sender.sendPoll).toHaveBeenCalledTimes(1);
  });
});
