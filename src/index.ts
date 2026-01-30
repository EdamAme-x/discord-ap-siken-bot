import cron from 'node-cron';
import { runOnce } from './app.js';
import { loadConfig } from './config.js';
import { createDiscordSender } from './discordSender.js';
import { fetchHtml } from './fetcher.js';
import { buildPollData, buildQuestionMessage } from './formatter.js';
import { scrapePastExams } from './scraper.js';
import { scheduleDaily } from './scheduler.js';

async function main() {
  const config = await loadConfig();
  const sender = createDiscordSender(config);
  const scraper = (cfg: typeof config) => scrapePastExams(fetchHtml, cfg);

  await sender.start();

  const job = async () => {
    try {
      await runOnce(config, {
        scrapePastExams: scraper,
        buildQuestionMessage,
        buildPollData,
        sender
      });
    } catch (error) {
      console.error('[job] failed', error);
    }
  };

  scheduleDaily(cron, config.cron, config.timezone, job);
  console.log(`Scheduled job: ${config.cron} (${config.timezone})`);
}

main().catch((error) => {
  console.error('[startup] failed', error);
  process.exitCode = 1;
});