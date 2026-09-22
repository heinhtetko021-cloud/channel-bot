// ============================================================================
// H-Tech Studio - Telegram Customer Support / FAQ Bot  (grammY + Vercel)
// ----------------------------------------------------------------------------
// This is the CORE bot logic. Deployed as a Vercel serverless function.
// Customers chat with this bot to get instant FAQ answers, and can escalate
// to a human (the owner) when needed.
//
// HOW CUSTOMIZATION WORKS:
//   1) Fill in the "CUSTOMIZE HERE" block below (lines ~30-40).
//   2) Edit the FAQ array in the "CUSTOMIZE YOUR FAQ HERE" block (lines ~45+).
//   3) Deploy to Vercel and call setWebhook (see README.md).
// No other changes are required to make the bot work.
// ============================================================================

import { Bot, InlineKeyboard } from "grammy";

// ============================================================================
// CUSTOMIZE HERE ===> Everything about YOUR bot / business lives below.
// ============================================================================

const BOT_TOKEN = process.env.BOT_TOKEN; // From BotFather — set in .env / Vercel
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // Owner's Telegram chat id (for human escalation notifications)

const BOT_NAME = "H-Tech Support Bot"; // Display name shown to customers
const SHOP_NAME = "H-Tech Store"; // Your shop / brand name
const CHANNEL_ID = process.env.ADMIN_CHAT_ID; // Owner chat id (channel) — notifications go here

// Contact details shown in the "👤 ဆက်သွယ်ရန်" (Contact) menu.
const CONTACT_INFO = {
  phone: "09-123 456 789", // CUSTOMIZE: Your phone number
  telegram: "https://t.me/htech_studio", // CUSTOMIZE: Your Telegram profile / contact link
  hours: "9:00 AM - 6:00 PM (Mon - Sat)",
  address: "No. 12, Main Road, Yangon, Myanmar",
};

// ============================================================================
// CUSTOMIZE YOUR FAQ HERE ===> Edit the FAQ entries to match YOUR business.
// ----------------------------------------------------------------------------
// Each entry has:
//   tags     -> array of keywords (English & Burmese) matched against the
//               customer's typed question (case-insensitive substring match).
//   question -> the question shown to the customer.
//   answer   -> the reply shown to the customer.
// ============================================================================

const FAQ = [
  {
    tags: ["delivery", "ship", "ပို့", "ပို့ဆောင်", "ကြာမြင့်", "ချိန်", "ဘယ်လောက်ကြာ"],
    question: "ပို့ဆောင်မှု ဘယ်လောက်ကြာလဲ? (How long does delivery take?)",
    answer:
      "📦 ပို့ဆောင်မှု\n\n" +
      "• Yangon: 1 - 2 ရက်\n" +
      "• အခြားမြို့များ: 2 - 5 ရက်\n" +
      "• အော်ဒါ အတည်ပြုပြီးနောက် တစ်ရက်အတွင်း ပို့ပေးပါသည်။\n\n" +
      "Delivery: Yangon 1-2 days, other cities 2-5 days.",
  },
  {
    tags: ["payment", "pay", "kbz", "wave", "cod", "ငွေ", "ပေးချေ", "ဘယ်လိုပေးရလဲ"],
    question: "ငွေဘယ်လိုပေးရလဲ? (How can I pay?)",
    answer:
      "💳 ငွေပေးချေမှု\n\n" +
      "• KBZPay: 09-123 456 789\n" +
      "• WavePay: 09-123 456 789\n" +
      "• COD (cash on delivery): ရရှိမှ ပေးချေနိုင်ပါသည်။\n\n" +
      "We accept KBZPay, WavePay and Cash on Delivery (COD).",
  },
  {
    tags: ["return", "refund", "exchange", "ပြန်လည်", "ပြောင်း", "ပြန်ပေး"],
    question: "ပစ္စည်း ပြန်လည်ပေးပို့လို့ရလား? (Can I return an item?)",
    answer:
      "↩️ ပြန်လည်ပေးပို့မှု\n\n" +
      "• ပစ္စည်းလက်ခံရရှိပြီး 7 ရက်အတွင်း ပြန်လည်ပေးပို့နိုင်ပါသည်။\n" +
      "• ပစ္စည်းသည် မပျက်စီးဘဲ၊ အသုံးမပြုရသေးသည့် အနေအထားဖြစ်ရပါမည်။\n" +
      "• ပြန်ပို့ခ (return shipping) သည် ဝယ်ယူသူ တာဝန်ဖြစ်ပါသည်။\n\n" +
      "Returns accepted within 7 days in original condition.",
  },
  {
    tags: ["hour", "time", "open", "ဖွင့်", "ချိန်", "ရုံးချိန်", "နာရီ"],
    question: "ဖွင့်ချိန် ဘယ်အချိန်လဲ? (What are your opening hours?)",
    answer:
      "🕒 ဖွင့်ချိန်\n\n" +
      "• တနင်္လာ - စနေနေ့: 9:00 AM - 6:00 PM\n" +
      "• တနင်္ဂနွေနေ့: ပိတ်ပါသည်။\n\n" +
      "Opening hours: Mon - Sat, 9 AM - 6 PM. Closed on Sundays.",
  },
  {
    tags: ["location", "address", "where", "နေရာ", "လိပ်စာ", "ဘယ်မှာ"],
    question: "သင်တို့ရဲ့ နေရာက ဘယ်မှာလဲ? (Where is your location?)",
    answer:
      "📍 လိပ်စာ\n\n" +
      CONTACT_INFO.address +
      "\n\nYou can also view our location via the contact menu.",
  },
  {
    tags: ["contact", "reach", "call", "message", "ဆက်သွယ်", "ဖုန်း", "ဆက်သွယ်ရန်"],
    question: "ဘယ်လိုဆက်သွယ်ရမလဲ? (How can I contact you?)",
    answer:
      "👤 ဆက်သွယ်ရန်\n\n" +
      "• ဖုန်း / 📞 " +
      CONTACT_INFO.phone +
      "\n" +
      "• Telegram: " +
      CONTACT_INFO.telegram +
      "\n\n" +
      "မက်ဆေ့ချ် ပို့လို့လည်းရပါတယ် — /contact",
  },
  {
    tags: ["warranty", "guarantee", "အာမခံ", "အာမခံချက်", "warranty"],
    question: "အာမခံ ရှိပါသလား? (Is there a warranty?)",
    answer:
      "🛡️ အာမခံ\n\n" +
      "• လျှပ်စစ်ပစ္စည်းများ: 3 လ အာမခံ\n" +
      "• အခြားပစ္စည်းများ: 7 ရက် အရည်အသွေးအာမခံ\n" +
      "• အာမခံအတွက် ငွေပြန်မစားပါ — အစားထိုး (exchange) ပေးပါသည်။\n\n" +
      "Warranty available on electronics (3 months) and all items.",
  },
  {
    tags: ["order", "buy", "book", "အော်ဒါ", "မှာ", "ဝယ်", "ဘယ်လိုမှာ", "how to order"],
    question: "ဘယ်လိုမှာယူရမလဲ? (How do I place an order?)",
    answer:
      "🛒 မှာယူနည်း\n\n" +
      "1) သင်ဝယ်လိုသော ပစ္စည်းကို ရွေးချယ်ပါ။\n" +
      "2) နာမည်၊ လိပ်စာ၊ ဖုန်းနံပါတ်ကို ပေးပို့ပါ။\n" +
      "3) ငွေပေးချေမှု အတည်ပြုပြီးနောက် ပစ္စည်းပို့ပေးပါသည်။\n\n" +
      "To order: send us the item, your name, address & phone, then pay.",
  },
  {
    tags: ["price", "cost", "fee", "ဈေး", "စျေးနှုန်း", "ဘယ်လောက်"],
    question: "ပစ္စည်းဈေးနှုန်း ဘယ်လောက်လဲ? (What are the prices?)",
    answer:
      "💰 ဈေးနှုန်း\n\n" +
      "ဈေးနှုန်းများကို ကျွန်ုပ်တို့ရဲ့ channel / page တွင် ကြည့်ရှုနိုင်ပါသည်။\n" +
      "ပို့ဆောင်ခ (delivery fee) သည် မြို့အလိုက် ကွဲပြားပါသည်။\n\n" +
      "Check our channel / catalog for current prices & shipping fees.",
  },
  {
    tags: ["refund", "ငွေပြန်", "ငွေပြန်အမ်း", "refund"],
    question: "ငွေပြန်အမ်းရယူလို့ရလား? (Can I get a refund?)",
    answer:
      "🔄 ငွေပြန်အမ်း\n\n" +
      "• ပစ္စည်း ထိခိုက်ပျက်စီးလာပါက ငွေပြန်အမ်း သို့မဟုတ် အစားထိုးပေးပါသည်။\n" +
      "• ဖောက်သည် နှစ်သက်မှု မရှိပါက exchange သာပေးပါသည်။\n" +
      "• ပြန်အမ်းရန် 7 ရက်အတွင်း ဆက်သွယ်ရန် လိုပါသည်။\n\n" +
      "Refunds/exchanges handled within 7 days of receipt.",
  },
];

// Simple in-memory "awaiting search input" tracker (chatId -> true).
// NOTE: On serverless (Vercel) the module may be re-created per request, so
// this is a convenience flag only. If it's lost, customers can still just
// type their question (see isQuestion detection below), so it remains robust.
const searchingChats = new Set();

// ============================================================================
// BOT SETUP (rarely needs changing)
// ============================================================================

// If no BOT_TOKEN is provided, export `bot` as a stub so Vercel won't crash
// before env vars are configured. In production this is set.
export const bot =
  BOT_TOKEN && BOT_TOKEN !== "BOT_TOKEN"
    ? new Bot(BOT_TOKEN)
    : null;

// Human-escalation keywords (English + Burmese terms a customer might type).
const HUMAN_KEYWORDS = ["human", "agent", "people", "operator", "လူ", "ဆရာ", "support", "help"];

// ---------- Helper: notify the shop owner / admin chat ----------
async function notifyOwner(text) {
  if (!bot || !ADMIN_CHAT_ID) return;
  try {
    await bot.api.sendMessage(ADMIN_CHAT_ID, text, { disable_web_page_preview: true });
  } catch (err) {
    console.error("Failed to notify owner:", err);
  }
}

// ---------- Helper: format contact message ----------
function contactMessage() {
  return (
    "👤 " + BOT_NAME + " — ဆက်သွယ်ရန်\n\n" +
    "• ဖုန်း: 📞 " + CONTACT_INFO.phone + "\n" +
    "• Telegram: " + CONTACT_INFO.telegram + "\n" +
    "• ဖွင့်ချိန်: " + CONTACT_INFO.hours + "\n" +
    "• လိပ်စာ: " + CONTACT_INFO.address
  );
}

// ---------- Helper: build the main menu inline keyboard ----------
function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("📦 ပို့ဆောင်မှု", "cat:delivery")
    .row()
    .text("💳 ငွေပေးချေမှု", "cat:payment")
    .row()
    .text("📍 လိပ်စာ", "cat:location")
    .row()
    .text("👤 ဆက်သွယ်ရန်", "cat:contact")
    .row()
    .text("❓ ရှာဖွေရန်", "cat:search");
}

// ============================================================================
// SETUP ALL HANDLERS (only if the bot is configured)
// ============================================================================
if (bot) {
  // ---------- /start ----------
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "မင်္ဂလာပါ! 👋 " +
        SHOP_NAME +
        " မှ ကြိုဆိုပါသည်။\n\n" +
        "ကျွန်ုပ်တို့ရဲ့ FAQ ကို ရွေးချယ်မေးမြန်းနိုင်ပါသည်:\n" +
        "• အောက်က menu မှ ရွေးချယ်ပါ\n" +
        "• သို့မဟုတ် ❓ ရှာဖွေရန် ဖြင့် ကိုယ်ပိုင်မေးခွန်း မေးပါ\n\n" +
        "လူ (human) နဲ့ စကားပြောချင်ရင် \"human\" သို့မဟုတ် \"လူ\" လို့ရိုက်ပါ 🙂",
      { reply_markup: mainMenuKeyboard() }
    );
  });

  // ---------- Handle inline menu button clicks ----------
  bot.callbackQuery(/^cat:(.+)$/, async (ctx) => {
    const tag = ctx.match[1];
    await ctx.answerCallbackQuery();

    // Category → direct FAQ answer by matching the category tag.
    if (tag === "delivery") return editWithFaqAnswer(ctx, "delivery");
    if (tag === "payment") return editWithFaqAnswer(ctx, "payment");
    if (tag === "location") return editWithFaqAnswer(ctx, "location");
    if (tag === "contact") {
      const kb = new InlineKeyboard().text("🔙 နောက်သို့", "back");
      await ctx.editMessageText(contactMessage(), { reply_markup: kb, disable_web_page_preview: true });
      return;
    }
    if (tag === "search") {
      await ctx.editMessageText(
        "❓ ရှာဖွေရန်\n\n" +
          "ကျေးဇူးပြု၍ သင်သိလိုသည့် မေးခွန်းကို အောက်တွင် ရိုက်ထည့်ပါ။\n" +
          "ဥပမာ: \"ပို့ဆောင်မှု ဘယ်လောက်ကြာလဲ?\" သို့မဟုတ် \"ငွေဘယ်လိုပေးရလဲ?\"\n\n" +
          "Please type your question below.",
        { reply_markup: new InlineKeyboard().text("🔙 နောက်သို့", "back") }
      );
      // Set a flag so the next message is treated as a search query.
      searchingChats.add(ctx.chat.id);
      return;
    }
  });

  // ---------- Back button ----------
  bot.callbackQuery("back", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      "မင်္ဂလာပါ! 👋 " + SHOP_NAME + "\n\nအောက်က menu မှ ရွေးချယ်ပါ။",
      { reply_markup: mainMenuKeyboard() }
    );
  });

  // ---------- "Contact" / customer info helper ----------
  async function editWithFaqAnswer(ctx, categoryTag) {
    // Find a category keyword like "delivery"/"payment"/"location" among FAQ tags.
    const item = FAQ.find((f) =>
      f.tags.some((t) => t.toLowerCase().includes(categoryTag.toLowerCase()))
    );
    const msg = item
      ? item.question + "\n\n" + item.answer
      : "ဤအကြောင်းအရာကို မတွေ့ရပါ။ ❓ ရှာဖွေရန် ဖြင့် မေးမြန်းပါ။";
    const kb = new InlineKeyboard().text("🔙 နောက်သို့", "back");
    await ctx.editMessageText(msg, { reply_markup: kb, disable_web_page_preview: true });
  }

  // ---------- Handle regular text messages (search + human escalation) ----------
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim().toLowerCase();
    const userId = ctx.from?.id;
    const userName = ctx.from?.first_name || "Unknown";

    // 1) Human escalation keywords
    const isHumanEscalation = HUMAN_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
    if (isHumanEscalation) {
      // Notify the owner with full customer info.
      await notifyOwner(
        "🚨 *Human assistance requested*\n\n" +
          "• User ID: `" + userId + "`\n" +
          "• Name: " + userName + "\n" +
          "• Username: @" + (ctx.from?.username || "n/a") + "\n\n" +
          "Message: \"" + ctx.message.text + "\""
      );
      await ctx.reply(
        "လူကိုယ်တိုင် (human agent) နဲ့ ဆက်သွယ်ပါမည်။ 📞\n\n" +
          "ကျွန်ုပ်တို့ရဲ့ အဖွဲ့သားတစ်ဦးက မကြာမီ ဆက်သွယ်ပါမည်။\n" +
          "One of our team will contact you shortly."
      );
      return;
    }

    // 2) Search mode: anyone who started "search" via menu, OR any free-text
    //    question. We match keywords across question, answer and tags.
    const isQuestion = text.includes("?") || text.includes("？") || text.includes("လဲ") || text.includes("လား");
    if (searchingChats.has(ctx.chat.id) || isQuestion) {
      searchingChats.delete(ctx.chat.id);

      // Find the best match by scoring how many tags matched, plus substrings
      // in the question/answer text itself.
      let best = null;
      let bestScore = 0;
      for (const item of FAQ) {
        let score = 0;
        for (const tag of item.tags) {
          const t = tag.toLowerCase();
          if (text.includes(t)) score += 3; // strong: tag matched
          else if (item.question.toLowerCase().includes(t)) score += 1;
          else if (item.answer.toLowerCase().includes(t)) score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          best = item;
        }
      }

      if (best && bestScore > 0) {
        // Reply with the closest match.
        await ctx.reply("🔎 အကောင်းဆုံးဖြေဆိုထားချက်:\n\n" + best.question + "\n\n" + best.answer, {
          reply_markup: new InlineKeyboard().text("🔙 နောက်သို့", "back"),
          disable_web_page_preview: true,
        });
      } else {
        // No matching answer → fallback to human.
        await notifyOwner(
          "❓ *Unanswered question*\n\n" +
            "• User ID: `" + userId + "`\n" +
            "• Name: " + userName + "\n\n" +
            "Question: \"" + ctx.message.text + "\""
        );
        await ctx.reply(
          "😓 တောင်းပန်ပါသည်၊ ထိုမေးခွန်းအတွက် ဖြေဆိုချက် မတွေ့ရပါ။\n\n" +
            "ကျွန်ုပ်တို့ရဲ့ အဖွဲ့သားတစ်ဦးက သင့်ကို မကြာမီ ဆက်သွယ်ပါမည်။\n" +
            "Sorry, we couldn't find an answer — one of our team will reply to you.",
          { reply_markup: new InlineKeyboard().text("📞 ဆက်သွယ်ရန်", "cat:contact") }
        );
      }
      return;
    }

    // 3) Otherwise, show the main menu for unrecognized input.
    await ctx.reply(
      "မင်္ဂလာပါ! အောက်က menu မှ ရွေးချယ်ပါ၊ သို့မဟုတ် မေးခွန်းကို မေးနိုင်ပါသည်။",
      { reply_markup: mainMenuKeyboard() }
    );
  });

  // ---------- Error handling: log & notify, never crash ----------
  bot.catch((err) => {
    console.error("Bot error:", err);
    notifyOwner("⚠️ Bot error: " + (err.error?.description || err.message || String(err)));
  });

  // ---------- Contact command (also reachable via /contact) ----------
  bot.command("contact", async (ctx) => {
    await ctx.reply(contactMessage(), {
      reply_markup: new InlineKeyboard().text("🔙 နောက်သို့", "back"),
      disable_web_page_preview: true,
    });
  });
} else {
  // No token configured — provide a helpful error for the developer.
  console.warn("BOT_TOKEN missing. Set BOT_TOKEN in environment / .env before deploying.");
}

// Export the handler for Vercel (used by api/webhook.js).
export default bot;
