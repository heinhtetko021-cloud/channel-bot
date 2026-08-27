# 🤖 H-Tech Channel Bot

Telegram channel နှစ်ခုကို တစ်နေ့ ၃ ကြိမ် auto-post လုပ်ပေးတဲ့ bot ။
Vercel (free) + Upstash Redis (free) နဲ့ deploy လုပ်လို့ရပါတယ်။

## Features

- 📅 **Cron**: မနက် ၉၊ ညနေ ၂၊ ညနေ ၆ — channel နှစ်ခုလုံးကို random template ကနေ post
- ➕ **Add new**: `/new <type> <text>` — Telegram ကနေပဲ post template အသစ် ထည့်လို့ရတယ်
- 📋 **Templates**: value / showcase / promo / faq ဆိုပြီး ၄ မျိုး ခွဲထား
- 🚀 **Manual post**: `/post <type> <n>` — ချက်ချင်း post တင်
- 🗑 **Delete**: `/del <type> <n>` — template ဖျက်
- 🔒 **Admin only**: သတ်မှတ်ထားတဲ့ Telegram user ID ပဲ သုံးလို့ရ

## Project Structure

```
channel-bot/
├── api/
│   ├── bot.js       # Bot logic + admin commands
│   ├── webhook.js   # Telegram webhook handler (Vercel)
│   └── cron.js      # Scheduled posting (Vercel Cron)
├── templates.json   # Default seed templates
├── vercel.json      # Cron schedule (၃ ကြိမ်/နေ့)
├── package.json
└── .env.example
```

## Setup

### 1. Create Telegram Bot

1. Telegram မှာ [@BotFather](https://t.me/BotFather) ကို message ပို့ပြီး `/newbot`
2. နာမည်ပေး (e.g. `HTechAutoPostBot`)
3. ရလာတဲ့ **token** ကို သိမ်းထား

### 2. Create Upstash Redis (free)

1. [upstash.com](https://console.upstash.com) → Create Database (free tier)
2. Node.js tab ကနေ `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` ကို ကူးထား

### 3. Find Your IDs

**Admin ID (မင်းရဲ့ Telegram User ID):**
- [@userinfobot](https://t.me/userinfobot) ကို message ပို့ → id ကိုကြည့်

**Channel IDs:**
- Channel နှစ်ခုချောင်းကို bot က admin လုပ်ပေးပါ (channel settings → administrators → add bot)
- Channel ID ရှာနည်း ၂ မျိုး:
  - **Username** (string): channel နာမည် ရှိရင် `@my_channel` ဆိုပြီး သုံးလို့ရပါတယ်
  - **Numeric** (e.g. `-1001234567890`): `@username_to_id_bot` (ဒါမှမဟုတ် `@RawDataBot`) ကို message ပို့ပြီး channel post ကို forward လုပ်ပါ → ID ရပါမယ်

### 4. Deploy to Vercel

1. Project ကို GitHub မှာ push လုပ်ပါ
2. [vercel.com](https://vercel.com) → New Project → import
3. **Environment Variables** ထဲမှာ ထည့်ပါ:

```
BOT_TOKEN=<BotFather token>
ADMIN_ID=<မင်းရဲ့ Telegram user ID>
CHANNEL_ID=@first_channel
CHANNEL_ID_2=@second_channel
UPSTASH_REDIS_REST_URL=<upstash url>
UPSTASH_REDIS_REST_TOKEN=<upstash token>
CRON_SECRET=<random string e.g. mysecret123>
```

4. Deploy လုပ်ပါ

### 5. Set Webhook

Deploy ပြီးရင် မင်းရဲ့ vercel URL ကို webhook အဖြစ် ချိတ်ပါ:

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<your-app>.vercel.app/api/webhook
```

Browser မှာ အဲ့ link ကို ဖွင့်လိုက်ရင် `{"ok":true}` ပြပြီးသွားပါမယ်။

### 6. Test

Telegram မှာ bot ကို `/admin` ပို့ကြည့်ပါ →
- `/status` → ပြင်ဆင်မှုမှန်မမှန် ကြည့်
- `/post promo 1` → channel တွေကို ချက်ချင်း post တင်

---

## Cron Schedule (vercel.json)

မနက် ၉ 🇲🇲 → `value` post
ညနေ ၂ 🇲🇲 → `showcase` post
ညနေ ၆ 🇲🇲 → `promo` post

> Vercel free tier Cron က daily schedule ပဲ support လုပ်ပါတယ် — ဒါနဲ့ အဆင်ပြေပါတယ်။
> Cron ကို toggle ဖွင့်ဖို့ Vercel dashboard → Project → Settings → Cron から Enable လုပ်ရပါမယ် (free ဖြစ်လည်း cron enabled လုပ်ရ).

## Commands (Admin only)

| Command | Usage |
|---|---|
| `/admin` | Help |
| `/new value <text>` | Template အသစ် ထည့် (multi-line ဆို text ရိုက်တဲ့ message နောက်မှာ) |
| `/post <type> <n>` | #n post ကို channel နှစ်ခုလုံးသို့ ချက်ချင်းတင် |
| `/list <type>` | Templates ကြည့် (e.g. /list promo) |
| `/del <type> <n>` | Template ဖျက် |
| `/status` | Config + template count ကြည့် |

## Local Dev

```bash
npm install
# .env ဖိုင်ထဲ environment variables ထည့်ပြီးရင်
npx vercel dev
```
