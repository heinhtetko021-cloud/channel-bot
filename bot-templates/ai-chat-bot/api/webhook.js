/**
 * H-Tech Studio — Vercel webhook adapter for grammY
 *
 * Flow:
 *   1. Telegram sends POST to this endpoint.
 *   2. We parse the body and hand it to bot.handleUpdate().
 *   3. We return HTTP 200 IMMEDIATELY (Telegram requires fast responses).
 *   4. The actual AI call + reply happens in the background.
 *
 * IMPORTANT: Vercel Serverless Functions have a response-time budget.
 *            We must send 200 back within ~5 s. The AI call can take up
 *            to 20 s, so we run it detached from the response path.
 */

const bot = require("./bot");

module.exports = async function handler(req, res) {
  // Only accept POST (Telegram sends updates as POST)
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = await req.json();

    // Return 200 immediately — do NOT await the AI call
    res.status(200).json({ ok: true });

    // Run handleUpdate in the background (detached promise)
    // This lets the AI call complete without blocking the response.
    bot.handleUpdate(body).catch((err) => {
      console.error("[webhook] handleUpdate error:", err);
    });
  } catch (err) {
    console.error("[webhook] parse error:", err);
    // Still return 200 so Telegram doesn't retry
    if (!res.headersSent) {
      res.status(200).json({ ok: true });
    }
  }
};
