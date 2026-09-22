// H-Tech Studio — Music Player Bot webhook (Vercel Node adapter)
const { bot } = require("./bot");

module.exports = async function handler(req, res) {
  let update;
  try {
    update = await req.json();
  } catch (e) {
    res.statusCode = 200;
    res.end("ok");
    return;
  }

  try {
    await Promise.race([bot.handleUpdate(update), new Promise((r) => setTimeout(r, 60 * 1000))]);
  } catch (e) {
    console.error("handleUpdate error:", e);
  } finally {
    if (!res.writableEnded) {
      res.statusCode = 200;
      res.end("ok");
    }
  }
};
