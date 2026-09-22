/**
 * Vercel webhook adapter — raw request handler for grammY on Vercel Node.
 *
 * grammY's default webhook adapter does NOT work reliably on Vercel's
 * serverless functions, so we manually parse the request, hand the update
 * to bot.handleUpdate(), and respond immediately with HTTP 200.
 */
const { bot } = require("./bot");

/**
 * Process a single Telegram update against the bot.
 * Runs in the background with a failsafe timeout so the function
 * never exceeds Vercel's execution limits while waiting on bot work.
 */
async function processUpdate(update) {
  await Promise.race([
    bot.handleUpdate(update).catch((err) => {
      console.error("[webhook] handleUpdate error:", err.message || err);
    }),
    new Promise((resolve) => {
      // Failsafe: never wait longer than 5s on background work
      setTimeout(() => {
        console.warn("[webhook] Processing timeout — update may be partially handled");
        resolve();
      }, 5000);
    }),
  ]);
}

/**
 * Standard Vercel handler exported from this module.
 * When vercel.json rewrites `/(.*)` to `/api/bot`, the runtime invokes
 * the handler exported from bot.js (see bot.js exports at the bottom),
 * which delegates back here. You can also route directly to this file.
 */
async function handler(req, res) {
  // Only accept POST requests (Telegram sends webhooks as POST)
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Parse the raw Telegram update from the request body
    const update = await req.json();

    // Respond 200 immediately — Telegram requires a fast response.
    // Processing continues in the background.
    res.status(200).json({ ok: true });

    await processUpdate(update);
  } catch (err) {
    // JSON parsing failure or other top-level error
    console.error("[webhook] Request processing error:", err.message || err);
    // Always return 200 to Telegram even on our own errors
    if (!res.headersSent) {
      res.status(200).json({ ok: true });
    }
  }
}

module.exports = handler;
