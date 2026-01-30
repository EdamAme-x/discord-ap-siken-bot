import { load } from 'cheerio';
import type { ChoiceData, QuestionData } from './formatter.js';
import type { ApkakomonConfig } from './apkakomon.js';

type ParseOptions = {
  questionSelector: string;
  choiceSelector: string;
  choiceLabelSelector?: string;
  choiceTextSelector?: string;
  baseUrl?: string;
};

export type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type ScrapeOptions = ParseOptions & {
  targetUrl: string;
  request?: RequestOptions;
  apkakomon?: ApkakomonConfig;
};

function resolveUrl(rawUrl: string, baseUrl?: string): string {
  if (!rawUrl) return '';
  if (!baseUrl) return rawUrl;
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return rawUrl;
  }
}

function extractImages(root: ReturnType<typeof load>, element: any): string[] {
  const images: string[] = [];
  element.find('img').each((index: number, img: any) => {
    const src = root(img).attr('src') || '';
    if (src) images.push(src);
  });
  return images;
}

function extractText(root: ReturnType<typeof load>, element: any): string {
  const clone = root(element).clone();
  clone.find('sup').each((index: number, sup: any) => {
    const supText = root(sup).text();
    root(sup).replaceWith(`^${supText}`);
  });

  return clone.text().replace(/\s+/g, ' ').trim();
}

export function parseQuestionFromHtml(html: string, options: ParseOptions): QuestionData {
  const { questionSelector, choiceSelector, choiceLabelSelector, choiceTextSelector, baseUrl } = options;
  const $ = load(html);

  const questionElement = $(questionSelector).first();
  const questionText = extractText($, questionElement);
  const questionImages = extractImages($, questionElement).map((src) => resolveUrl(src, baseUrl));

  const choices: ChoiceData[] = $(choiceSelector)
    .toArray()
    .map((element) => {
      const root = $(element);
      const label = choiceLabelSelector
        ? extractText($, root.find(choiceLabelSelector).first())
        : extractText($, root.find('button').first());
      const text = choiceTextSelector
        ? extractText($, root.find(choiceTextSelector).first())
        : extractText($, root.find('span').first());
      const images = extractImages($, root).map((src) => resolveUrl(src, baseUrl));

      return { label, text, images };
    });

  // Extract answer (e.g., "ウ" from span#answerChar)
  const answerElement = $('#answerChar').first();
  const answer = answerElement.length > 0 ? extractText($, answerElement) : undefined;

  // Extract explanation from div#kaisetsu
  const explanationElement = $('#kaisetsu .ansbg').first();
  const explanation = explanationElement.length > 0 ? extractText($, explanationElement) : undefined;
  const explanationImages = explanationElement.length > 0
    ? extractImages($, explanationElement).map((src) => resolveUrl(src, baseUrl))
    : [];

  return {
    questionText,
    questionImages,
    choices,
    answer,
    explanation,
    explanationImages
  };
}

export async function scrapePastExams(
  fetcher: (options: ScrapeOptions) => Promise<string>,
  options: ScrapeOptions
): Promise<QuestionData> {
  const html = await fetcher(options);
  return parseQuestionFromHtml(html, options);
}
