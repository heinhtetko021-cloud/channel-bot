// Vercel Node.js serverless webhook for the Telegram bot.
const { webhookCallback } = require("grammy");
const { bot } = require("./bot");

// Custom adapter bridging grammY to Vercel's native Node (req, res) signature.
function vercelAdapter(req, res) {
  let resolveResponse;
  return {
    get update() {
      // Collect the raw request body then parse as JSON.
      return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
          data += chunk;
          if (data.length > 1e6) req.destroy();
        });
        req.on("end", () => {
          if (!data) return resolve({});
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
        req.on("error", reject);
      });
    },
    header: req.headers["x-telegram-bot-api-secret-token"],
    end: () => {
      if (resolveResponse) resolveResponse("ok");
    },
    respond: (json) => {
      if (resolveResponse) resolveResponse(JSON.stringify(json));
    },
    unauthorized: () => {
      if (resolveResponse) resolveResponse('"unauthorized"');
    },
    handlerReturn: new Promise((resolve) => {
      resolveResponse = resolve;
    }),
  };
}

const handler = webhookCallback(bot, vercelAdapter);

module.exports = async function (req, res) {
  // Absolute failsafe: never leave Vercel waiting (would cause 500/timeouts).
  const failsafe = setTimeout(() => {
    res.statusCode = 200;
    res.setHeader("content-type", "text/plain");
    if (!res.writableEnded) res.end("ok");
  }, 9000);

  try {
    const result = await handler(req, res);
    const isUnauthorized = result === '"unauthorized"';
    // If grammY replied via the webhook (respond()), send that reply body back
    // to Telegram. Otherwise just acknowledge with "ok".
    const body = isUnauthorized ? '"unauthorized"' : (typeof result === "string" && result !== "ok" ? result : "ok");
    res.statusCode = isUnauthorized ? 401 : 200;
    res.setHeader("content-type", "application/json");
    if (!res.writableEnded) res.end(body);
  } catch (err) {
    console.error("Webhook error:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    if (!res.writableEnded) {
      res.end(JSON.stringify({ error: String(err && err.message ? err.message : err) }));
    }
  } finally {
    clearTimeout(failsafe);
  }
};
