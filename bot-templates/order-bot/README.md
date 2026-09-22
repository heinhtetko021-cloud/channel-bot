# H-Tech Studio — Telegram Order Bot 🛒

A ready-to-sell Telegram **Order Bot** template built by **H-Tech Studio** for business clients.
Your client's **customers** use this bot to browse products, add them to a cart, and place an order.
Orders are delivered straight to the **owner's Telegram chat** (the admin).

Built with **grammY** + **Vercel** (serverless webhook). Optional **Upstash Redis** for session storage.

---

## ✨ Features

- 🏠 **Category browsing** — products are grouped into categories with an inline menu.
- 📦 **Product details** — emoji, name, price, and an "Add to Cart" button.
- 🛒 **Cart management** — increase / decrease quantity, remove items, view total.
- ✅ **Checkout flow** — step-by-step: **Name → Phone → Address**, then order confirmation.
- 📩 **Order delivery** — order details are sent to the owner's chat (`ADMIN_CHAT_ID`).
- 📊 **`/status`** — admin-only command: total orders today, active carts, product count.
- 🧩 **Fully customizable** — products, prices, categories, and shop name live in one place.

---

## 🧩 How it works (bot flow)

```
Customer opens bot → /start
        ↓
Category menu (inline keyboard)
        ↓
Pick a category → product list
        ↓
Pick a product → detail + "Add to Cart"
        ↓
🛒 Cart (qty +/- , remove, checkout)
        ↓
Checkout: Name → Phone → Address
        ↓
Confirm order
   ├── 📩 Order sent to owner's chat (ADMIN_CHAT_ID)
   └── ✅ Confirmation sent to customer (with contact note)
```

---

## 🚀 Setup Guide (for the developer / client)

### 1. Create the bot with BotFather

1. Open Telegram and message **[@BotFather](https://t.me/BotFather)**.
2. Send `/newbot`, follow the prompts, and give it a name & username.
3. BotFather gives you a **token** that looks like:
   ```
   123456789:AAExampleTokenHere_ReplaceMe
   ```
4. **(Optional, recommended)** Send `/setinline` and `/setdescription` to polish the bot.
   To allow customers to spot it easily, consider `/setdescription` with your shop tagline.

### 2. Get the owner's chat ID (`ADMIN_CHAT_ID`)

Orders are delivered here, and only this ID can use `/status`.

1. Have the owner open the new bot on Telegram and press **Start**.
2. Open a chat with **[@userinfobot](https://t.me/userinfobot)** (or `@RawDataBot`).
3. It replies with the owner's numeric **`id`** (e.g. `123456789`).

### 3. Add your environment variables

Create a `.env` file from the example, or add these to Vercel (Project → Settings → Environment Variables):

```env
BOT_TOKEN=123456789:AAExampleTokenHere_ReplaceMe
ADMIN_CHAT_ID=123456789
```

> `ADMIN_CHAT_ID` is a **number** (no quotes).

### 4. Deploy to Vercel

**Option A — Vercel CLI**

```bash
# 1. Install deps
npm install

# 2. Add the two env vars (above)

# 3. Deploy
vercel --prod

# 4. You get a URL like: https://htech-order-bot.vercel.app
```

**Option B — GitHub / Vercel dashboard**

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Add `BOT_TOKEN` and `ADMIN_CHAT_ID` under **Environment Variables** (and mark *Production*).
4. Deploy.

### 5. Point Telegram to your webhook

Once deployed, register the webhook with your bot so Telegram delivers updates to Vercel:

```bash
node scripts/set-webhook.js https://htech-order-bot.vercel.app
```

> This calls `bot.api.setWebhook('https://<your-vercel-url>/api/bot')` for you.

Or run it inline from Node:

```js
const { bot } = require("./api/bot");
await bot.api.setWebhook("https://htech-order-bot.vercel.app/api/bot");
```

After a second, open the bot in Telegram and send `/start`. 🎉

---

## 🛠️ Customizing the template (this is the sellable part)

### Customize the shop & config

Open **`api/bot.js`** and edit the `config` block near the top (marked `CUSTOMIZE HERE`):

```js
const config = {
  BOT_NAME: "H-Tech Shop Bot",       // Bot's display name
  CHANNEL_ID: process.env.ADMIN_CHAT_ID || "",  // Owner chat id (from env)
  CURRENCY: "Ks",                    // Currency (Myanmar Kyat)
  SHOP_NAME: "H-Tech Studio Shop",   // Your client's shop name
};
```

### Add / edit products

Everything lives in the `PRODUCTS` array (marked `CUSTOMIZE YOUR PRODUCTS HERE`).
Each product needs: `id`, `name`, `price`, `category`, `emoji`.

```js
{ id: "acc1", name: "Phone Case (Clear)", price: 3000,  category: "Accessories", emoji: "📱" },
```

- **Add** → copy a line and change the values (keep `id` unique).
- **Remove** → delete the line.
- **Change price** → edit the number.
- **New category** → just use a new `category` string; the category menu builds itself automatically.
- **Categorize** → products are grouped by their `category` value.

---

## 📈 Optional: Upstash Redis for persistent carts

This template uses **in-memory** storage (a `Map`) by default — perfect for testing and small volume.
For production / multi-instance scaling, swap the in-memory `carts` map for Upstash Redis:

1. Create a database at [upstash.com](https://upstash.com) → get `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
2. `npm install @upstash/redis`
3. In `api/bot.js`, replace the `carts` Map helpers with `@upstash/redis` calls using the user's id as a key.

---

## 📂 Project structure

```
order-bot/
├── api/
│   ├── bot.js            # ALL bot logic — products, cart, checkout, admin
│   └── webhook.js        # Vercel webhook adapter (raw request → bot.handleUpdate)
├── scripts/
│   ├── set-webhook.js    # Registers your webhook URL with Telegram
│   └── dev.js            # Local long-polling dev server
├── .env.example          # Copy to .env and fill in your values
├── package.json
└── vercel.json           # Serverless config + rewrite to /api/bot
```

---

## ➕ Admin commands

| Command  | Who can use | What it does |
|----------|-------------|--------------|
| `/start` | Everyone    | Welcome + category menu |
| `/cart`  | Everyone    | View / manage your cart |
| `/status`| Owner only  | Orders today, active carts, total products |

> All other commands are blocked. Callbacks are silenced via `answerCallbackQuery` and the UI updates in place with `editMessageText`.

---

## 🧰 Tech notes

- **grammY** — the framework powering the bot.
- **Vercel serverless** — each request is handled by a function; this template returns **HTTP 200 immediately** and processes the update in the background (with a 5-second failsafe) so Telegram's fast-response requirement is always met. This is why we use a **custom webhook adapter** in `api/webhook.js` — grammY's default adapter doesn't work reliably on Vercel.
- **`vercel.json`** rewrites every request to `/api/bot`, so `setWebhook('.../api/bot')` just works.

---

## ❓ Troubleshooting

- **Bot doesn't respond** → make sure `BOT_TOKEN` is set in Vercel *and* you ran `npm run set-webhook -- https://<url>` after deploying.
- **Orders don't arrive** → confirm `ADMIN_CHAT_ID` is the correct numeric id and that the owner has pressed **Start** on the bot.
- **Webhook says 404** → redeploy after setting env vars; Vercel routes `/\*` → `/api/bot`.
- **Want instant local testing** → run `npm run dev` (long-polling, no webhook needed).

---

Built with ❤️ by **H-Tech Studio** — resellable template.
