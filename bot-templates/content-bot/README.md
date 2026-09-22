# H-Tech Content / Info Bot

A ready-to-deploy Telegram bot template for Myanmar businesses. Answers customers with products, services, pricing, menu, location, hours, FAQs — all from a structured knowledge base.

**No AI API key needed.** Works offline from its built-in knowledge object.

---

## Quick Start

### 1. Create Bot via BotFather
1. Open [@BotFather](https://t.me/BotFather) on Telegram.
2. Send `/newbot`, follow the prompts, copy the **BOT_TOKEN**.

### 2. Get Your Admin Chat ID
1. Message [@userinfobot](https://t.me/userinfobot) on Telegram.
2. Copy the numeric ID.
3. Paste it into `ADMIN_CHAT_ID` in `.env` and in `api/bot.js` CONFIG.

### 3. Deploy to Vercel
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Log in
vercel login

# Deploy (from the content-bot folder)
vercel --prod
```

### 4. Set the Webhook
After deployment, set the webhook URL on Telegram:
```
https://<YOUR-PROJECT>.vercel.app/webhook
```

Quick snippet (run once):
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<YOUR-PROJECT>.vercel.app/webhook"
```

Or use this one-liner:
```
https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://your-app.vercel.app/webhook
```

### 5. Test
Open your bot on Telegram and send `/start`.

---

## How to Customize

### Bot Config (`api/bot.js` → CONFIG object)
| Field | What to change |
|---|---|
| `BOT_NAME` | Display name shown in welcome message |
| `ADMIN_CHAT_ID` | Your Telegram user ID (for admin commands) |
| `BUSINESS_NAME` | Client's business name |
| `phone` | Business phone number |
| `address` | Business address |
| `hours` | Business operating hours |
| `telegramLink` | Link to business Telegram channel/group |
| `currency` | Currency code (default: "Ks") |

### Knowledge Base (`api/bot.js` → KNOWLEDGE object)
Edit the sections to match the client's data:

- **`products[]`** — Physical goods: `{ name, price, desc }`
- **`services[]`** — Services with pricing: `{ name, price, desc }`
- **`menu[]`** — Restaurant/food items: `{ name, price, desc }` (leave empty if not applicable)
- **`faqs[]`** — Frequently asked questions: `{ q, a, tags[] }`
- **`location`** — Address, map link, description
- **`hours`** — Operating hours string
- **`contact`** — Phone, Telegram, email, Facebook links

---

## Bot Commands

| Command | Who | Description |
|---|---|---|
| `/start` | Everyone | Welcome + main menu |
| `/search <keyword>` | Everyone | Search across all knowledge data |
| `/status` | Admin only | Bot stats (user count, data counts) |
| `/broadcast <msg>` | Admin only | Send message to all known users |

---

## Project Structure

```
content-bot/
├── api/
│   ├── bot.js          # grammY bot logic + knowledge base
│   └── webhook.js      # Vercel serverless webhook handler
├── .env.example        # Template for environment variables
├── package.json        # Dependencies (grammY)
├── vercel.json         # Vercel deployment config
└── README.md           # This file
```

---

## Architecture

```
User message → Telegram → Vercel webhook → bot.handleUpdate() → Response
                                    ↗ Inline keyboard menus
                                    ↗ /search keyword matching
                                    ↗ Admin commands (/status, /broadcast)
```

- **No database needed** — user IDs tracked in-memory (resets on cold start, acceptable for single-server).
- **No AI costs** — purely structured data lookup + keyword search.
- **Inline keyboard navigation** — editMessageText for clean UX with back buttons.

---

## Notes

- User tracking resets on Vercel cold starts (serverless limitation). For persistent tracking, add a database (Vercel KV, Upstash, etc.).
- The `broadcast` command sends to all users seen since the last cold start.
- Menu items are conditionally shown (restaurant menu only appears if `KNOWLEDGE.menu` is not empty).
- All knowledge data is in Burmese + English for Myanmar market.

---

**Built by H-Tech Studio** — Myanmar freelance development.
