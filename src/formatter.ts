import type { PollData } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export type ChoiceData = {
  label: string;
  text: string;
  images: string[];
};

export type QuestionData = {
  questionText: string;
  questionImages: string[];
  choices: ChoiceData[];
  answer?: string;
  explanation?: string;
  explanationImages?: string[];
};

export type QuestionMessage = {
  content: string;
  imageUrls: string[];
};

type FormatterConfig = {
  pollDurationHours?: number;
  pollAllowMultiselect?: boolean;
  pollLayoutType?: PollData['layoutType'];
};

export function buildQuestionMessage(question: QuestionData): QuestionMessage {
  const questionText = question.questionText?.trim() || 'Question';
  const imageUrls = [
    ...question.questionImages,
    ...question.choices.flatMap((choice) => choice.images)
  ];

  return { content: questionText, imageUrls };
}

export function buildPollData(question: QuestionData, config: FormatterConfig): PollData {
  const pollDurationHours = config.pollDurationHours ?? 24;
  const pollAllowMultiselect = config.pollAllowMultiselect ?? false;
  // Poll title is kept short since the full question text is posted separately
  const pollQuestionText = '選択肢';

  // Discord API: poll.answers must be 1–10 in length, and each answer text max 55 chars
  const MAX_POLL_ANSWER_LENGTH = 55;
  const answers = question.choices
    .slice(0, 10)
    .map((choice) => {
      const fullText = `${choice.label}. ${choice.text}`.trim();
      const truncated =
        fullText.length > MAX_POLL_ANSWER_LENGTH
          ? fullText.slice(0, MAX_POLL_ANSWER_LENGTH - 3) + '...'
          : fullText;
      return { text: truncated };
    });

  return {
    question: { text: pollQuestionText },
    answers,
    duration: pollDurationHours,
    allowMultiselect: pollAllowMultiselect,
    layoutType: config.pollLayoutType
  };
}

export function buildButtonComponents(question: QuestionData): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const choices = question.choices.slice(0, 25); // Discord allows max 25 buttons (5 rows × 5 buttons)
  
  // Create choice buttons (max 5 buttons per row)
  for (let i = 0; i < choices.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    const chunk = choices.slice(i, i + 5);
    
    for (let j = 0; j < chunk.length; j += 1) {
      const choice = chunk[j];
      const label = choice.label;
      const text = choice.text;
      const choiceIndex = i + j;
      
      // Discord button label max 80 chars, customId max 100 chars
      // Use label only if full text is too long
      const buttonLabel = `${label}. ${text}`.length <= 80 ? `${label}. ${text}` : label;
      const customId = `choice_${choiceIndex}`;
      
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(customId)
          .setLabel(buttonLabel)
          .setStyle(ButtonStyle.Primary)
      );
    }
    
    rows.push(row);
  }
  
  // Add "答えを見る" button in a new row
  if (question.answer) {
    const answerRow = new ActionRowBuilder<ButtonBuilder>();
    answerRow.addComponents(
      new ButtonBuilder()
        .setCustomId('answer')
        .setLabel('答えを見る')
        .setStyle(ButtonStyle.Secondary)
    );
    rows.push(answerRow);
  }
  
  return rows;
}
