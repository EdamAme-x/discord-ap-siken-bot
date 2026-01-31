import { describe, expect, it, vi } from 'vitest';
import { runOnce } from '../src/app.js';
import { ImageDownloadError } from '../src/errors.js';

describe('runOnce', () => {
  it('scrapes question and sends message with buttons', async () => {
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
    const sender = {
      sendQuestion: vi.fn().mockResolvedValue(undefined),
      sendQuestionWithButtons: vi.fn().mockResolvedValue('msg-1'),
      sendPoll: vi.fn().mockResolvedValue(undefined)
    };

    await runOnce(config, { scrapePastExams, buildQuestionMessage, buildPollData: vi.fn(), sender });

    expect(scrapePastExams).toHaveBeenCalledWith(config);
    expect(buildQuestionMessage).toHaveBeenCalledWith(question);
    expect(sender.sendQuestionWithButtons).toHaveBeenCalledWith(
      { content: 'message-body', imageUrls: [] },
      expect.any(Array)
    );
    expect(sender.sendQuestion).not.toHaveBeenCalled();
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
    const sender = {
      sendQuestionWithButtons: vi.fn()
        .mockRejectedValueOnce(new ImageDownloadError(['https://example.com/a.png']))
        .mockResolvedValueOnce('msg-2'),
      sendQuestion: vi.fn().mockResolvedValue(undefined),
      sendPoll: vi.fn().mockResolvedValue(undefined)
    };

    await runOnce(config, { scrapePastExams, buildQuestionMessage, buildPollData: vi.fn(), sender });

    expect(scrapePastExams).toHaveBeenCalledTimes(2);
    expect(sender.sendQuestionWithButtons).toHaveBeenCalledTimes(2);
    expect(sender.sendQuestion).not.toHaveBeenCalled();
  });

  it('sends question without buttons when there are no choices', async () => {
    const config = {
      pollDurationHours: 12,
      pollAllowMultiselect: false
    };

    const question = {
      questionText: 'Question text',
      questionImages: [],
      choices: []
    };

    const scrapePastExams = vi.fn().mockResolvedValue(question);
    const buildQuestionMessage = vi.fn().mockReturnValue({
      content: 'message-body',
      imageUrls: []
    });
    const sender = {
      sendQuestion: vi.fn().mockResolvedValue(undefined),
      sendQuestionWithButtons: vi.fn().mockResolvedValue('msg-3'),
      sendPoll: vi.fn().mockResolvedValue(undefined)
    };

    await runOnce(config, { scrapePastExams, buildQuestionMessage, buildPollData: vi.fn(), sender });

    expect(sender.sendQuestion).toHaveBeenCalled();
    expect(sender.sendQuestionWithButtons).not.toHaveBeenCalled();
  });
});
