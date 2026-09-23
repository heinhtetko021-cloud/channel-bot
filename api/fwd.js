// Shared helpers for the forwarder-bot: record channel posts into a Redis
// window and share them to the target groups via Bot API copies.
const FWD_POSTS_KEY = "htech:fwd:posts";
const FWD_LAST_KEY = "htech:fwd:last_shared";
const FWD_STATS_KEY = "htech:fwd:shared_count";
const FWD_LOCK_KEY = "htech:fwd:lock";

function describeMessage(msg) {
  const rec = {
    message_id: msg.message_id,
    date: msg.date || 0,
    media_group_id: msg.media_group_id || null,
    text: (msg.text || msg.caption || "").slice(0, 4096),
  };
  if (msg.photo && msg.photo.length) {
    const p = msg.photo[msg.photo.length - 1];
    rec.media = { type: "photo", file_id: p.file_id };
  } else if (msg.video) {
    rec.media = { type: "video", file_id: msg.video.file_id };
  } else if (msg.animation) {
    rec.media = { type: "animation", file_id: msg.animation.file_id };
  } else if (msg.document) {
    rec.media = { type: "document", file_id: msg.document.file_id };
  }
  return rec;
}

async function upsertPost(redis, rec, window) {
  let arr = [];
  try {
    arr = (await redis.lrange(FWD_POSTS_KEY, 0, -1)) || [];
    arr = arr
      .map((s) => {
        try {
          return JSON.parse(s);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter((p) => p.message_id !== rec.message_id);
  } catch (e) {
    console.error("upsertPost lrange:", e.message);
  }
  arr.unshift(rec);
  const trimmed = arr.slice(0, window);
  try {
    await redis.del(FWD_POSTS_KEY);
    if (trimmed.length) {
      await redis.rpush(FWD_POSTS_KEY, ...trimmed.map((p) => JSON.stringify(p)));
    }
  } catch (e) {
    console.error("upsertPost write:", e.message);
  }
}

async function getPosts(redis) {
  const arr = (await redis.lrange(FWD_POSTS_KEY, 0, -1)) || [];
  return arr
    .map((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// seq is oldest -> newest. lastId provided -> next in line; if missed -> newest.
function pickNext(seq, lastId) {
  if (!seq.length) return null;
  if (lastId == null) return seq[seq.length - 1];
  const i = seq.findIndex((p) => p.message_id === lastId);
  return i >= 0 ? seq[(i + 1) % seq.length] : seq[seq.length - 1];
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function shareRecord(bot, rec, posts, groups, channelId) {
  const album = rec.media_group_id
    ? posts.filter((p) => p.media_group_id === rec.media_group_id && p.media)
    : [];
  const isAlbum = album.length > 1;
  const ok = [];
  const fail = [];

  for (const g of groups) {
    try {
      if (isAlbum) {
        const media = album.map((m) => ({ type: m.media.type, media: m.media.file_id }));
        if (rec.text) media[0].caption = rec.text;
        await bot.api.sendMediaGroup(g, media);
      } else {
        await bot.api.copyMessage(g, channelId, rec.message_id, {
          disable_web_page_preview: true,
        });
      }
      ok.push(g);
    } catch (e) {
      fail.push({ g, err: e.message });
    }
    await sleep(80);
  }
  return { method: isAlbum ? "media_group" : "copy", ok, fail };
}

module.exports = {
  FWD_POSTS_KEY,
  FWD_LAST_KEY,
  FWD_STATS_KEY,
  FWD_LOCK_KEY,
  describeMessage,
  upsertPost,
  getPosts,
  pickNext,
  shareRecord,
};