// api/cron.js — Vercel Cron.
// At 09:00 and 18:00 (Myanmar time) generates an AI draft and sends it to the
// admins for approval. Nothing is auto-posted — the admin must press ✅ Confirm.
const { generateDraftWithRetry } = require("./ai");
const { getRedis, pushDraft, setDraft, clearDraft, recentPosts } = require("./bot");

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_ID || "")
  .split(",")
  .map((id) => parseInt(id.trim(), 10))
  .filter((n) => Number.isFinite(n));

function mmNow() {
  return new Date(Date.now() + (6 * 60 + 30) * 60000);
}

function currentSlot() {
  const z = mmNow();
  const h = z.getUTCHours();
  const date = z.toISOString().slice(0, 10);
  if (h === 9) return { label: "09", key: `htech:draft:${date}:09`, am: true };
  if (h === 18) return { label: "18", key: `htech:draft:${date}:18`, am: false };
  return null;
}

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const slot = currentSlot();
  if (!slot) {
    return res.json({ ok: true, action: "not-a-post-slot" });
  }

  const redis = getRedis();
  if (redis) {
    try {
      const claimed = await redis.set(`htech:slot:${slot.key}`, String(Date.now()), {
        nx: true,
        ex: 86400,
      });
      if (!claimed) {
        return res.json({ ok: true, action: "already-claimed", slot: slot.key });
      }
    } catch (e) {
      console.error("slot claim failed:", e.message);
    }
  }

  try {
    const recent = await recentPosts();
    const text = await generateDraftWithRetry({ am: slot.am, avoid: recent });
    await setDraft(slot.key, text);
    await pushDraft(slot.key, text, slot.label);
    return res.json({
      ok: true,
      action: "draft-sent",
      slot: slot.key,
      to: ADMIN_IDS.length,
    });
  } catch (e) {
    console.error("cron draft failed:", e.message);
    const { Bot } = require("grammy");
    const bot = new Bot(TOKEN);
    for (const a of ADMIN_IDS) {
      await bot.api
        .sendMessage(a, `⚠️ AI draft မရေးနိုင်ဘူး (${slot.label}):\n${String(e.message).slice(0, 200)}`)
        .catch(() => {});
    }
    return res.status(502).json({ ok: false, error: e.message });
  }
};