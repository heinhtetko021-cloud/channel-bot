// H-Tech Studio — Music Player Bot (Inbox Audio Player)
// Pre-built saleable product. `/play <song>` → search → pick → send audio → plays in Telegram's own player.
// Free, keyless song search via Saavn/JioSaavn public API. Deployable on Vercel (no extra account).

const { Bot, InlineKeyboard } = require("grammy");
const crypto = require("crypto");

// ============================================================
// CUSTOMIZE HERE — config
// ============================================================
const CONFIG = {
  BOT_NAME: "MusicBot",
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID,   // owner support chat (number)
  SUPPORT_LINK: "t.me/hein_public_ai_bot",
  // Free Saavn/JioSaavn public API (no key). Swap base URL if provider changes.
  SEARCH_API: "https://saavn.dev/api/search/songs?query=",
  MAX_RESULTS: 5,
};

const bot = new Bot(CONFIG.BOT_TOKEN);

// short-lived stores (in-memory).
const pickStore = new Map();   // token -> songs[]
const userToken = new Map();   // userid -> token
function cleanup() {
  const now = Date.now();
  for (const [t, v] of pickStore) {
    if (v._ts && now - v._ts > 10 * 60 * 1000) pickStore.delete(t);
  }
}
setInterval(cleanup, 60 * 1000).unref?.();

// ============================================================
// Saavn helpers
// ============================================================
async function searchSongs(query) {
  const url = CONFIG.SEARCH_API + encodeURIComponent(query);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error("search " + res.status);
  const data = await res.json();
  const results = (data?.data?.results) || (data?.results) || [];
  return results.slice(0, CONFIG.MAX_RESULTS);
}

function pickAudio(song) {
  const list = song?.downloadUrl || song?.download_url || [];
  const preferred = ["320kbps", "160kbps", "128kbps", "96kbps"];
  for (const p of preferred) {
    const hit = list.find((x) => String(x.quality || x.bitrate || "").includes(p));
    if (hit) return hit.url || hit.link;
  }
  const first = list[0];
  return first ? (first.url || first.link) : null;
}

function toPick(song) {
  return {
    name: song?.name || "Unknown",
    artists: song?.artists?.primary?.[0]?.name || song?.primaryArtists || song?.singers || "",
    audio: pickAudio(song),
  };
}

// ============================================================
// /start /help
// ============================================================
bot.command("start", (ctx) =>
  ctx.reply(
    `🎵 ${CONFIG.BOT_NAME} — ဘယ် song မဆို ရှာ → ရွေး → Telegram မှာ ဖွင့်လို့ရတယ်!\n\n` +
    `/play <song name> — သီချင်းရှာ\n\n` +
    `ဥပမာ: /play kelvin\n\n` +
    `⚙️ ပြဿနာရှိရင် ${CONFIG.SUPPORT_LINK}`
  )
);

bot.command("help", (ctx) => ctx.reply("=>  /play <song> ဆိုပြီး ရိုက်ပါ။ ဥပမာ  /play myanmar classic"));

// ============================================================
// /play /song — search → inline results
// ============================================================
bot.command(["play", "song"], async (ctx) => {
  const query = (ctx.match || "").trim();
  if (!query) return ctx.reply("သီချင်းနာမည်ရေးပါ: /play <song name>");

  await ctx.replyWithChatAction("typing").catch(() => {});
  try {
    const songs = await searchSongs(query);
    if (!songs.length) return ctx.reply("မတွေ့ဘူး 😕 — နာမည် / အဆိုတော် အပြည့်ထည့်ကြည့်ပါ။");

    const kb = new InlineKeyboard();
    songs.forEach((s, i) => {
      const label = `${String.fromCharCode(65 + i)}. ${s.name || "?"}`.slice(0, 40);
      kb.text(label, "pick:" + i).row();
    });

    const token = crypto.randomBytes(4).toString("hex");
    const items = songs.map((s) => ({ ...toPick(s), _ts: Date.now() }));
    pickStore.set(token, items);
    userToken.set(ctx.from.id, token);

    await ctx.reply(`🎶 "${query}" အတွက် ရလာတာတွေ — ရွေးပါ:`, { reply_markup: kb });
  } catch (e) {
    await ctx.reply("ရှာဖို့ error ဖြစ်သွားတယ် 😕 — နောက်ကြာ ကြိုးစားပါ။");
    notifyAdmin(e);
  }
});

// ============================================================
// Callback pick
// ============================================================
bot.callbackQuery(/pick:(\d+)/, async (ctx) => {
  const idx = parseInt(ctx.match[1], 10);
  const token = userToken.get(ctx.from.id);
  const songs = token ? pickStore.get(token) : null;
  const song = songs && songs[idx];
  if (!song || !song.audio) {
    await ctx
      .answerCallbackQuery("Song expire ဖြစ်သွားတယ် — /play နဲ့ ပြန်ရှာပါ")
      .catch(() => {});
    return;
  }

  await ctx.answerCallbackQuery("Downloading...").catch(() => {});
  try {
    await ctx.editMessageText(`⬇ ရနေပြီ... ${song.name} 🎧`).catch(() => {});
    const cap = `🎵 ${song.name}\n👤 ${song.artists || "Unknown"}\n\n🔗 ${CONFIG.SUPPORT_LINK}`;
    try {
      await ctx.replyWithAudio(song.audio, {
        title: song.name,
        performer: song.artists || "",
        caption: cap,
      });
    } catch (err) {
      const buf = await fetch(song.audio).then((r) => r.arrayBuffer());
      await ctx.replyWithAudio(new Uint8Array(buf), {
        title: song.name,
        performer: song.artists || "",
        caption: cap,
      });
    }
  } catch (e) {
    await ctx
      .editMessageText("ဖွင့်လို့မရဘူး 😕 — ဒီ song ကို ရနိုင်မှဖြစ်မှာမို့ နောက်တစ်ခု ကြိုးစားပါ။")
      .catch(() => {});
    notifyAdmin(e);
  }
});

// ============================================================
// DM fallback
// ============================================================
bot.on("message:text", (ctx) => {
  if (ctx.chat.type === "private" && !/^\//.test(ctx.message.text)) {
    ctx.reply(`"${ctx.message.text}" ရှာမလား?  /play ${ctx.message.text} ဆိုပြီး ရိုက်ပါ`);
  }
});

// ============================================================
function notifyAdmin(err) {
  if (!CONFIG.ADMIN_CHAT_ID) return;
  bot.api
    .sendMessage(String(CONFIG.ADMIN_CHAT_ID), `⚠️ MusicBot error:\n${String(err?.message || err).slice(0, 400)}`)
    .catch(() => {});
}

bot.catch((err) => {
  console.error("bot error", err.error);
  notifyAdmin(err.error);
});

module.exports = { bot, CONFIG, searchSongs, pickAudio };
