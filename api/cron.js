const { Bot } = require("grammy");
const { Redis } = require("@upstash/redis");
const { channels } = require("./bot");
const DEFAULT_TEMPLATES = require("../templates.json");

const TOKEN = process.env.BOT_TOKEN;

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}
const TPL_KEY = "htech:templates";

async function getTemplates() {
  if (redis) {
    const stored = await redis.get(TPL_KEY);
    if (stored) return JSON.parse(stored);
  }
  return structuredClone(DEFAULT_TEMPLATES);
}

// Vercel Cron handler
module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const data = await getTemplates();
  const hour = new Date().getUTCHours();
  const type = getTypeForHour(hour);
  const posts = data[type] || data.value;
  const text = posts[Math.floor(Math.random() * posts.length)];

  const bot = new Bot(TOKEN);
  const results = [];
  for (const ch of channels) {
    try {
      await bot.api.sendMessage(ch, text);
      results.push({ channel: ch, ok: true });
    } catch (e) {
      results.push({ channel: ch, ok: false, error: e.message });
    }
  }

  return res.json({ type, hour, results });
};

function getTypeForHour(hour) {
  // Myanmar is UTC+6:30
  const myanmar = (hour + 6 + 0.5) % 24;
  if (myanmar >= 8 && myanmar < 11) return "value";
  if (myanmar >= 13 && myanmar < 16) return "showcase";
  if (myanmar >= 17 && myanmar < 20) return "promo";
  return "value";
}
