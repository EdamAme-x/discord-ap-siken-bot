import type { PollData } from 'discord.js';

export type ChoiceData = {
  label: string;
  text: string;
  images: string[];
};

export type QuestionData = {
  questionText: string;
  questionImages: string[];
  choices: ChoiceData[];
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
  const pollQuestionText = question.questionText?.trim() || 'Question';

  return {
    question: { text: pollQuestionText },
    answers: question.choices.map((choice) => ({
      text: `${choice.label}. ${choice.text}`.trim()
    })),
    duration: pollDurationHours,
    allowMultiselect: pollAllowMultiselect,
    layoutType: config.pollLayoutType
  };
}
