/**
 * Vercel webhook handler for the grammY bot.
 *
 * How it works:
 * 1. Receives raw POST from Telegram's setWebhook.
 * 2. Parses JSON body.
 * 3. Passes it to bot.handleUpdate().
 * 4. Returns 200 immediately (Telegram requires fast responses).
 * 5. Uses a failsafe timeout to avoid Vercel function crashes.
 */

const bot = require("./bot");

module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Failsafe: ensure we respond within the function timeout
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(200).json({ ok: true, timeout: true });
    }
  }, 8000); // 8 seconds (under Vercel's 10s maxDuration)

  try {
    // Parse the raw body
    const body = await req.json();

    // Handle the update with grammY
    // bot.handleUpdate returns a promise; we don't await it here
    // to return 200 to Telegram as fast as possible
    bot.handleUpdate(body).catch((err) => {
      console.error("handleUpdate error:", err.message);
    });

    // Respond immediately — Telegram expects < 5s
    clearTimeout(timeout);
    return res.status(200).json({ ok: true });
  } catch (err) {
    clearTimeout(timeout);
    console.error("Webhook parse error:", err.message);
    // Still return 200 so Telegram doesn't retry endlessly
    return res.status(200).json({ ok: true, error: "parse_error" });
  }
};
