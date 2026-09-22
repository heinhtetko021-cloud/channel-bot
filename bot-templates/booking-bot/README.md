# 🗓️ Telegram Booking Bot — H-Tech Studio Template

A ready-to-sell Telegram booking/appointment bot built with **grammY** and deployable to **Vercel** in minutes.

**Works for:** clinics, salons, tuition centers, restaurants, freelancers, any appointment-based service.

---

## 🚀 Quick Start

### 1. Create Bot via BotFather

1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Name: e.g. `My Clinic Booking Bot`
4. Username: e.g. `myclinic_booking_bot`
5. Copy the **BOT_TOKEN** BotFather gives you

### 2. Find Your Admin Chat ID

1. Open Telegram → search **@userinfobot**
2. Send `/start`
3. Copy your **Chat ID** (number like `123456789`)

### 3. Configure Environment Variables

Create a `.env` file (or set in Vercel dashboard):

```
BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_chat_id_here
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
vercel --prod
```

### 5. Set Webhook

After deployment, set the webhook so Telegram sends updates to your bot:

```bash
# Replace YOUR_BOT_TOKEN and YOUR_VERCEL_URL
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_VERCEL_URL.vercel.app/webhook"
```

Or open this URL in your browser:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_URL>.vercel.app/webhook
```

Verify webhook is set:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

---

## 🛠 How to Customize

All customization points are marked with `CUSTOMIZE HERE` comments in `api/bot.js`.

### Business Name & Admin

```js
const BOT_NAME = "My Booking Bot";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "123456789";
const BUSINESS_NAME = "H-Tech Clinic";
const CURRENCY = "Ks";
```

### Services

Edit the `SERVICES` array to match your client's offerings:

```js
const SERVICES = [
  { name: "General Checkup", durationMin: 30, price: 5000, emoji: "🩺" },
  { name: "Dental Cleaning", durationMin: 45, price: 15000, emoji: "🦷" },
  // Add more services here...
];
```

| Field          | Description                        |
|----------------|------------------------------------|
| `name`         | Service name shown in bot          |
| `durationMin`  | Duration in minutes                |
| `price`        | Price in Ks (or your currency)     |
| `emoji`        | Icon for the service               |

### Bookable Hours

```js
const BOOKABLE_START_HOUR = 9;    // 9 AM
const BOOKABLE_END_HOUR = 17;     // 5 PM
const SLOT_INTERVAL_MIN = 60;     // 60-minute slots
const ADVANCE_BOOKING_DAYS = 7;   // Show next 7 days
```

---

## 📱 Bot Commands

| Command       | Who     | Description                    |
|---------------|---------|--------------------------------|
| `/start`      | Everyone | Welcome + booking menu         |
| `/status`     | Admin   | Show today's confirmed bookings |

---

## 🔄 Booking Flow

```
/start
  → 📅 Book Now
    → Choose Service (inline buttons)
    → Choose Date (next 7 days)
    → Choose Time (available slots)
    → Enter Name
    → Enter Phone
    → Confirm Screen (summary)
    → ✅ Booking Confirmed!
    → Admin notified with full details

  → 📋 My Bookings
    → List user's past bookings
```

---

## 📁 Project Structure

```
booking-bot/
├── api/
│   ├── bot.js          # Main bot logic (grammY)
│   └── webhook.js      # Vercel webhook handler
├── .env.example        # Environment template
├── package.json        # Dependencies
├── vercel.json         # Vercel config
└── README.md           # This file
```

---

## ⚡ Production Notes

- **In-memory storage**: Bookings are stored in RAM. For production, swap `bookings` Map with a database (Upstash Redis, PlanetScale, MongoDB, etc.)
- **Session storage**: Sessions are in-memory per user. Swap `sessions` Map with Upstash Redis for persistence across cold starts.
- **Timezone**: The bot uses the server's timezone (UTC on Vercel). Adjust `getNextDays()` if you need Myanmar Time (MMT = UTC+6:30).
- **Vercel free tier**: Serverless functions have a 10s timeout (set in `vercel.json`). This is sufficient for booking flows.

---

## 📜 License

MIT — Built by H-Tech Studio. Free to use, modify, and resell.
