/**
 * Local helper: set the Telegram webhook to your Vercel deployment.
 *
 * Usage:
 *   node scripts/set-webhook.js https://your-app.vercel.app
 *
 * This registers https://your-app.vercel.app/api/bot as the webhook URL.
 * Replace the URL with your actual Vercel deployment URL.
 */
const { bot } = require("../api/bot");

(async () => {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: node scripts/set-webhook.js <your-vercel-url>");
    console.error("Example: node scripts/set-webhook.js https://htech-order-bot.vercel.app");
    process.exit(1);
  }

  // Remove any trailing slash, append /api/bot (the rewrite target)
  const webhookUrl = `${url.replace(/\/$/, "")}/api/bot`;

  try {
    const ok = await bot.api.setWebhook(webhookUrl, {
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    });
    console.log(ok ? `✅ Webhook set to ${webhookUrl}` : "❌ Failed to set webhook");
    const info = await bot.api.getWebhookInfo();
    console.log("Webhook info:", info.url);
  } catch (err) {
    console.error("Error setting webhook:", err.message || err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
