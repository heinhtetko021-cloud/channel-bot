const { Bot } = require("grammy");
const { Redis } = require("@upstash/redis");

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_ID, 10);
const CHANNEL_ID = process.env.CHANNEL_ID;
const CHANNEL_ID_2 = process.env.CHANNEL_ID_2;

const bot = new Bot(TOKEN);

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const isAdmin = (ctx) => ctx.from?.id === ADMIN_ID;

// Numeric chat IDs (-100...) must be sent as numbers, otherwise Telegram
// returns "chat not found".
function toChatId(v) {
  if (!v) return null;
  if (/^-?\d+$/.test(String(v).trim())) return Number(v);
  return v; // keep @username strings as-is
}
const channels = [];
const c1 = toChatId(CHANNEL_ID);
const c2 = toChatId(CHANNEL_ID_2);
if (c1) channels.push(c1);
if (c2) channels.push(c2);

const TPL_KEY = "htech:templates";

const CATEGORY_KEYS = ["value", "showcase", "promo", "faq"];
const TYPE_LABELS = {
  value: "Value/Tip",
  showcase: "Showcase (Before/After)",
  promo: "Promo/Offer",
  faq: "FAQ",
};

const DEFAULT_TEMPLATES = require("../templates.json");

async function getTemplates() {
  if (redis) {
    const stored = await redis.get(TPL_KEY);
    if (stored) return JSON.parse(stored);
  }
  return structuredClone(DEFAULT_TEMPLATES);
}

async function saveTemplates(data) {
  if (redis) {
    await redis.set(TPL_KEY, JSON.stringify(data));
  }
}

bot.command("admin", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  return ctx.reply(
    "🤖 H-Tech Channel Bot\n\nCommands:\n" +
    "/addnew — template အသစ် ထည့်\n" +
    "/post <type> <n> — post ချက်ချင်းတင် (e.g. /post promo 2)\n" +
    "/list <type> — templates ကြည့် (e.g. /list promo)\n" +
    "/del <type> <n> — template ဖျက်\n" +
    "/status — ပြင်ဆင်ထားတာတွေ ကြည့်\n\n" +
    "Types: value, showcase, promo, faq\n\n" +
    "⏰ Cron (vercel.json) က နေ့စဉ် ပြန်တင်ပေးပါတယ်"
  );
});

bot.command("addnew", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  return ctx.reply(
    "➕ Post type ရွေးပြီး text နဲ့ ထည့်ပါ:\n\n" +
    "/new value <text>\n" +
    "/new showcase <text>\n" +
    "/new promo <text>\n" +
    "/new faq <text>\n\n" +
    "ဥပမာ: /new value \"Myanmar မှာ website လိုအပ်ချက်...\""
  );
});

let pendingAdd = {};

bot.command("new", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  const parts = ctx.match.trim().split(/\s+/);
  const type = parts[0];
  if (!CATEGORY_KEYS.includes(type)) {
    return ctx.reply("Type မှားတယ်။ ရွေးပါ: " + CATEGORY_KEYS.join(", "));
  }
  const text = parts.slice(1).join(" ").replace(/^"|"$/g, "").trim();
  if (!text) {
    pendingAdd[ctx.from.id] = { type };
    return ctx.reply(`📝 "${type}" type ရဲ့ post text ကို ရိုက်ထည့်ပါ (နောက် message မှာ)`);
  }
  return addTemplate(ctx, type, text);
});

bot.on("message:text", async (ctx, next) => {
  if (!isAdmin(ctx) && !pendingAdd[ctx.from.id]) return next();
  const pending = pendingAdd[ctx.from.id];
  if (!pending) return next();
  const text = ctx.message.text.trim();
  if (!text) return ctx.reply("Text ဗလာဖြစ်နေတယ် — ပြန်ရိုက်ပါ");
  return addTemplate(ctx, pending.type, text);
});

async function addTemplate(ctx, type, text) {
  const data = await getTemplates();
  if (!data[type]) data[type] = [];
  data[type].push(text);
  await saveTemplates(data);
  delete pendingAdd[ctx.from.id];
  return ctx.reply(`✅ Saved. "${type}" #${data[type].length}\n\nPreview:\n${text}`);
}

bot.command("list", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  const type = ctx.match.trim();
  const data = await getTemplates();
  if (!type || !data[type]) {
    return ctx.reply("Type ရွေးပါ: " + CATEGORY_KEYS.join(", "));
  }
  return ctx.reply(
    `📁 "${type}" — ${data[type].length} posts\n\n` +
    data[type].map((t, i) => `#${i + 1} ${t.split("\n")[0].slice(0, 60)}`).join("\n")
  );
});

bot.command("del", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  const parts = ctx.match.trim().split(/\s+/);
  const type = parts[0];
  const n = parseInt(parts[1], 10);
  const data = await getTemplates();
  if (!type || !data[type]) return ctx.reply("Type မှားတယ်");
  if (!n || !data[type][n - 1]) return ctx.reply(`#${n} မရှိဘူး (${data[type].length} ခုပဲ ရှိ)`);
  const removed = data[type].splice(n - 1, 1);
  await saveTemplates(data);
  return ctx.reply(`🗑 Deleted #${n}\n\n${removed[0]}`);
});

bot.command("post", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  const parts = ctx.match.trim().split(/\s+/);
  const type = parts[0];
  const n = parseInt(parts[1], 10);
  const data = await getTemplates();
  if (!type || !data[type]) return ctx.reply("Type မှားတယ်");
  if (!n || !data[type][n - 1]) return ctx.reply(`#${n} မရှိဘူး (${data[type].length} ခုပဲ ရှိ)`);
  const text = data[type][n - 1];

  let results = [];
  for (const ch of channels) {
    try {
      await ctx.api.sendMessage(ch, text);
      results.push(`${ch} ✅`);
    } catch (e) {
      results.push(`${ch} ❌ (${e.message})`);
    }
  }
  return ctx.reply(`✅ Posted "${type}" #${n} to:\n${results.join("\n")}\n\nPost:\n${text}`);
});

bot.command("status", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  const data = await getTemplates();
  const counts = CATEGORY_KEYS.map((k) => `${TYPE_LABELS[k]}: ${data[k]?.length || 0}`).join("\n");
  return ctx.reply(
    "📊 Status\n\n" +
    `Channels: ${channels.length ? channels.join(", ") : "❌ သတ်မှတ်ထားတာမရှိ"}\n` +
    `Storage: ${redis ? "Redis ✅" : "❌ Redis မရှိ (templates ပြောင်းလဲလို့မရ)"}\n` +
    `Admin: ${ADMIN_ID}\n\nTemplates:\n${counts}\n\n` +
    `⏰ Cron: Vercel မှာ schedule လုပ်ထားပါ`
  );
});

bot.on("message:text", async (ctx, next) => {
  if (isAdmin(ctx) && ctx.message.text.startsWith("/")) {
    return ctx.reply("❌ Command မှားနေပါတယ်။ /admin ကို ကြည့်ပါ");
  }
  return next();
});

module.exports = { bot, channels };
