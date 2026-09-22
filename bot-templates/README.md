# 🤖 H-Tech Studio — Pre-built Bot / AI Templates (Sales Kit)

Client ဆီ ရောင်းဖို့ **bot မျိုးစုံ** — code အသင့်၊ customize လုပ်ပြီး deploy လုပ်ရုံပဲ။

Bot တစ်ခုချင်းစီက **သီးခြား mini-project** — client မှာ ကိုယ်ပိုင် bot token + Vercel ရှိရမယ်။

---

## 📁 Template List & ဈေး

| Folder | Service | ဈေး (Ks) | AI API လို? |
|---|---|---|---|
| `order-bot` | E-commerce Order Bot | 150K – 400K | ❌ |
| `support-bot` | Customer Support / FAQ Bot | 120K – 350K | ❌ |
| `booking-bot` | Booking / Appointment Bot | 120K – 300K | ❌ |
| `content-bot` | Content / Info Bot (menu, prices, location) | 150K – 400K | ❌ |
| `ai-chat-bot` | AI Chat Bot (LLM persona) | 100K – 500K | ✅ (OpenAI/Gemini) |
| `ai-partner-bot` | 💑 AI Partner (Girlfriend/Boyfriend companion) | 200K – 800K | ✅ (OpenAI) |
| `music-player-bot` | 🎵 Music Player (search → send audio) | 150K – 400K | ❌ (Saavn API) |

---

## ⚙️ Customize လုပ်နည်း (Bot တိုင်း တူ)

Bot တိုင်းရဲ့ `api/bot.js` အပေါ်ဆုံးမှာ:

### 1. Config block (`CUSTOMIZE HERE`)
```js
const config = {
  BOT_NAME: "Brand Bot",
  ADMIN_CHAT_ID: 123456789,   // owner/ပိုင်ရှင် Telegram id
  SHOP_NAME: "...",
  CURRENCY: "Ks",
  ...                       // bot အလိုက်
};
```

### 2. Data block (`CUSTOMIZE YOUR PRODUCTS/FAQ/SERVICES/... HERE`)
```js
const PRODUCTS = [
  { id: 1, name: "ပစ္စည်း", price: 15000, category: "Apparel", emoji: "👕" },
  // ... ထည့်/ဖျက်
];
```

---

## 🚀 Deploy လုပ်နည်း (Bot တိုင်း README မှာ အပြည့်ရှိ)

1. **BotFather** (`@BotFather`) → `/newbot` → token ယူ
2. Admin id ယူ (`@userinfobot`)
3. Token + Admin id ကို Vercel env မှာ ထည့် (`BOT_TOKEN`, `ADMIN_CHAT_ID`)
4. Vercel မှာ အသစ် project create → ဒီ folder deploy
5. Webhook ချိတ်:
```
# bot folder ထဲ
npx tsx scripts/set-webhook.js https://<vercel-url>/api/bot
# (သို့) setWebhook snippet — folder README ကြည့်
```

> `vercel.json` မှာ rewrite `/(.*) → /api/bot` — setWebhook လည်း `/api/bot` ကို ထောက်နေလို့ အဆင်ပြေတယ်။

---

## 🎯 Resell Tip

Bot တစ်ခုကို **client အများကြီးကို** ရောင်းလို့ရတယ် — client တစ်ယောက်ဆီ bot token + data ပြောင်းရုံပဲ။ **Maintenance plan** နဲ့ တွဲပြီး ရောင်းရင် ပိုမြတ်။
