# 💑 H-Tech Studio — AI Partner Bot (Girlfriend / Boyfriend)

Lonely people တွေအတွက် — **emotional companion bot**။ မင်းရဲ့ virtual girlfriend/boyfriend — စကားပြော၊ သဘောထား နားလည်၊ မှတ်မိ၊ နေ့စဉ် check-in။

> ⚠️ ဒါက **supportive/companion** bot ဖြစ်ပြီး ကျန်းမာရေးကောင်းအောင် ရည်ရွယ်ပါတယ်။ Client ကို ရောင်းတဲ့အခါ ဒီလိုပဲ ဂုဏ်ယူပြီး ရောင်းပါ။

## ✨ Features
- **Girlfriend / Boyfriend mode** (switch လို့ရ)
- **Memory** — name, likes, dislikes မှတ်မိ (per-user)
- **Mood / Emotion tracking** — happy/tired စသဖြင့်
- **Roleplay / Comfort mode** — session ပြောင်းလို့ရ
- **Daily check-in** — တစ်နေ့တာ ဘယ်လိုလဲ မေးတယ်
- **Offline fallback** — AI key မရှိရင်တောင် ကျေးဇူးပြုတဲ့ replies

## 🚀 Deploy

1. **BotFather** → `/newbot` → token
2. **@userinfobot** → admin id
3. **Vercel env:**
   - `BOT_TOKEN`
   - `ADMIN_CHAT_ID`
   - `OPENAI_API_KEY` (ရွေးချယ်နိုင် — မထည့်ရင် offline fallback)

4. Deploy
5. Webhook:
```
npx vercel --prod
# ثم
node -e "require('./api/bot').bot.api.setWebhook('https://<url>/api/bot').then(r=>console.log(r.description))"
```

## ⚙️ Customize
- `api/bot.js` — `CONFIG` + `buildPersona()` (personality/system prompt)
- `DEFAULT_PARTNER` — girlfriend / boyfriend

## 📁 ဖိုင်တွေ
- `api/bot.js` — bot logic
- `api/webhook.js` — Vercel webhook
- `package.json` / `vercel.json` / `.env.example`
