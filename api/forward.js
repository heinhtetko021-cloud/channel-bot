// api/forward.js — Forwarder-bot tick.
// Triggered hourly (GitHub Actions) to share ONE post, rotating through the
// newest FORWARD_WINDOW posts of @h_tech_studio, copied to all target groups.
// Guarded by a Redis lock so overlapping triggers never double-share.
const { bot, getRedis, CHANNEL_ID } = require("./bot");
const {
  FWD_LAST_KEY,
  FWD_STATS_KEY,
  FWD_LOCK_KEY,
  getPosts,
  pickNext,
  shareRecord,
} = require("./fwd");

const GROUPS = (process.env.GROUPS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (process.env.FORWARD_ENABLED !== "1" && process.env.FORWARD_ENABLED !== "true") {
    return res.json({ ok: true, action: "forward-disabled" });
  }
  if (!GROUPS.length) {
    return res.json({ ok: true, action: "no-groups" });
  }

  const redis = getRedis();
  if (!redis) {
    return res.status(500).json({ ok: false, error: "redis not configured" });
  }

  try {
    const lock = await redis.incr(FWD_LOCK_KEY);
    if (lock === 1) await redis.expire(FWD_LOCK_KEY, 60);
    if (lock > 1) return res.json({ ok: true, action: "locked" });
  } catch (e) {
    console.error("forward lock:", e.message);
  }

  let posts = [];
  try {
    posts = await getPosts(redis);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
  if (!posts.length) {
    return res.json({ ok: true, action: "no-posts" });
  }

  const seq = posts.slice().reverse();
  let lastId = null;
  try {
    const raw = await redis.get(FWD_LAST_KEY);
    if (raw !== null && raw !== undefined) lastId = Number(raw);
  } catch (e) {
    console.error("forward last_read:", e.message);
  }

  const pick = pickNext(seq, lastId);
  if (!pick) {
    return res.json({ ok: true, action: "no-pick" });
  }

  try {
    const summary = await shareRecord(bot, pick, posts, GROUPS, CHANNEL_ID);
    await redis.set(FWD_LAST_KEY, pick.message_id);
    await redis.incr(FWD_STATS_KEY).catch(() => {});
    return res.json({
      ok: true,
      action: "forwarded",
      shared: { message_id: pick.message_id, media_group_id: pick.media_group_id },
      ...summary,
    });
  } catch (e) {
    console.error("forward failed:", e.message);
    return res.status(502).json({ ok: false, error: e.message });
  }
};