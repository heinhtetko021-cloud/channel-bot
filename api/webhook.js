// Vercel Node.js serverless webhook for the Telegram bot.
// Custom adapter for Vercel's (req, res); also captures the bot's reply text
// so it is returned in the HTTP response for verification.
const { webhookCallback } = require("grammy");
const { bot } = require("./bot");

// Capture the latest outbound sendMessage so we can echo the reply back and,
// more importantly, confirm the bot actually produced a reply for a command.
let lastReply = "";
let capture = false;
bot.api.config.use((prev, method, payload, signal) => {
  if (capture && method === "sendMessage" && payload && payload.text) {
    lastReply = payload.text;
  }
  return prev(method, payload, signal);
});

function vercelAdapter(req, res) {
  let resolveResponse;
  return {
    get update() {
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
      if (resolveResponse) resolveResponse("");
    },
    respond: () => {
      if (resolveResponse) resolveResponse("");
    },
    unauthorized: () => {
      if (resolveResponse) resolveResponse("unauthorized");
    },
    handlerReturn: new Promise((resolve) => {
      resolveResponse = resolve;
    }),
  };
}

const handler = webhookCallback(bot, vercelAdapter);

module.exports = async function (req, res) {
  res.setHeader("content-type", "text/plain");
  lastReply = "";
  capture = true;
  const failsafe = setTimeout(() => {
    if (!res.writableEnded) {
      res.statusCode = 200;
      res.end(lastReply ? "REPLY: " + lastReply : "ok");
    }
  }, 24000);

  try {
    await handler(req, res);
    if (!res.writableEnded) {
      res.statusCode = 200;
      res.end(lastReply ? "REPLY: " + lastReply : "ok");
    }
  } catch (err) {
    console.error("Webhook error:", err && err.stack ? err.stack : err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.end("ERR: " + String(err && err.message ? err.message : err));
    }
  } finally {
    clearTimeout(failsafe);
    capture = false;
  }
};
