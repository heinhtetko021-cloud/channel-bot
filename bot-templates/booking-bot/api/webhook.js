import bot from "./bot.js";

// ============================================================
//  Vercel Serverless — Webhook Endpoint
//  Handles Telegram webhook updates for the booking bot.
// ============================================================

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Send POST with Telegram update" });
  }

  try {
    // Parse raw body
    const update = await req.json();

    // Return 200 immediately (Telegram timeout = 5s)
    // Process update in background
    res.status(200).json({ ok: true });

    // Handle the update with grammY (async, fire-and-forget)
    await bot.handleUpdate(update);
  } catch (err) {
    console.error("Webhook error:", err);
    // Already sent 200, so just log
  }
}

export const config = {
  api: {
    // Disable body parsing so we get raw body for grammY
    bodyParser: false,
  },
};
