import { Client, GatewayIntentBits } from 'discord.js';
import type { PollData, PartialTextBasedChannelFields } from 'discord.js';
import type { QuestionMessage } from './formatter.js';
import { ImageDownloadError } from './errors.js';
import { retry } from './retry.js';
import sharp from 'sharp';

export type DiscordSender = {
  start: () => Promise<void>;
  ensureChannelAccess: () => Promise<void>;
  sendQuestion: (message: QuestionMessage) => Promise<string | undefined>;
  sendQuestionWithButtons: (message: QuestionMessage, components: any[]) => Promise<string>;
  sendPoll: (poll: PollData) => Promise<void>;
  stop: () => Promise<void>;
  getClient: () => Client | undefined;
};

type SenderConfig = {
  token: string;
  channelId: string;
  clientFactory?: () => Client;
  imageFetcher?: (url: string) => Promise<Buffer>;
};

const MAX_FILES_PER_MESSAGE = 10;

export function createDiscordSender({
  token,
  channelId,
  clientFactory,
  imageFetcher
}: SenderConfig): DiscordSender {
  let client: Client | undefined;
  const factory =
    clientFactory ??
    (() => new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] }));

  async function start() {
    client = factory();
    await client.login(token);
    await new Promise<void>((resolve) => client?.once('clientReady', () => resolve()));
  }

  async function getChannel(): Promise<PartialTextBasedChannelFields> {
    if (!client) {
      throw new Error('Discord client not started');
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      throw new Error(
        `Channel ${channelId} not found. Ensure the bot is in the server that contains this channel.`
      );
    }
    if (!('isTextBased' in channel) || !channel.isTextBased() || !('send' in channel)) {
      throw new Error(`Channel ${channelId} is not a text channel or cannot send messages.`);
    }

    return channel as PartialTextBasedChannelFields;
  }

  async function fillTransparentWithWhite(buffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      // Only process PNG images with transparency
      if (metadata.format === 'png' && metadata.hasAlpha) {
        return await image
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .png()
          .toBuffer();
      }
      
      return buffer;
    } catch {
      // If processing fails, return original buffer
      return buffer;
    }
  }

  async function fetchImage(url: string): Promise<Buffer> {
    return retry(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image ${url}: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Fill transparent PNG areas with white
      return await fillTransparentWithWhite(buffer);
    }, { attempts: 3 });
  }

  function buildFileName(url: string, index: number): string {
    try {
      const parsed = new URL(url);
      const name = parsed.pathname.split('/').filter(Boolean).pop();
      if (name) return name;
    } catch {
      // ignore
    }
    return `image-${index + 1}.bin`;
  }

  function chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }

  async function sendQuestion(message: QuestionMessage): Promise<string | undefined> {
    const channel = await getChannel();
    const urls = message.imageUrls ?? [];

    if (urls.length === 0) {
      const sent = await channel.send(message.content);
      return sent.id;
    }

    const failed: string[] = [];
    const attachments = [];
    const fetcher = imageFetcher ?? fetchImage;

    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index];
      try {
        const buffer = await fetcher(url);
        attachments.push({ attachment: buffer, name: buildFileName(url, index) });
      } catch {
        failed.push(url);
      }
    }

    if (failed.length > 0) {
      throw new ImageDownloadError(failed);
    }

    const batches = chunkArray(attachments, MAX_FILES_PER_MESSAGE);
    let firstMessageId: string | undefined;
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      const content = batchIndex === 0 ? message.content : undefined;
      const sent = await channel.send({ content, files: batches[batchIndex] });
      if (batchIndex === 0) {
        firstMessageId = sent.id;
      }
    }
    return firstMessageId;
  }

  async function sendQuestionWithButtons(message: QuestionMessage, components: any[]): Promise<string> {
    const channel = await getChannel();
    const urls = message.imageUrls ?? [];

    const failed: string[] = [];
    const attachments = [];
    const fetcher = imageFetcher ?? fetchImage;

    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index];
      try {
        const buffer = await fetcher(url);
        attachments.push({ attachment: buffer, name: buildFileName(url, index) });
      } catch {
        failed.push(url);
      }
    }

    if (failed.length > 0) {
      throw new ImageDownloadError(failed);
    }

    // Send images first if any
    if (attachments.length > 0) {
      const batches = chunkArray(attachments, MAX_FILES_PER_MESSAGE);
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
        await channel.send({ files: batches[batchIndex] });
      }
    }

    // Send question text with buttons
    const sent = await channel.send({
      content: message.content,
      components: components.length > 0 ? components : undefined
    });
    return sent.id;
  }

  function getClient(): Client | undefined {
    return client;
  }

  async function ensureChannelAccess() {
    await getChannel();
  }

  async function sendPoll(poll: PollData) {
    const channel = await getChannel();
    await channel.send({ poll });
  }

  async function stop() {
    if (client) {
      await client.destroy();
      client = undefined;
    }
  }

  return { start, ensureChannelAccess, sendQuestion, sendQuestionWithButtons, sendPoll, stop, getClient };
}
