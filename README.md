# 🤖 H-Tech Studio Channel Bot (Upgraded)

AI-powered auto-poster for the **@h_tech_studio** channel.
Every day the AI **drafts** 2 human-like Burmese posts (09:00 + 18:00 Myanmar time).
The draft is sent to the admin first — **nothing is posted until you confirm it.**
Deploy on Vercel (free) + Upstash Redis (free) + Groq AI (free tier).

## How it works

1. **09:00 & 18:00 (MM)** → Vercel Cron fires `/api/cron`
2. AI (Groq `openai/gpt-oss-120b`) writes a fresh, natural, non-repeating post
   (uses `sales-kit.md` prices/services + old templates as style guide)
3. The draft is sent to all admins with buttons:
   - **✏️ Edit** — send replacement text, then re-confirm
   - **✅ Confirm** — posts it to @h_tech_studio
   - **❌ Skip** — drops the draft
4. Posted drafts are saved to Redis so the AI avoids repeating recent posts

## Commands (admin only)

| Command / button | What it does |
|---|---|
| `/menu` (+ blue Menu button) | Inline menu: Generate / Confirm / Edit / Skip / Templates / Add / Status |
| `/draft` | Generate a fresh AI draft right now |
| `/status` | Channel, storage, pending draft, recent posts |
| `/list <type>` | View templates (value / showcase / promo / faq) |
| `/new <type> <text>` | Add a template |
| `/del <type> <n>` | Delete a template |
| `/post <type> <n>` | Post a template NOW without AI (emergency) |

Only admins (`ADMIN_ID`, comma-separated) can use the bot.

## Environment variables (Vercel → Settings → Environment Variables)

```
BOT_TOKEN=<BotFather token>
ADMIN_ID=8390911265,8611536716
CHANNEL_ID=-1004370717794        # @h_tech_studio only
GROQ_API_KEY=gsk_...              # get at console.groq.com
GROQ_MODEL=openai/gpt-oss-120b
UPSTASH_REDIS_REST_URL=https://<db>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>
CRON_SECRET=<any random string>
```

> Remove `CHANNEL_ID_2` — the old second channel no longer exists.

## Cron schedule (vercel.json)

```json
{ "path": "/api/cron", "schedule": "30 2,11 * * *" }   // = 09:00 & 18:00 Myanmar (UTC+6:30)
```

## Files

```
api/ai.js      # Groq AI draft generator (prompt + retry)
api/bot.js     # Bot: menu, confirm/edit/skip flow, templates, status
api/cron.js    # Vercel cron → draft only (no auto-post)
api/webhook.js # Telegram webhook entry (grammY adapter)
vercel.json    # Cron schedule + function duration
templates.json # Seed templates (style guide + manual posts)
sales-kit.md   # Pricing/services knowledge for the AI
```

## Local dev

```bash
npm install
# .env with the same variables, then:
npx vercel dev
```