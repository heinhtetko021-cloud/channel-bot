# 🤖 H-Tech Support / FAQ Bot (grammY + Vercel)

A **pre-built, sellable Telegram Customer Support / FAQ Bot** template by
**H-Tech Studio (Myanmar)**. Your client's customers chat with the bot to get
instant answers to their questions, and it escalates to a human agent when it
can't help.

- Built on [grammY](https://grammy.dev) — modern, typed, reliable.
- Deploys free to **Vercel** serverless functions.
- Full **Burmese/English** FAQ, inline keyboard main menu, keyword search,
  and human-escalation notifications to the owner's chat.

---

## ✨ Features

- `/start` → welcome message + inline main menu:
  - 📦 ပို့ဆောင်မှု (Delivery)
  - 💳 ငွေပေးချေမှု (Payment)
  - 📍 လိပ်စာ (Location)
  - 👤 ဆက်သွယ်ရန် (Contact)
  - ❓ ရှာဖွေရန် (Search)
- Category buttons → direct FAQ answers (via `editMessageText`).
- ❓ Search → customer types a question → keyword matching across question,
  answer & tags → best match, or closest options / human fallback.
- 👤 Contact → phone, Telegram link, hours & address.
- **Human escalation**: typing `human` / `agent` / `people` / `လူ` etc.
  notifies the owner's chat with the customer's user id, name & username.
- Fail-safe: unrecognized questions also notify the owner.

---

## 🛠 Project Structure

```
support-bot/
├── api/
│   ├── bot.js       ← all bot logic + FAQ data (CUSTOMIZE THIS)
│   └── webhook.js   ← Vercel webhook handler (custom adapter)
├── package.json
├── vercel.json      ← spawn / rewrites for Vercel
├── .env.example     ← env var template
└── README.md
```

---

## 🚀 Setup Guide

### 1. Create the bot with @BotFather

1. Open Telegram → search **@BotFather**.
2. `/newbot` → choose a name (e.g. `H-Tech Store Bot`) and username.
3. Copy the **HTTP API token** (looks like `123456789:AA...`). → **BOT_TOKEN**

### 2. Get the owner / admin chat id (ADMIN_CHAT_ID)

1. Open **@userinfobot** (or @RawDataBot) in Telegram.
2. Press **Start** — it replies with your numeric **user id** (e.g. `123456789`).
3. Paste that number → **ADMIN_CHAT_ID** (for human-escalation notifications).

### 3. Configure environment

Copy `.env.example` → `.env` and fill in:

```env
BOT_TOKEN=123456789:AAYourRealToken
ADMIN_CHAT_ID=123456789
```

> For Vercel, instead add these under **Settings → Environment Variables**.

---

## ☁️ Deploy to Vercel

**Option A — Vercel CLI (recommended):**

```bash
npm i -g vercel
vercel login
vercel --prod
```

**Option B — Git / Dashboard:**

1. Push this folder to a GitHub repo.
2. Import the repo in [vercel.new](https://vercel.new).
3. Add `BOT_TOKEN` and `ADMIN_CHAT_ID` under **Settings → Environment Variables**.
4. Deploy. Note your deployment URL, e.g. `https://yourbot.vercel.app`.

---

## 🔗 Set the Telegram Webhook

After deploying, point your bot's token to Vercel's URL. Replace
`<BOT_TOKEN>` and `<YOUR_URL>` below:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<YOUR_URL>"
```

Example:

```bash
curl "https://api.telegram.org/bot123456789:AA..x/setWebhook?url=https://yourbot.vercel.app"
```

You should get:

```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

To watch it without webhooks (local dev):

```bash
npm install
# optionally run in long-polling mode by temporarily calling bot.start()
```

---

## ✏️ Customizing the FAQ

Everything you need to change lives in **`api/bot.js`**.

### Business info (lines ~30-45)

```js
const BOT_NAME = "H-Tech Support Bot";   // bot display name
const SHOP_NAME = "H-Tech Store";        // your shop/brand name
const CHANNEL_ID = process.env.ADMIN_CHAT_ID; // notifications chat
const CONTACT_INFO = {
  phone: "09-123 456 789",               // your phone
  telegram: "https://t.me/htech_studio", // your contact link
  hours: "9:00 AM - 6:00 PM (Mon - Sat)",
  address: "No. 12, Main Road, Yangon, Myanmar",
};
```

### FAQ entries (the `FAQ` array, ~lines 50-160)

Each entry has `tags`, `question` and `answer`:

```js
{
  tags: ["delivery", "ship", "ပို့", "ပို့ဆောင်"],
  question: "ပို့ဆောင်မှု ဘယ်လောက်ကြာလဲ? (Delivery time?)",
  answer: "📦 ... your answer ...",
}
```

- **tags** → keywords (English **and** Burmese) matched against the customer's
  typed question, case-insensitively.
- **question** → displayed to the customer.
- **answer** → the reply shown (supports newlines with `\n`).

Add/remove entries to fit your business. The search scores matches across
tags, question and answer text, so add plenty of Burmese synonyms for best
results.

### Human-escalation keywords (near top of file)

Edit `HUMAN_KEYWORDS` to add/remove trigger words:

```js
const HUMAN_KEYWORDS = ["human", "agent", "people", "operator", "လူ", "support", "help"];
```

---

## ⚙️ How the code works (1-line flow each)

- **`api/bot.js`** — Defines the grammY bot: `/start` menu, category buttons,
  FAQ keyword search, contact menu, and human-escalation notifications.
- **`api/webhook.js`** — Custom Vercel adapter: reads `req.json()`,
  calls `bot.handleUpdate()`, returns `200` immediately, with a failsafe
  timeout (grammY's default webhook adapter can break on Vercel Node).
- **`vercel.json`** — Gives the function up to 10s and rewrites every route to
  `/api/bot` so Telegram's webhook hits the right endpoint.

---

## 📄 License

MIT — free to include in your client deliverables.
Built by **H-Tech Studio** 🇲🇲
