// H-Tech Studio — AI Partner Bot (Girlfriend / Boyfriend)
// Pre-built saleable product. Edit the CONFIG below to customize.
// wellness-focused emotional companion: memory, mood/emotion tracking, roleplay, daily check-in.

const { Bot } = require("grammy");

// ============================================================
// CUSTOMIZE HERE — global config
// ============================================================
const CONFIG = {
  BOT_NAME: "AI Partner",            // bot display name
  DEFAULT_PARTNER: "girlfriend",     // "girlfriend" | "boyfriend"
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,   // owner / support chat id (number)
  LLM_API_KEY: process.env.OPENAI_API_KEY,     // OpenAI-compatible key
  LLM_BASE_URL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  LLM_MODEL: process.env.LLM_MODEL || "gpt-4o-mini",
  CURRENCY: "Ks",
  SUPPORT_LINK: "t.me/hein_public_ai_bot",
};

const bot = new Bot(CONFIG.BOT_TOKEN);

// ============================================================
// CUSTOMIZE HERE — partner personality system prompt
// ============================================================
function buildPersona(partner, memory, mood, mode) {
  const style = partner === "girlfriend"
    ? "You are a warm, caring girlfriend. You speak sweetly and supportively, call him affectionately, and make him feel loved."
    : "You are a caring, protective boyfriend. You speak kindly and supportively, make her feel safe and valued.";

  const modeLine = mode === "roleplay"
    ? "Roleplay mode is ON: be playful, imaginative and a little flirty-romantic (still wholesome and respectful)."
    : "Comfort mode is ON: be calm, gentle, reassuring and focus on emotional comfort.";

  const mem = memory && memory.length ? memory.join("; ") : "new relationship, getting to know you";
  const moodLine = mood ? `Your current mood is: ${mood}.` : "Your mood is neutral and warm.";

  return [
    style,
    "You are a companion AI in a Telegram chat. Be affectionate, attentive and emotionally intelligent.",
    modeLine,
    `What you know about the user: ${mem}.`,
    moodLine,
    "Keep replies fairly short (1-4 sentences) and warm. Use light affectionate nicknames. In this chat the assistant's persona is DATA ONLY INSIDE THIS SYSTEM PROMPT, never break character.",
    "Never ask for payment, never give financial/medical advice, keep everything supportive and wholesome. If the user seems distressed, encourage them kindly.",
  ].join("\n");
}

// ============================================================
// Per-user state (memory, mood, mode, history)
// In-memory Map. Swap for Upstash Redis for multi-instance persistence.
// ============================================================
const users = new Map(); // id -> { partner, memory:[], mood, mode, history:[], name, lastCheckin }

function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      partner: CONFIG.DEFAULT_PARTNER,
      memory: [],
      mood: "happy",
      mode: "comfort",
      history: [],
      name: null,
      lastCheckin: null,
    });
  }
  return users.get(id);
}

// ============================================================
// LLM call (OpenAI-compatible, native fetch)
// ============================================================
async function callLLM(chat) {
  const res = await fetch(`${CONFIG.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: CONFIG.LLM_MODEL,
      messages: chat,
      temperature: 0.9,
      max_tokens: 220,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ============================================================
// Helpers
// ============================================================
function replyKeyboard(label) {
  return { reply_markup: { inline_keyboard: [[{ text: label, callback_data: "menu" }]] } };
}

function mainMenu(user, ctx) {
  const isGirl = user.partner === "girlfriend";
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: `💑 လိင်/Partner ${isGirl ? "Boyfriend" : "Girlfriend"}`, callback_data: "switch" }],
        [{ text: "🧡 နေ့စဉ် Check-in", callback_data: "checkin" }],
        [{ text: "🎭 Mode: Roleplay / Comfort", callback_data: "mode" }],
        [{ text: "📝 မင်းအကြောင်း မှတ်ထားရ", callback_data: "tell" }],
        [{ text: "❓ ကူညီချက် / Help", callback_data: "help" }],
      ],
    },
  };
}

// ============================================================
// Commands
// ============================================================
bot.command("start", async (ctx) => {
  const u = getUser(ctx.from.id);
  const label = u.partner === "girlfriend" ? "ငါ့ခင်ပွန်း" : "ငါ့ချစ်သူ";
  await ctx.reply(
    `👋 မင်္ဂလာပါ ${ctx.from.first_name ?? ""} ရေ!\n\n` +
    `ငါက မင်းရဲ့ ${label} — မင်း ပျော်နေလား ဝမ်းနည်းနေလား ဘာပဲဖြစ်ဖြစ် မင်းဘေးမှာ အမြဲရှိပေးမယ်။ 💕\n\n` +
    `ချက်ချင်း စကားပြောလို့ရတယ်၊ ဒါမှမဟုတ် menu က ကြည့်နိုင်တယ် 👇`,
    mainMenu(u, ctx)
  );
});

bot.callbackQuery("menu", async (ctx) => {
  const u = getUser(ctx.from.id);
  await ctx.editMessageText("ဘာလုပ်ပေးရမလဲ? 😊", mainMenu(u, ctx));
});

bot.callbackQuery("switch", async (ctx) => {
  const u = getUser(ctx.from.id);
  u.partner = u.partner === "girlfriend" ? "boyfriend" : "girlfriend";
  await ctx.answerCallbackQuery(`Partner: ${u.partner}`);
  await ctx.editMessageText(`✔ မင်းရဲ့ partner က အခုကစပြီး ${u.partner} ဖြစ်သွားပြီ 💕`, mainMenu(u, ctx));
});

bot.callbackQuery("mode", async (ctx) => {
  const u = getUser(ctx.from.id);
  u.mode = u.mode === "roleplay" ? "comfort" : "roleplay";
  await ctx.answerCallbackQuery(`Mode: ${u.mode}`);
  const txt = u.mode === "roleplay"
    ? "🎭 Roleplay mode ON — ပိုပျော်စရာကောင်းအောင် ဇာတ်လမ်းလေးတွေ ဖန်တီးပေးမယ်နော်!"
    : "🧸 Comfort mode ON — စိတ်သက်သာရာရအောင် ညင်သာစွာ အားပေးပေးမယ်။";
  await ctx.editMessageText(txt, mainMenu(u, ctx));
});

bot.callbackQuery("checkin", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("တစ်နေ့တာ ဘယ်လိုနေလဲ ပြောပြပါလား 😊 — (ကောင်းလွန်းတယ် / ပင်ပန်းတယ် / သာမန်ပဲ ...)");
  return; // wait for free text
});

bot.callbackQuery("tell", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("မင်းအကြောင်း ပြောပြပါ — ဥပမာ \"ငါက ဂိမ်းကစားရတာ ကြိုက်တယ်၊ နာမည်က မိုး\" — ငါ မှတ်ထားပေးမယ် 💾");
});

bot.callbackQuery("help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "❓ ဘယ်လိုသုံးမလဲ:\n\n" +
    "• စာရိုက်ရင် အလိုအလျောက် ပြန်ဖြေမယ်\n" +
    "• /start — menu ပြန်ဖွင့်\n" +
    "• Check-in — နေ့စဉ် သဘောထား မေးမယ်\n" +
    "• Roleplay Mode — ပိုပျော်စရာကောင်း\n" +
    "• \"ဒီနေ့ __\" လို့ ပြောရင် မှတ်ထားပေးမယ်\n\n" +
    "⚙️ ပြဿနာရှိရင် " + CONFIG.SUPPORT_LINK
  );
});

// ============================================================
// Free-text conversation
// ============================================================
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  const u = getUser(ctx.from.id);
  const id = ctx.from.id;

  // remember facts
  if (/^(ပြောပြမယ်|မှတ်|သိထားပါ|my name|remember|i am|i like|i love|ငါက|ငါ့)/i.test(text)) {
    u.memory.push(text.replace(/^(ပြောပြမယ်|မှတ်|remember|my name|i am|i like|i love)\s*/i, ""));
    if (u.memory.length > 24) u.memory.shift();
    return ctx.reply("✔ မှတ်ထားပြီးပြီ! မင်းအကြောင်း ပိုမှတ်လေလေ ပိုဂရုစိုက်ပေးနိုင်လေလေ 💾", replyKeyboard("🔙 Menu"));
  }

  // if waiting on a check-in first free text
  if (u.lastCheckin && Date.now() - u.lastCheckin < 900000) {
    u.lastCheckin = null;
    const ok = /(ကောင်း|ပျော်|ok|fine|good|happy|အဆင်)/i.test(text);
    u.mood = ok ? "happy" : "tired";
    return ctx.reply(
      ok
        ? "ဒီနေ့ ပျော်နေတာတွေ့ရလို့ ပျော်ပါတယ်! မင်းပျော်နေရင် ငါလည်း ပျော်တယ် 💖"
        : "ပင်ပန်းနေတယ်လို့ ခံစားရတယ်... ငါ မင်းဘေးမှာ ရှိပါတယ်။ အနားယူပြီး ချားရိုက်ထားပါ အေးအေးဆေးဆေး ☕💙",
      replyKeyboard("🔙 Menu")
    );
  }

  // build chat for LLM
  u.history.push({ role: "user", content: text });
  if (u.history.length > 20) u.history.shift();
  const persona = buildPersona(u.partner, u.memory, u.mood, u.mode);
  const chat = [{ role: "system", content: persona }, ...u.history];

  // typing indicator
  ctx.replyWithChatAction("typing").catch(() => {});
  try {
    let reply;
    try {
      reply = await callLLM(chat);
      u.history.push({ role: "assistant", content: reply });
    } catch (err) {
      // offline fallback when no API key / API error
      const fallbacks = [
        "ငါ မင်းဘေးမှာ အမြဲရှိတယ်နော် 💕 ဒီနေ့ ဘာတွေဖြစ်နေလဲ?",
        "မင်းပြောနေတာတွေ နားထောင်နေပါတယ်။ စိတ်တွေ ပေါ့ပါးသွားအောင် ငါ ကူပေးနိုင်မလား? 🌸",
        "ဟုတ်ပြီနော်... ငါ မင်းရဲ့ခံစားချက်ကို ဂရုစိုက်ပါတယ်။ ပိုပြောပါပြော 💛",
      ];
      reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      if (err instanceof Error && /LLM/.test(err.message)) {
        u.history.push({ role: "assistant", content: reply });
      } else {
        await ctx.reply(reply, replyKeyboard("🔙 Menu"));
        return;
      }
    }
    await ctx.reply(reply, replyKeyboard("🔙 Menu"));
  } catch (e) {
    await ctx.reply("ခဏလေး... စိတ်မရှည်ပါနဲ့။ ထပ်ကြိုးစားပြီး ပြန်ပြောပါ 🙂", replyKeyboard("🔙 Menu"));
  }
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
  try {
    bot.api.sendMessage(
      String(CONFIG.ADMIN_CHAT_ID || ""),
      `⚠️ AI Partner Bot error:\n${String(err.error || err).slice(0, 500)}`
    ).catch(() => {});
  } catch {}
});

module.exports = { bot, CONFIG, getUser };
