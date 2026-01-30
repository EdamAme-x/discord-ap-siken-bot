import type { PollData } from 'discord.js';
import type { QuestionData, QuestionMessage } from './formatter.js';
import { ImageDownloadError } from './errors.js';
import { buildButtonComponents } from './formatter.js';

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
    sendQuestion: (message: QuestionMessage) => Promise<string | undefined>;
    sendQuestionWithButtons: (message: QuestionMessage, components: any[]) => Promise<string>;
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
      
      // Use buttons instead of poll
      if (question.choices.length >= 1) {
        const components = buildButtonComponents(question);
        const messageId = await sender.sendQuestionWithButtons(message, components);
        
        // Store question data with actual message ID for interaction handling
        // This will be handled in index.ts via interactionCreate event
        return { messageId, question };
      } else {
        await sender.sendQuestion(message);
        console.warn(
          `[job] Skipped buttons: 0 choices (question.choices.length=${question.choices.length})`
        );
      }
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
