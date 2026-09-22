// H-Tech Studio — AI Partner Bot webhook (Vercel Node adapter)
// Parses the raw body, returns 200 immediately, runs handleUpdate in background.

const { bot } = require("./bot");

module.exports = async function handler(req, res) {
  let update;
  try {
    const raw = await req.json();
    update = raw;
  } catch (e) {
    res.statusCode = 200;
    res.end("ok");
    return;
  }

  try {
    await Promise.race([
      bot.handleUpdate(update),
      new Promise((r) => setTimeout(r, 30000)),
    ]);
  } catch (e) {
    console.error("handleUpdate error:", e);
  } finally {
    if (!res.writableEnded) {
      res.statusCode = 200;
      res.end("ok");
    }
  }
};
