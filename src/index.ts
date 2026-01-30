import cron from 'node-cron';
import { Events } from 'discord.js';
import type { QuestionData } from './formatter.js';
import { runOnce } from './app.js';
import { loadConfig } from './config.js';
import { createDiscordSender } from './discordSender.js';
import { fetchHtml } from './fetcher.js';
import { buildPollData, buildQuestionMessage } from './formatter.js';
import { scrapePastExams } from './scraper.js';
import { scheduleDaily } from './scheduler.js';

// Store question data by message ID for interaction handling
const questionDataMap = new Map<string, QuestionData>();
// Store first correct answerer by message ID
const firstCorrectAnswererMap = new Map<string, string>();
// Store users who have already answered (by message ID -> Set of user IDs)
const answeredUsersMap = new Map<string, Set<string>>();

async function main() {
  const config = await loadConfig();
  const sender = createDiscordSender(config);
  const scraper = (cfg: typeof config) => scrapePastExams(fetchHtml, cfg);

  await sender.start();
  await sender.ensureChannelAccess();

  const client = sender.getClient();
  if (!client) {
    throw new Error('Discord client not available');
  }

  // Handle button interactions
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;
    const messageId = interaction.message.id;
    
    // Handle choice button clicks
    if (customId.startsWith('choice_')) {
      const choiceIndex = parseInt(customId.replace('choice_', ''), 10);
      
      const question = questionDataMap.get(messageId);
      if (!question) {
        await interaction.reply({ content: '問題データが見つかりません。', ephemeral: true });
        return;
      }

      // Check if user has already answered
      const answeredUsers = answeredUsersMap.get(messageId) || new Set<string>();
      if (answeredUsers.has(interaction.user.id)) {
        await interaction.reply({ 
          content: '既に回答済みです。「答えを見る」ボタンをご利用ください。', 
          ephemeral: true 
        });
        return;
      }

      const choice = question.choices[choiceIndex];
      if (!choice) {
        await interaction.reply({ content: '無効な選択肢です。', ephemeral: true });
        return;
      }

      // Mark user as answered
      answeredUsers.add(interaction.user.id);
      answeredUsersMap.set(messageId, answeredUsers);

      const isCorrect = question.answer === choice.label;
      let replyContent = `選択した答え: **${choice.label}. ${choice.text}**\n\n`;
      
      if (question.answer) {
        replyContent += `正解: **${question.answer}**\n`;
        replyContent += isCorrect ? '✅ 正解！' : '❌ 不正解';
      }
      
      if (question.explanation) {
        replyContent += `\n\n**解説:**\n${question.explanation}`;
      }

      // If correct and no first correct answerer recorded yet, update the question message
      // Only record if user hasn't answered before (already checked above)
      if (isCorrect && question.answer) {
        const existingFirstAnswerer = firstCorrectAnswererMap.get(messageId);
        if (!existingFirstAnswerer) {
          firstCorrectAnswererMap.set(messageId, interaction.user.id);
          
          // Update the question message to include first correct answerer
          try {
            const originalContent = interaction.message.content || '';
            const updatedContent = `${originalContent}\n\n最速正解者: <@${interaction.user.id}>`;
            await interaction.message.edit({ content: updatedContent });
          } catch (error) {
            console.error('[interaction] Failed to update message with first correct answerer:', error);
          }
        }
      }

      await interaction.reply({ content: replyContent, ephemeral: true });
      return;
    }

    // Handle "答えを見る" button clicks
    if (customId === 'answer') {
      const question = questionDataMap.get(messageId);
      
      if (!question || !question.answer) {
        await interaction.reply({ content: '答えが利用できません。', ephemeral: true });
        return;
      }

      // Check if user has already answered
      const answeredUsers = answeredUsersMap.get(messageId) || new Set<string>();
      const hasAnswered = answeredUsers.has(interaction.user.id);
      
      // If user hasn't answered yet, mark them as answered (they can only use "答えを見る" from now on)
      if (!hasAnswered) {
        answeredUsers.add(interaction.user.id);
        answeredUsersMap.set(messageId, answeredUsers);
      }

      let replyContent = `**答え:** ${question.answer}`;
      if (question.explanation) {
        replyContent += `\n\n**解説:**\n${question.explanation}`;
      }

      await interaction.reply({ content: replyContent, ephemeral: true });
      return;
    }
  });

  const job = async () => {
    const startedAt = new Date().toISOString();
    console.log(`[job] started at ${startedAt}`);
    try {
      const result = await runOnce(config, {
        scrapePastExams: scraper,
        buildQuestionMessage,
        buildPollData,
        sender
      });
      
      // Store question data with message ID
      if (result && typeof result === 'object' && 'messageId' in result && 'question' in result) {
        questionDataMap.set(result.messageId as string, result.question as QuestionData);
      }
      
      console.log('[job] completed successfully');
    } catch (error) {
      console.error('[job] failed', error);
    }
  };

  scheduleDaily(cron, config.cron, config.timezone, job);
  console.log(`Scheduled job: ${config.cron} (${config.timezone})`);
  console.log('[startup] Bot is running. Press Ctrl+C to stop.');

  // Keep process alive and handle graceful shutdown
  const shutdown = async () => {
    console.log('\n[shutdown] Shutting down gracefully...');
    await sender.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive (prevent immediate exit)
  // Discord client connection should keep the process alive, but ensure it doesn't exit
  if (process.stdin.isTTY) {
    process.stdin.resume();
  }
  
  // Keep event loop alive with a no-op interval (as fallback)
  // This ensures the process doesn't exit even if Discord client disconnects
  setInterval(() => {
    // No-op: just keep the event loop alive
  }, 60000); // Check every minute
}

main().catch((error) => {
  console.error('[startup] failed', error);
  process.exitCode = 1;
});