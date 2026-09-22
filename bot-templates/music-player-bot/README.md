# 🎵 H-Tech Studio — Music Player Bot (Inbox Audio Player)

User က သီချင်းနာမည်ရိုက် → ရှာတွေ့တဲ့ songs → ရွေး → ဘော **audio file** ပို့ → Telegram ရဲ့ **ကိုယ်ပိုင် player မှာ ဖွင့်** လို့ရတယ်။ Group လည်း DM လည်း ရတယ်။

- **No API key မလို** — free Saavn/JioSaavn public API သုံးတယ်
- **Vercel deploy ရလွယ်** — extra account မလို
- 160/320kbps ဦးစားပေး audio, YouTube လို inbox audio

## ✨ Commands
- `/play <song>` — သီချင်းရှာ → inline results → ရွေးရင် play
- `/song <name>` — alias
- `/start` / `/help`

## 🚀 Deploy
1. **@BotFather** → `/newbot` → token
2. **@userinfobot** → admin id
3. Vercel env: `BOT_TOKEN`, `ADMIN_CHAT_ID`
4. Deploy → webhook:
```
node -e "require('./api/bot').bot.api.setWebhook('https://<url>/api/bot').then(r=>console.log(r.description))"
```

## ⚙️ Customize
- `api/bot.js` — `CONFIG` (BOT_NAME, SUPPORT_LINK, MAX_RESULTS, `SEARCH_API`)
- Provider ပြောင်းချင်ရင် `SEARCH_API` base URL နဲ့ `toPick()`/`pickAudio()` parse ပြောင်းပါ

## 📁 Files
- `api/bot.js` — logic
- `api/webhook.js` — Vercel adapter
- `package.json` / `vercel.json` / `.env.example`

> ⚠️ Note: Saavn public API သည် third-party free service ဖြစ်တယ်။ Global uptime မတည်ငြိမ်တတ် — production ဆို genres: JioSaavn official API key သို့မဟုတ် မိမိရဲ့ license ရှိရလိမ့်မယ်။ Resell လုပ်တဲ့အခါ client ကို ဒါသေချာရှင်းပြပါ။
