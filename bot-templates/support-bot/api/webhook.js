// ============================================================================
// H-Tech Studio - Telegram Support Bot : Vercel Webhook handler
// ----------------------------------------------------------------------------
// grammY's default `webhookCallback` can fail on Vercel Node because of how
// the request body is buffered/streamed — so we use a CUSTOM vercelAdapter.
//
//   1) Awaits `req.json()` to read the raw Telegram update body,
//   2) Calls `bot.handleUpdate(update)` directly,
//   3) Returns an HTTP 200 immediately (so Telegram retries don't pile up),
//   4) Has a failsafe timeout so the function always returns within limits,
//      and never 500s on a null/unconfigured bot.
// ============================================================================

import bot from "./bot.js";

// ---------------------------------------------------------------------------
// CUSTOM vercelAdapter for grammY
// ---------------------------------------------------------------------------
// We manually parse the JSON body and pass it straight to the bot instead of
// relying on grammY's webhook adapter (which breaks on Vercel's Node runtime).
async function vercelAdapter(req, res) {
  // The bot might not be initialized if BOT_TOKEN is missing.
  if (!bot) {
    console.warn("Bot not configured (BOT_TOKEN missing).");
    res.status(200).json({ ok: false, error: "BOT_TOKEN not configured" });
    return;
  }

  // Read the raw JSON body of the incoming webhook update.
  let update;
  try {
    update = await req.json();
  } catch (err) {
    res.status(200).json({ ok: false, error: "Invalid body" });
    return;
  }

  // Pass the update to grammY for processing. Always return 200 quickly.
  try {
    await bot.handleUpdate(update);
  } catch (err) {
    console.error("handleUpdate error:", err);
  }
  res.status(200).json({ ok: true });
}

// ---------------------------------------------------------------------------
// Failsafe timeout
// ---------------------------------------------------------------------------
// Ensure we never hang: if the bot is slow (e.g. outgoing API retries), still
// respond with 200 so Telegram doesn't retry an already-handled update.
function withTimeout(handler, ms) {
  return (req, res) => {
    const timer = setTimeout(() => {
      try {
        if (!res.headersSent) res.status(200).json({ ok: true, timedOut: true });
      } catch (_) {}
    }, ms);
    Promise.resolve()
      .then(() => handler(req, res))
      .catch((err) => {
        console.error("webhook handler error:", err);
        if (!res.headersSent) res.status(200).json({ ok: false });
      })
      .finally(() => clearTimeout(timer));
  };
}

// Apply the failsafe timeout around the custom adapter.
export default withTimeout(vercelAdapter, 8000);
