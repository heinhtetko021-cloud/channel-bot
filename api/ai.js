// api/ai.js — Groq-powered draft generator for H-Tech Studio channel posts.
const fs = require("fs");
const path = require("path");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

function readFileRelative(name) {
  try {
    return fs.readFileSync(path.join(__dirname, "..", name), "utf8");
  } catch (e) {
    return "";
  }
}

const SALES_KIT = readFileRelative("sales-kit.md").slice(0, 9000);

const TEMPLATES = (() => {
  try {
    return require("../templates.json");
  } catch (e) {
    return {};
  }
})();

function sampleTemplates(n) {
  const values = Object.values(TEMPLATES).flat().filter(Boolean);
  const out = [];
  const used = new Set();
  while (out.length < n && out.length < values.length) {
    const i = Math.floor(Math.random() * values.length);
    if (used.has(i)) continue;
    used.add(i);
    out.push(values[i].split("\n").slice(0, 5).join("\n"));
  }
  return out.join("\n\n---\n\n");
}

function avoidBlock(avoid) {
  const list = (avoid || []).filter(Boolean).slice(-4);
  if (!list.length) return "";
  return (
    "\nမကြာသေးဘဲ တင်ပြီးသား post တွေ (ဒါတွေနဲ့ မထပ်အောင် ရှောင်ပါ — ဖွင့်ပုံ၊ အကြောင်း၊ စာသားတချို့ လုံးဝမထပ်ရ):\n" +
    list.map((t) => "- " + String(t).slice(0, 80)).join("\n") +
    "\n\n"
  );
}

async function generateDraft({ am = true, avoid = [] } = {}) {
  const flavor = am
    ? "ဒီ post က သင်ကြားရေးပုံစံ (value/tip) ဖြစ်ရမယ် — website/AI/automation နဲ့ပတ်သက်ပြီး လူတွေသုံးလို့ရတဲ့ အသုံးဝင်တဲ့အချက် တစ်ခု။"
    : "ဒီ post က စိတ်ဝင်စားမှု ရှာဖွေပုံစံ (promo/showcase) — ဝန်ဆောင်မှု/ဈေး/လက်တွေ့ဥပမာ ပြပြီး ဆက်သွယ်ဖို့ ညင်သာစွာ တိုက်တွန်း။";

  const prompt = [
    "သင်ဟာ H-Tech Studio (Yangon) ရဲ့ official Telegram channel (@h_tech_studio) စာရေးဆရာပါ။",
    "လူတစ်ယောက် ကိုယ်တိုင်ရေးထားသလိုမျိုး သဘာဝကျကျ ရေးရမယ် — စက်ရေးသလို စနစ်ကျနေတာ၊ ထပ်တူထပ်ခန္တဲ့ ပုံစံတွေ မဖြစ်ရဘူး။",
    "လိုအပ်ချက်:",
    "- မြန်မာလိုရေးရမယ် (နည်းပညာစကားလုံးတချို့ English ရောသုံးလို့ရ)",
    "- စာလုံးရေ 120–230 လောက်",
    "- ဖွင့်စာကြောင်း၊ စာပိုဒ်ဖွဲ့ပုံတွေ တိုင်းမတူအောင် ပြောင်းရေးရမယ်",
    "- emoji နည်းနည်းပဲ (spam ပုံမရ)",
    "- bullet list တွေမသုံးဘဲ စီးဆင်းနေတဲ့ စာကိုယ်လို ရေးရမယ်",
    "- ဖိအားပေးမခံရသလိုမျိုး သဘာဝ CTA — t.me/h_tech_studio သို့မဟုတ် t.me/hein_public_ai_bot တစ်ခုခု ထည့်",
    flavor,
    "",
    "Tone အမြည်းဥပမာတွေ (copy ချဖို့မဟုတ်ဘဲ ပုံစံကြည့်ဖို့):",
    sampleTemplates(3),
    "",
    "အရောင်းအချက်အလက် / ဈေးနှုန်း (အချက်အလက်သင့်ရင် သုံး):",
    SALES_KIT,
    "",
    avoidBlock(avoid),
    "အခု Telegram post တစ်ခု ရေးပါ။ Markdown/markdown symbols/formatting မသုံးရ။ ရေးထားတဲ့ post စာသားကိုပဲ ပြန်ပို့ပါ — အခြားဘာမှ မထည့်နဲ့။",
  ].join("\n");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.9,
      max_tokens: 800,
      messages: [{ role: "system", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text || text.length < 40) {
    throw new Error("Groq returned empty or too-short content");
  }
  return text;
}

// Retry once on empty/short output to avoid flaky generations.
async function generateDraftWithRetry(opts = {}) {
  try {
    return await generateDraft(opts);
  } catch (e) {
    return await generateDraft(opts);
  }
}

module.exports = { generateDraft, generateDraftWithRetry, MODEL };