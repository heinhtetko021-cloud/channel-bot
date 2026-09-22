# H-Tech AI Chat Bot

Telegram AI Chat Bot template — built with **grammY** + **Vercel Serverless**.
Customers chat, the bot answers using an LLM (OpenAI, Gemini, or any OpenAI-compatible provider).

---

## Quick Start

```bash
# 1. Clone / copy this folder
cd ai-chat-bot

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env
# Edit .env — fill in BOT_TOKEN, ADMIN_CHAT_ID, and your AI API key

# 4. Customize persona (optional)
#    Open api/bot.js → edit the CONFIG.SYSTEM_PROMPT string
#    Write the brand info, menu, hours, etc. in any language.

# 5. Deploy to Vercel
npx vercel --prod

# 6. Set the webhook
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<YOUR-VERCEL-APP>.vercel.app/webhook"
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message + how to use |
| `/reset` | Clear conversation history |
| `/admin prompt <text>` | **Admin only** — update the bot's persona at runtime |

---

## Customization Checklist

1. **BOT_NAME** — display name in `/start` reply
2. **SYSTEM_PROMPT** — brand persona, menu, FAQ, business hours
3. **AI_PROVIDER** — `"openai"` (default), `"gemini"`, or `"anthropic"`
4. **MODEL** — model name (e.g. `gpt-4o-mini`, `gpt-4o`, `claude-3-haiku`)
5. **ADMIN_CHAT_ID** — your Telegram user ID for admin notifications
6. **OPENAI_BASE_URL** — point to any OpenAI-compatible API (OpenRouter, Groq, Together, Ollama, etc.)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Telegram bot token from @BotFather |
| `ADMIN_CHAT_ID` | Yes | Telegram user ID for admin alerts |
| `OPENAI_API_KEY` | Yes* | API key for OpenAI (or OpenAI-compatible) |
| `OPENAI_BASE_URL` | No | Override the default API endpoint |
| `GEMINI_API_KEY` | No* | Only if AI_PROVIDER="gemini" |
| `ANTHROPIC_API_KEY` | No* | Only if AI_PROVIDER="anthropic" |

---

## How It Works

```
User sends message
       ↓
Telegram → Vercel POST /api/bot
       ↓
webhook.js → parse body → bot.handleUpdate() → return 200 immediately
       ↓ (background)
bot.js → build messages[] → call LLM API → reply via Telegram API
```

The webhook returns 200 instantly so Telegram doesn't retry. The AI call runs
in the background inside the Vercel function (up to 30 s maxDuration).

---

## File Structure

```
ai-chat-bot/
├── api/
│   ├── bot.js          # grammY bot logic + AI integration
│   └── webhook.js      # Vercel serverless handler
├── .env.example        # Environment template
├── package.json        # Dependencies (grammy only)
├── vercel.json         # Vercel function config
└── README.md           # This file
```

---

## Notes

- Per-user conversation history is stored in memory (resets on cold start).
  For persistence, replace the Map with Upstash Redis (see comments in bot.js).
- The bot replies in the same language the customer writes in.
- LLM errors trigger a friendly Burmese fallback message + admin notification.

---

**H-Tech Studio** — Myanmar Freelance Development
