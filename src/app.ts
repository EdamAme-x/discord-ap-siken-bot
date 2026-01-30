import type { PollData } from 'discord.js';
import type { QuestionData, QuestionMessage } from './formatter.js';
import { ImageDownloadError } from './errors.js';

type AppConfig = {
  pollDurationHours?: number;
  pollAllowMultiselect?: boolean;
  pollLayoutType?: PollData['layoutType'];
};

type Dependencies<TConfig extends AppConfig> = {
  scrapePastExams: (config: TConfig) => Promise<QuestionData>;
  buildQuestionMessage: (question: QuestionData) => QuestionMessage;
  buildPollData: (question: QuestionData, config: TConfig) => PollData;
  sender: {
    sendQuestion: (message: QuestionMessage) => Promise<void>;
    sendPoll: (poll: PollData) => Promise<void>;
  };
};

export async function runOnce<TConfig extends AppConfig>(
  config: TConfig,
  { scrapePastExams, buildQuestionMessage, buildPollData, sender }: Dependencies<TConfig>
) {
  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const question = await scrapePastExams(config);
      const message = buildQuestionMessage(question);
      const poll = buildPollData(question, config);

      await sender.sendQuestion(message);
      await sender.sendPoll(poll);
      return;
    } catch (error) {
      lastError = error;
      if (error instanceof ImageDownloadError && attempt < maxAttempts) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}
