NodeJS: Use Node.js with cron to scrape the past-exam site every day at 5:00 AM and send to the channel specified in `config.json`. (TOKEN etc. are also in config.json; it will run on a VPS.)
Package manager: Pnpm. Always check the latest package versions via commands. Ask for package documentation if needed.
Structure: Separate all bot sending logic so it can be mocked in tests.
Process: Use TDD. Write tests first, then implement features and keep tests passing.
Testing deps: Choose the test packages yourself and add a memo with reasons after `--- memo` in `AGENTS.md`.
Type errors: If you cannot resolve a type error, ask.
Sandbox rule: If you need to see actual results (API responses, etc.), place the script under `sandbox/*` and run it there.
After each task: Always run tests and type checking.
Example of Config is `./config.example.json`
Dont't write comment in Code.

Light Discord.js docs:
```md
discord.js
TypeScript icon, indicating that this package has built-in type declarations
14.25.1  Public  Published 2 months ago

discord.js


Discord server npm version npm downloads Tests status Last commit. Code coverage

Vercel Cloudflare Workers

About
discord.js is a powerful Node.js module that allows you to easily interact with the Discord API.

Object-oriented
Predictable abstractions
Performant
100% coverage of the Discord API
Installation
Node.js 18 or newer is required.

npm install discord.js
yarn add discord.js
pnpm add discord.js
bun add discord.js
Optional packages
zlib-sync for WebSocket data compression and inflation (npm install zlib-sync)
bufferutil for a much faster WebSocket connection (npm install bufferutil)
@discordjs/voice for interacting with the Discord Voice API (npm install @discordjs/voice)
Example usage
Install discord.js:

npm install discord.js
yarn add discord.js
pnpm add discord.js
bun add discord.js
Register a slash command against the Discord API:

import { REST, Routes } from 'discord.js';

const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}
Afterwards we can create a quite simple example bot:

import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.login(TOKEN);
Links
Website (source)
Documentation
Guide (source) Also see the v13 to v14 Update Guide, which includes updated and removed items from the library.
discord.js Discord server
Discord API Discord server
GitHub
npm
Related libraries
Extensions
RPC (source)
Contributing
Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the documentation.
See the contribution guide if you'd like to submit a PR.

Help
If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle nudge in the right direction, please don't hesitate to join our official discord.js Server.

Readme
Keywords
discordapibotclientnodediscordapp
```

--- memo
- vitest: ESM-friendly test runner with mocking, keeps unit tests fast and isolated for TDD.
- typescript: Type-safe rewrite to catch config and scraper errors early.
- tsx: Simple ESM-friendly TypeScript runner for production entrypoint without a build step.
- @types/node: Node type definitions for fetch/fs globals in strict mode.