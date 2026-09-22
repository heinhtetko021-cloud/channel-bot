/**
 * H-Tech Studio — AI Chat Bot (grammY)
 *
 * Flow:  Telegram webhook → webhook.js → bot.handleUpdate → this file
 *        Bot receives message → builds per-user history → calls LLM → replies
 *
 * ─── CUSTOMIZE HERE ──────────────────────────────────────────────────────────
 * Edit the CONFIG object below to brand the bot for your client.
 * Everything else stays as-is.
 */

const { Bot } = require("grammy");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONFIG — CUSTOMIZE HERE (developer edits this before deploy)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONFIG = {
  /** Display name shown in /start reply */
  BOT_NAME: "H-Tech AI Assistant",

  /**
   * Brand persona / business knowledge sent as the system prompt.
   * Write in the language(s) your client's customers speak.
   * Keep it under ~800 tokens for fast first replies.
   *
   * Sample (Myanmar restaurant):
   */
  SYSTEM_PROMPT: [
    "You are an AI assistant for 'Golden Elephant Restaurant' in Yangon, Myanmar.",
    "You answer questions about our menu, prices, opening hours, and delivery.",
    "Menu highlights: Mohinga (3000 MMK), Shan Noodles (3500 MMK), Tea Leaf Salad (2000 MMK).",
    "Open daily 6 AM – 9 PM. Free delivery within 3 km for orders over 10,000 MMK.",
    "Always reply in the same language the customer writes in.",
    "Be friendly, helpful, and concise. If you don't know something, say so politely.",
    "Do NOT make up menu items or prices that are not listed above.",
  ].join("\n"),

  /**
   * LLM provider: "openai" | "gemini" | "anthropic"
   * Only "openai" (OpenAI-compatible) is fully implemented below.
   * For Gemini / Anthropic — swap the callLLM() body with their REST endpoint.
   */
  AI_PROVIDER: "openai",

  /** Model name sent to the API */
  MODEL: "gpt-4o-mini",

  /** Max messages (user+assistant pairs) kept per user before truncation */
  HISTORY_CAP: 20,

  /** Timeout (ms) for the LLM call — bot replies with fallback if exceeded */
  LLM_TIMEOUT_MS: 20_000,
};
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const bot = new Bot(process.env.BOT_TOKEN);

// ── In-memory stores (reset on cold start — fine for single-instance) ────────
/** @type {Map<number, Array<{role:string, content:string}>>} */
const userHistory = new Map();

/** @type {string} Admin-editable system prompt (overrides CONFIG on /admin) */
let runtimeSystemPrompt = CONFIG.SYSTEM_PROMPT;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Call an OpenAI-compatible chat completions endpoint via native fetch.
 * Works with OpenAI, OpenRouter, Together, Groq, vLLM, LiteLLM, etc.
 *
 * To use a different provider, replace the fetch call inside this function.
 */
async function callLLM(messages) {
  const apiKey =
    CONFIG.AI_PROVIDER === "gemini"
      ? process.env.GEMINI_API_KEY
      : CONFIG.AI_PROVIDER === "anthropic"
        ? process.env.ANTHROPIC_API_KEY
        : process.env.OPENAI_API_KEY;

  if (!apiKey) throw new Error(`Missing API key for provider "${CONFIG.AI_PROVIDER}"`);

  // ── OpenAI-compatible endpoint (default) ──
  // Change this base URL to point to any OpenAI-compatible API:
  //   OpenRouter  → https://openrouter.ai/api/v1
  //   Together    → https://api.together.xyz/v1
  //   Groq        → https://api.groq.com/openai/v1
  //   Local       → http://localhost:11434/v1  (Ollama)
  const baseURL =
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.LLM_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`LLM API ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "(No response from AI)";
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Truncate history to stay within HISTORY_CAP (keeps newest messages).
 */
function trimHistory(history) {
  if (history.length > CONFIG.HISTORY_CAP) {
    return history.slice(history.length - CONFIG.HISTORY_CAP);
  }
  return history;
}

// ── Bot commands ─────────────────────────────────────────────────────────────

bot.command("start", async (ctx) => {
  const name = ctx.from?.first_name || "";
  await ctx.reply(
    `👋 Hello${name ? ", " + name : ""}! I'm *${CONFIG.BOT_NAME}*.\n\n` +
      `I can answer your questions instantly. Just type anything and I'll help!\n\n` +
      `_Tip: Type /reset to clear our conversation._`,
    { parse_mode: "Markdown" },
  );
});

bot.command("reset", async (ctx) => {
  userHistory.delete(ctx.from.id);
  await ctx.reply("✅ Conversation cleared. Send me a new question!");
});

/**
 * /admin prompt <new prompt text>
 * Admin-only: updates the runtime system prompt (persona).
 */
bot.command("admin", async (ctx) => {
  const adminId = Number(process.env.ADMIN_CHAT_ID);
  if (ctx.from.id !== adminId) {
    return ctx.reply("⛔ You are not authorized to use this command.");
  }

  const text = ctx.message?.text || "";
  const parts = text.split(" ");
  // /admin prompt <rest>
  if (parts.length < 3 || parts[1] !== "prompt") {
    return ctx.reply(
      "Usage: `/admin prompt <new system prompt text>`",
      { parse_mode: "Markdown" },
    );
  }

  const newPrompt = parts.slice(2).join(" ").trim();
  if (!newPrompt) return ctx.reply("Prompt cannot be empty.");

  runtimeSystemPrompt = newPrompt;
  await ctx.reply("✅ System prompt updated for this session.");
});

// ── Handle every text message ────────────────────────────────────────────────

bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const userText = ctx.message.text;

  // Show typing indicator while we process
  await ctx.replyWithChatAction("typing");

  // Build / retrieve conversation history
  if (!userHistory.has(userId)) userHistory.set(userId, []);
  const history = userHistory.get(userId);

  history.push({ role: "user", content: userText });

  // Assemble messages for the LLM
  const messages = [
    { role: "system", content: runtimeSystemPrompt },
    ...trimHistory(history),
  ];

  try {
    const reply = await callLLM(messages);

    // Store assistant response in history
    history.push({ role: "assistant", content: reply });
    userHistory.set(userId, trimHistory(history));

    // Telegram has a 4096-char limit per message
    const chunks = splitMessage(reply, 4000);
    for (const chunk of chunks) {
      await ctx.reply(chunk);
    }
  } catch (err) {
    console.error(`[AI Bot] LLM error for user ${userId}:`, err.message);

    await ctx.reply(
      "😔 ဝန်ဆောင်မှုခေတ္တမရရှိနိုင်သေးပါ။ နောက်မှထပ်ကြိုးစားကြည့်ပါ။\n" +
        "(Service temporarily unavailable. Please try again later.)",
    );

    // Notify admin (non-blocking, best-effort)
    const adminId = Number(process.env.ADMIN_CHAT_ID);
    if (adminId) {
      bot.api
        .sendMessage(
          adminId,
          `⚠️ LLM error for user ${userId} (${ctx.from.first_name}):\n${err.message}`,
        )
        .catch(() => {});
    }
  }
});

// ── Utility: split long messages ─────────────────────────────────────────────
function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, maxLen));
    remaining = remaining.slice(maxLen);
  }
  return chunks;
}

// ── Error handler ────────────────────────────────────────────────────────────
bot.catch((err) => {
  console.error("[grammY] Unhandled bot error:", err);
});

module.exports = bot;
