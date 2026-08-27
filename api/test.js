// Temp diagnostic: directly test grammY sendMessage to the channels.
const { Bot } = require("grammy");
const { channels } = require("./bot");

module.exports = async function (req, res) {
  const bot = new Bot(process.env.BOT_TOKEN);
  const results = [];
  for (const ch of channels) {
    try {
      const r = await bot.api.sendMessage(ch, "grammy direct test " + Date.now(), {
        disable_web_page_preview: true,
      });
      results.push({ channel: ch, type: typeof ch, ok: true, id: r.message_id });
    } catch (e) {
      results.push({ channel: ch, type: typeof ch, ok: false, error: e.description || e.message, code: e.error_code });
    }
  }
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(results));
};
