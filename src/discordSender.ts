import { Client, GatewayIntentBits } from 'discord.js';
import type { PollData, PartialTextBasedChannelFields } from 'discord.js';
import type { QuestionMessage } from './formatter.js';
import { ImageDownloadError } from './errors.js';
import { retry } from './retry.js';

export type DiscordSender = {
  start: () => Promise<void>;
  sendQuestion: (message: QuestionMessage) => Promise<void>;
  sendPoll: (poll: PollData) => Promise<void>;
  stop: () => Promise<void>;
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
    await new Promise<void>((resolve) => client?.once('ready', () => resolve()));
  }

  async function getChannel(): Promise<PartialTextBasedChannelFields> {
    if (!client) {
      throw new Error('Discord client not started');
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !('isTextBased' in channel) || !channel.isTextBased() || !('send' in channel)) {
      throw new Error(`Channel ${channelId} is not text-based or not found`);
    }

    return channel as PartialTextBasedChannelFields;
  }

  async function fetchImage(url: string): Promise<Buffer> {
    return retry(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image ${url}: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
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

  async function sendQuestion(message: QuestionMessage) {
    const channel = await getChannel();
    const urls = message.imageUrls ?? [];

    if (urls.length === 0) {
      await channel.send(message.content);
      return;
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
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      const content = batchIndex === 0 ? message.content : undefined;
      await channel.send({ content, files: batches[batchIndex] });
    }
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

  return { start, sendQuestion, sendPoll, stop };
}
