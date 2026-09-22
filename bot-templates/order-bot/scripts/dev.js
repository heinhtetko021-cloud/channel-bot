/**
 * Local polling dev server (no webhook needed).
 * Great for testing locally before deploying to Vercel.
 *
 * Usage:
 *   npm install
 *   set BOT_TOKEN=... (or create .env and load it)
 *   npm run dev
 *
 * NOTE: the bot is configured to run via webhook on Vercel. For local
 * development we simply start long-polling using the same bot instance.
 */
const { bot } = require("../api/bot");

if (!process.env.BOT_TOKEN) {
  // Best-effort load from a local .env if BOT_TOKEN isn't already set
  try {
    require("fs")
      .readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .forEach((line) => {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
      });
  } catch (_) {
    // no .env file — rely on environment variables
  }
}

if (!process.env.BOT_TOKEN) {
  console.error("BOT_TOKEN is not set. Add it to your environment or a .env file.");
  process.exit(1);
}

console.log("🤖 Bot started in polling mode. Press Ctrl+C to stop.");
bot.start({
  onStart: (info) => console.log(`Running as @${info.username}`),
});
