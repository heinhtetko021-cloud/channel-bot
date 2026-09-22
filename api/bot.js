// api/bot.js — H-Tech Studio Channel Bot (upgraded)
// AI-drafted posts + human approval before publishing to @h_tech_studio.
// Menu buttons, add/list templates, status — admin only.
const { Bot, InlineKeyboard } = require("grammy");
const { Redis } = require("@upstash/redis");
const { generateDraftWithRetry } = require("./ai");

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_ID || "")
  .split(",")
  .map((id) => parseInt(id.trim(), 10))
  .filter((n) => Number.isFinite(n));

let CHANNEL_ID = process.env.CHANNEL_ID;
if (CHANNEL_ID && /^-?\d+$/.test(String(CHANNEL_ID).trim())) {
  CHANNEL_ID = Number(CHANNEL_ID);
}

const bot = new Bot(TOKEN);

let redis = null;
function getRedis() {
  if (
    redis === null &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

const TPL_KEY = "htech:templates";
const LATEST_KEY = "htech:draft:latest";
const RECENT_KEY = "htech:posted:recent";
const DEFAULT_TEMPLATES = require("../templates.json");
const CATEGORY_KEYS = ["value", "showcase", "promo", "faq"];
const TYPE_LABELS = {
  value: "Value / Tip",
  showcase: "Showcase (Before/After)",
  promo: "Promo / Offer",
  faq: "FAQ",
};

const isAdmin = (ctx) => ADMIN_IDS.includes(ctx.from?.id);
const pad = (n) => String(n).padStart(2, "0");

function mmNow() {
  return new Date(Date.now() + (6 * 60 + 30) * 60000);
}

function mmStamp() {
  const z = mmNow();
  return `${z.toISOString().slice(0, 10)} ${pad(z.getUTCHours())}:${pad(z.getUTCMinutes())}`;
}

function slotKeyForNow() {
  const z = mmNow();
  const h = z.getUTCHours();
  if (h === 9) return `htech:draft:${z.toISOString().slice(0, 10)}:09`;
  if (h === 18) return `htech:draft:${z.toISOString().slice(0, 10)}:18`;
  return null;
}

function draftKey(extra) {
  const z = mmNow();
  return `htech:draft:${z.toISOString().slice(0, 10)}:${extra || "manual"}`;
}

// ------------------------------------------------------------------ redis state

async function getTemplates() {
  const r = getRedis();
  if (r) {
    try {
      const stored = await r.get(TPL_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("getTemplates redis:", e.message);
    }
  }
  return structuredClone(DEFAULT_TEMPLATES);
}

async function saveTemplates(data) {
  const r = getRedis();
  if (r) await r.set(TPL_KEY, JSON.stringify(data));
}

async function getDraft(key) {
  const r = getRedis();
  if (!r) return null;
  const d = await r.get(key);
  if (!d) return null;
  try {
    return JSON.parse(d);
  } catch (e) {
    return { text: String(d) };
  }
}

async function setDraft(key, text) {
  const r = getRedis();
  if (!r) return;
  await r.set(key, JSON.stringify({ text, created: mmStamp() }));
  await r.set(LATEST_KEY, key);
}

async function clearDraft(key) {
  const r = getRedis();
  if (!r) return;
  await r.del(key);
  const latest = await r.get(LATEST_KEY);
  if (latest === key) await r.del(LATEST_KEY);
  for (const a of ADMIN_IDS) {
    await r.del(`htech:draftmsg:${a}`).catch(() => {});
  }
}

function draftKeyboard(key) {
  return new InlineKeyboard()
    .text("✏️ Edit", `edit:${key}`)
    .text("✅ Confirm", `confirm:${key}`)
    .text("❌ Skip", `reject:${key}`);
}

async function pushDraft(key, text, label) {
  const r = getRedis();
  const header = `📝 Draft ${label ? `(${label}) ` : ""}— ${mmStamp()}\n\n`;
  for (const a of ADMIN_IDS) {
    try {
      let msgId = null;
      if (r) msgId = await r.get(`htech:draftmsg:${a}`);
      if (msgId) {
        await bot.api.editMessageText(a, msgId, header + text, {
          reply_markup: draftKeyboard(key),
          disable_web_page_preview: true,
        });
      } else {
        const sent = await bot.api.sendMessage(a, header + text, {
          reply_markup: draftKeyboard(key),
          disable_web_page_preview: true,
        });
        if (r) await r.set(`htech:draftmsg:${a}`, sent.message_id);
      }
    } catch (e) {
      console.error(`pushDraft to ${a} failed:`, e.message);
    }
  }
}

async function recentPosts() {
  const r = getRedis();
  if (!r) return [];
  try {
    return (await r.lrange(RECENT_KEY, 0, -1)) || [];
  } catch (e) {
    return [];
  }
}

// ------------------------------------------------------------------ menu

function showMenu(ctx) {
  const kb = new InlineKeyboard()
    .text("🎨 Generate draft", "gen")
    .text("✅ Confirm & post", "confirm:__latest")
    .text("✏️ Edit", "edit:__latest")
    .text("❌ Skip", "reject:__latest")
    .row()
    .text("📚 Templates", "tpl_list")
    .text("➕ Add template", "tpl_add")
    .text("📋 Status", "status");
  return ctx.reply("🤖 H-Tech Studio Channel Bot — Menu", { reply_markup: kb });
}

bot.command("start", async (ctx) => {
  if (!isAdmin(ctx)) return;
  await showMenu(ctx);
});

bot.command("menu", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  await showMenu(ctx);
});

// ------------------------------------------------------------------ AI draft

async function generateAndSend(ctx, label) {
  try {
    const recent = await recentPosts();
    await ctx.answerCallbackQuery().catch(() => {});
    await ctx.reply("🤖 AI က draft ရေးနေပါတယ်… (၁၀ စက္ကန့်ခန့်)");
    const text = await generateDraftWithRetry({ am: true, avoid: recent });
    const key = draftKey(label || "manual");
    await setDraft(key, text);
    await pushDraft(key, text, label || "manual");
  } catch (e) {
    console.error("generate failed:", e.message);
    await ctx.reply(`⚠️ Draft မရေးနိုင်ဘူး: ${e.message}`).catch(() => {});
  }
}

bot.command("draft", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  await generateAndSend(ctx, ctx.match.trim() || "manual");
});

// ------------------------------------------------------------------ confirm / edit / reject

async function resolveKey(ctx, key) {
  if (key === "__latest") {
    const r = getRedis();
    if (r) return await r.get(LATEST_KEY);
    return null;
  }
  return key;
}

async function doConfirm(ctx, keyRaw) {
  const r = getRedis();
  const key = await resolveKey(ctx, keyRaw);
  if (!key) {
    await ctx.answerCallbackQuery({ text: "📭 Draft မရှိသေးဘူး" });
    return;
  }
  const draft = await getDraft(key);
  if (!draft) {
    await ctx.answerCallbackQuery({ text: "📭 Draft မရှိတော့ဘူး" });
    return;
  }
  if (!CHANNEL_ID) {
    await ctx.answerCallbackQuery({ text: "❌ CHANNEL_ID မသတ်ရသေးဘူး" });
    return;
  }
  try {
    const sent = await bot.api.sendMessage(CHANNEL_ID, draft.text, {
      disable_web_page_preview: true,
    });
    if (r) {
      await r.rpush(RECENT_KEY, draft.text).catch(() => {});
      await r.ltrim(RECENT_KEY, -5, -1).catch(() => {});
    }
    await clearDraft(key);
    await ctx.answerCallbackQuery({ text: "✅ Posted!" });
    await ctx
      .editMessageText(`✅ Posted ${mmStamp()}\n\n${draft.text}`, {
        disable_web_page_preview: true,
      })
      .catch(() => {});
    console.log("Posted to channel by", ctx.from.id, "sent_id", sent.message_id);
  } catch (e) {
    console.error("confirm failed:", e.message);
    await ctx.answerCallbackQuery({ text: `❌ ${e.message.slice(0, 90)}` });
  }
}

async function doEdit(ctx, keyRaw) {
  const r = getRedis();
  const key = await resolveKey(ctx, keyRaw);
  if (!key) {
    await ctx.answerCallbackQuery({ text: "📭 Draft မရှိသေးဘူး" });
    return;
  }
  const draft = await getDraft(key);
  if (!draft) {
    await ctx.answerCallbackQuery({ text: "📭 Draft မရှိတော့ဘူး" });
    return;
  }
  if (r) await r.set(`htech:editmode:${ctx.from.id}`, key, { ex: 1800 });
  await ctx.answerCallbackQuery({ text: "✏️ Text အသစ်ရိုက်ထည့်ပါ" });
  await ctx.reply(
    `✏️ Edit mode ON — အခု ရိုက်ထည့်တဲ့ text နဲ့ draft ပြောင်းပေးမယ် (/cancel နဲ့ ရပ်)\n\nအခုလက်ရှိ:\n${draft.text}`
  );
}

async function doReject(ctx, keyRaw) {
  const r = getRedis();
  const key = await resolveKey(ctx, keyRaw);
  if (key) await clearDraft(key);
  await ctx.answerCallbackQuery({ text: "Skipped" });
  await ctx.editMessageText("❌ Skipped — ဒီ draft ကို မတင်တော့ဘူး။").catch(() => {});
}

bot.on("callback_query:data", async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: "⛔ Admin only" });
    return;
  }
  const data = ctx.callbackQuery.data;

  if (data === "gen") return await generateAndSend(ctx, "manual");
  if (data === "status") return await menuStatus(ctx);
  if (data === "tpl_list") return await sendTplList(ctx);
  if (data === "tpl_add") {
    const kb = new InlineKeyboard();
    CATEGORY_KEYS.forEach((k, i) => {
      kb.text(TYPE_LABELS[k].split(" ")[0], `tpl_addtype:${k}`);
      if (i % 2 === 1) kb.row();
    });
    await ctx.answerCallbackQuery();
    return ctx.reply("➕ Template type ရွေးပါ:", { reply_markup: kb });
  }
  if (data.startsWith("tpl_addtype:")) {
    const type = data.split(":")[1];
    const r = getRedis();
    if (r) await r.set(`htech:pendingadd:${ctx.from.id}`, type, { ex: 1800 });
    await ctx.answerCallbackQuery();
    return ctx.reply(`📝 "${type}" template text ကို အခုပို့ပါ (multi-line ရနိုင်)`);
  }
  if (data.startsWith("confirm:")) return await doConfirm(ctx, data.slice(8));
  if (data.startsWith("edit:")) return await doEdit(ctx, data.slice(5));
  if (data.startsWith("reject:")) return await doReject(ctx, data.slice(7));

  await ctx.answerCallbackQuery();
});

// ------------------------------------------------------------------ text flows (edit-mode / add-template)

bot.on("message:text", async (ctx, next) => {
  if (!isAdmin(ctx)) return next();

  const r = getRedis();
  const adminId = ctx.from.id;
  const txt = ctx.message.text.trim();

  if (r) {
    const editKey = await r.get(`htech:editmode:${adminId}`);
    if (editKey) {
      if (txt.toLowerCase() === "/cancel") {
        await r.del(`htech:editmode:${adminId}`);
        return ctx.reply("Edit mode OFF — draft မပြောင်းတော့ဘူး။");
      }
      if (!txt.startsWith("/")) {
        await setDraft(editKey, txt);
        await r.del(`htech:editmode:${adminId}`);
        await pushDraft(editKey, txt, null);
        return ctx.reply("✅ Draft ပြောင်းပြီးပြီ — Confirm နှိပ်ပြီး တင်နိုင်ပါတယ်။");
      }
    }

    const pending = await r.get(`htech:pendingadd:${adminId}`);
    if (pending && !txt.startsWith("/")) {
      const data = await getTemplates();
      if (!data[pending]) data[pending] = [];
      data[pending].push(txt);
      await saveTemplates(data);
      await r.del(`htech:pendingadd:${adminId}`);
      return ctx.reply(`✅ Saved. "${pending}" #${data[pending].length}`);
    }
  }

  return next();
});

// ------------------------------------------------------------------ commands

bot.command("new", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  const parts = ctx.match.trim().split(/\s+/);
  const type = parts[0];
  if (!CATEGORY_KEYS.includes(type)) {
    return ctx.reply("Type ရွေးပါ: " + CATEGORY_KEYS.join(", "));
  }
  const text = parts.slice(1).join(" ").replace(/^"|"$/g, "").trim();
  if (!text) {
    const r = getRedis();
    if (r) await r.set(`htech:pendingadd:${ctx.from.id}`, type, { ex: 1800 });
    return ctx.reply(`📝 "${type}" template text ကို အခုပို့ပါ`);
  }
  const data = await getTemplates();
  if (!data[type]) data[type] = [];
  data[type].push(text);
  await saveTemplates(data);
  return ctx.reply(`✅ Saved. "${type}" #${data[type].length}`);
});

bot.command("list", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  const type = ctx.match.trim();
  const data = await getTemplates();
  if (!type || !data[type]) {
    const lines = CATEGORY_KEYS.map((k) => `${TYPE_LABELS[k]}: ${data[k]?.length || 0}`).join("\n");
    return ctx.reply(`📚 Templates:\n${lines}\n\n/list <type> နဲ့ ကြည့်`);
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
  if (!n || !data[type][n - 1]) return ctx.reply(`#${n} မရှိဘူး`);
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
  if (!n || !data[type][n - 1]) return ctx.reply(`#${n} မရှိဘူး`);
  const text = data[type][n - 1];
  try {
    await bot.api.sendMessage(CHANNEL_ID, text, { disable_web_page_preview: true });
    return ctx.reply(`✅ တိုက်ရိုက်တင်ပြီး "${type}" #${n}`);
  } catch (e) {
    return ctx.reply(`❌ ${e.message}`);
  }
});

// ------------------------------------------------------------------ status / templates

async function sendTplList(ctx) {
  const data = await getTemplates();
  const lines = CATEGORY_KEYS.map((k) => `${TYPE_LABELS[k]}: ${data[k]?.length || 0}`).join("\n");
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `📚 Templates\n\n${lines}\n\n/list <type> — detail\n/new <type> <text> — အသစ်ထည့်\n/post <type> <n> — ချက်ချင်းတင် (AI မပါ)`
  );
}

async function menuStatus(ctx) {
  const r = getRedis();
  const data = await getTemplates();
  const counts = CATEGORY_KEYS.map((k) => `${TYPE_LABELS[k]}: ${data[k]?.length || 0}`).join("\n");
  let draftLine = "none";
  let recentLine = "none";
  if (r) {
    const latest = await r.get(LATEST_KEY);
    if (latest) {
      const d = await getDraft(latest);
      draftLine = d ? `${latest} · ${d.text.length} chars` : latest;
    }
    const recent = (await r.lrange(RECENT_KEY, 0, -1)) || [];
    recentLine = recent.length ? recent.slice(-3).map((t) => t.slice(0, 60)).join("\n• ") : "none";
  }
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `📊 Status — ${mmStamp()}\n\n` +
      `Channel: ${CHANNEL_ID || "❌ not set"}\n` +
      `Storage: ${r ? "Redis ✅" : "Redis ❌"}\n` +
      `Admins: ${ADMIN_IDS.join(", ")}\n` +
      `Schedule: 09:00 + 18:00 (Myanmar)\n\n` +
      `Templates:\n${counts}\n\n` +
      `Pending draft: ${draftLine}\n` +
      `Recent posted:\n• ${recentLine}`
  );
}

bot.command("status", async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply("⛔ Admin ပဲ သုံးလို့ရပါတယ်");
  await menuStatus(ctx);
});

// ------------------------------------------------------------------ ui

bot.api
  .setMyCommands([
    { command: "menu", description: "📋 Menu (generate / confirm / edit)" },
    { command: "draft", description: "🤖 AI draft အသစ်ရေးပါ" },
    { command: "status", description: "📊 Status ကြည့်ပါ" },
    { command: "list", description: "📚 Templates ကြည့်ပါ" },
    { command: "new", description: "➕ Template အသစ်ထည့်ပါ" },
  ])
  .catch((e) => console.error("setMyCommands:", e.message));

module.exports = {
  bot,
  CHANNEL_ID,
  ADMIN_IDS,
  getRedis,
  draftKey,
  slotKeyForNow,
  setDraft,
  clearDraft,
  getDraft,
  pushDraft,
  recentPosts,
  DEFAULT_TEMPLATES,
};