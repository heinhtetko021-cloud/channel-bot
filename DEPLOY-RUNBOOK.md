# 🚀 H-Tech Studio — Safe Deploy Runbook

ဒီ runbook က **မင်းကိုယ်တိုင်** ဘေးကင်းကင်း deploy လုပ်ဖို့ပါ။ ငါ (opencode) က telecom/Vercel login password တွေ ကိုင်တွယ်တာ မလုပ်သင့်ဘူး — ဒါတွေကို **မင်း လက်နဲ့ လုပ်ပြီး ကြည့်ရှုနိုင်** ရမယ်။ အားလုံးကို command line မှာ မြင်ရတဲ့အတွက် လုံခြုံတယ်။

> ⏱ ပထမဆုံး သိထားစရာ: ငါ့ sandbox မှာ **outbound internet မရ** လို့ ငါ ကိုယ်တိုင် `vercel login`/`vercel --prod` run လို့ **မရဘူး**။ ဒါကြောင့် ဒီ runbook ကိုပဲ မင်း မင်းရဲ့ terminal မှာ run ဖို့ လိုတယ်။

---

## 0️⃣ Install Vercel CLI (တစ်ခါတည်း)

```
npm i -g vercel
vercel --version   # expect a version number
```

---

## 1️⃣ Bot တစ်ခု — Telegram token + Admin id ယူ

ပထမဆုံး **bot တစ်ခု** သာ test လုပ်ပါ (ဥပမာ music-player-bot)။

1. Telegram မှာ **@BotFather** ကို ဖွင့် → `/newbot` → နာမည်ပေး → token ရတယ်
2. **@userinfobot** ကို ဖွင့် → `/start` → မင်းရဲ့ **numeric user id** ပြ (837...)

> ⚠️ Token ကို **ဘယ်သူနဲ့မှ မမျှဝေပါနဲ့** — ဒီ runbook မှာ မရေးပါနဲ့။

---

## 2️⃣ Bot project ထဲ ဝင်ပြီး install

```
cd C:\Users\user\Desktop\channel-bot\bot-templates\music-player-bot
npm install
```

---

## 3️⃣ .env ဖန်တီး (local)

`music-player-bot/.env` (gitignore ဖြစ်အောင်) — **file တစ်ခု ဖန်တီးပြီး** ဒါထည့်:
```
BOT_TOKEN=123456:ABC...        # BotFather ရဲ့ token
ADMIN_CHAT_ID=8390911265
```

> Vercel က `.env` ကို auto တင်မပေးဘူး — အောက်မှာ env ထည့်နည်း ရှိတယ်။

---

## 4️⃣ Vercel နဲ့ ချိတ်ပြီး Deploy

```
vercel login          # browser ပွင့်လာမယ် → မင်း account နဲ့ login
vercel link           # project ဖန်တီး/ရွေး
vercel env add BOT_TOKEN production      # ပြီးရင် value paste
vercel env add ADMIN_CHAT_ID production  # value paste
vercel --prod         # deploy!
```

ပြီးရင် **URL** ရမယ် — ဥပမာ `https://music-player-bot-xxxx.vercel.app`

> `vercel env add` က interactive — prompt တွေကို လက်နဲ့ ဖြည့်ပါ။

---

## 5️⃣ Webhook ချိတ်

Bot token ကို prompt တစ်ခုကနေ env အဖြစ် ဖတ်ပြီး setWebhook လုပ်ပါ (token က file ထဲ မကုန်ပါ):

```
node -e "require('dotenv').config(); const {bot}=require('./api/bot'); bot.api.setWebhook('https://YOUR-URL.vercel.app/api/bot').then(r=>console.log(r.description))"
```

> `YOUR-URL` နေရာကို အပေါ်က URL နဲ့ ပြောင်းပါ။ `dotenv` မရှိရင်: `npm i -D dotenv`

**Test:** Telegram မှာ @မင်းရဲ့bot → `/start` → `/play kelvin` → pick a song 🎵

---

## 6️⃣ အောင်မြင်ရင် — ကျန်တဲ့ bots လည်း အလားတူ

Bot တိုင်းက **လွတ်လပ်တဲ့ mini-project** — folder တစ်ခုချင်းစီအတွက် steps 1–5 ပြန်လုပ်ပါ:
- `order-bot`, `support-bot`, `booking-bot`, `content-bot`, `ai-chat-bot` (ai-chat + ai-partner ကို OpenAI key ထပ်လို)
- `music-player-bot` ✅ (test)

---

## ⚠️ ဘေးကင်းရေး Tips (အရေးကြီး)

1. **Bot token / password ဘယ်သူ့ကိုမှ မပို့ပါ** — opencode ကို လည်း မပို့ပါနဲ့။ Runbook ထဲ မရေးပါနဲ့။
2. `vercel login` သည် **browser-based** — မင်း ကိုယ်တိုင် အတည်ပြုတယ်။
3. ငါ့ sandbox မှာ internet မရဆိုတော့ **ငါကိုယ်တိုင် deploy မလုပ်နိုင်** — ဒါ အရမ်း ကောင်းတဲ့အချက်ပဲ (credential မလိုတာ)။ `vercel login` တွေ မင်း ကိုယ်တိုင်ပဲ လုပ်ရမယ်။
4. `git push` မလုပ်ခင် `.gitignore` မှာ `.env` ရှိလားစစ်ပါ (အောက်မှာ စစ်နည်း)။

---

## 🔍 `.env` git ထဲ မပါအောင် စစ်နည်း

```
cd C:\Users\user\Desktop\channel-bot
git check-ignore bot-templates/music-player-bot/.env   # path ‌ပေါ်ရင် ignore ဖြစ်နေတယ်
```
