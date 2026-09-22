/**
 * H-Tech Studio — Content / Info Bot Template
 * grammY-based Telegram knowledge bot.
 * Deploy to Vercel as serverless function.
 *
 * HOW IT WORKS:
 * 1. User sends /start → sees a main menu built from KNOWLEDGE sections.
 * 2. Each menu button opens a sub-menu / detail (products, services, pricing, location, contact, FAQ).
 * 3. /search <keyword> does a keyword search across all knowledge data.
 * 4. /status and /broadcast are admin-only commands.
 * 5. Unknown text → prompted to use menu or FAQ search.
 *
 * CUSTOMIZE: Edit the CONFIG and KNOWLEDGE objects below.
 * NO AI API KEY NEEDED — this is a structured knowledge base bot.
 */

const { Bot, InlineKeyboard, session } = require("grammy");

/* ============================================================
   ⚙️  CUSTOMIZE HERE — CONFIG
   ============================================================
   Change these values to match your client's business.
*/

const CONFIG = {
  // Bot identity
  BOT_NAME: "H-Tech Info Bot",
  ADMIN_CHAT_ID: 5414089645, // <-- Put your admin Telegram user ID here (number)

  // Business info
  BUSINESS_NAME: "H-Tech Studio",
  phone: "+95 9 123 456 789",
  address: "No.123, Sample Street, Sanchaung Township, Yangon, Myanmar",
  hours: "Mon–Sat: 9:00 AM – 6:00 PM / စနေ၊ တနင်္ဂနွေ: ပိတ်",
  telegramLink: "https://t.me/your_channel_username", // <-- Replace with actual channel/group link
  currency: "Ks",
  website: "https://your-website.com", // optional
};

/* ============================================================
   📚  CUSTOMIZE YOUR KNOWLEDGE HERE
   ============================================================
   This is the brain of the bot. Edit values to match the
   client's actual products, services, menu, FAQs, etc.
   Tags on FAQs help with /search keyword matching.
*/

const KNOWLEDGE = {
  // ── Products (physical goods) ──────────────────────────────
  products: [
    { name: "Web Design Package", price: "500,000", desc: "Responsive website, 5 pages, SEO basics" },
    { name: "Logo Design", price: "80,000", desc: "Professional logo + 2 revisions" },
    { name: "Mobile App Starter", price: "1,500,000", desc: "Cross-platform app (iOS + Android), MVP scope" },
    { name: "Social Media Kit", price: "120,000", desc: "20 templates for FB, IG, TikTok" },
    { name: "Business Card Design", price: "25,000", desc: "Front + back, print-ready PDF" },
  ],

  // ── Services (with pricing) ────────────────────────────────
  services: [
    { name: "Website Maintenance", price: "100,000/mo", desc: "Hosting, updates, minor edits" },
    { name: "SEO Optimization", price: "200,000/mo", desc: "Keyword research, on-page SEO, monthly report" },
    { name: "Social Media Management", price: "150,000/mo", desc: "Content calendar, posting, basic engagement" },
    { name: "Graphic Design", price: "50,000/hr", desc: "Flyers, banners, social posts" },
    { name: "Consultation (IT)", price: "Free", desc: "30-min free call for new clients" },
  ],

  // ── Menu (for restaurants / food businesses — leave empty array if not applicable) ──
  menu: [
    { name: "လေးဘာသာထမင်း (4-Dish Rice)", price: "3,500", desc: "ထမင်း + ဟင်း ၄မျိုး + ငါး/အသား" },
    { name: "အမဲသားကြော် (Fried Beef)", price: "4,500", desc: "အမဲသားကြော် + ထမင်း + အသုပ်" },
    { name: "ကြက်ဥကြော် (Fried Egg Rice)", price: "2,500", desc: "ထမင်း + ကြက်ဥကြော် + ဟင်း" },
    { name: "မုန့်ဟင်းခါး (Mohinga)", price: "2,000", desc: "မြန်မာ့ရိုးရာ မုန့်ဟင်းခါး" },
    { name: "လက်ဖက်ရည် (Tea)", price: "500", desc: "မြန်မာလက်ဖက်ရည်" },
    { name: "ဖျော်ရည် (Fresh Juice)", price: "1,500", desc: "လတ်ဆတ်သော ဖျော်ရည်" },
  ],

  // ── FAQs (keyword tags help /search) ────────────────────────
  faqs: [
    {
      q: "ငွေပေးချေနည်း / Payment Methods?",
      a: "Wave, KBZ Pay, ငွေသား Cash ဖြင့် ပေးနိုင်ပါတယ်။ ဘဏ်လွှဲ (KCB, AYA) လည်း ရပါတယ်။",
      tags: ["payment", "ငွေ", "pay", "transfer"],
    },
    {
      q: "Delivery ရှိလား?",
      a: "Yangon အတွင်း delivery အခမဲ့ပါ။ ပြင်ပမြို့များ ကား/လေယာဉ်ဖြင့် ပို့ဆောင်ပေးပါတယ်။",
      tags: ["delivery", "ပို့", "shipping", "လိပ်စာ"],
    },
    {
      q: "Refund Policy ရှိလား?",
      a: "ဝယ်ပြီး ၇ ရက်အတွင်း ပြဿနာရှိပါက refund/replace ပြန်လည်ပေးပါတယ်။",
      tags: ["refund", "return", "exchange", "ပြန်"],
    },
    {
      q: "Order ဘယ်လောက်ကြာမှ ရလဲ?",
      a: "Logo Design: ၃ ရက်၊ Website: ၂ ပတ်၊ App: ၁ လခန့် ကြာပါတယ်။",
      tags: ["order", "time", "duration", "ကြာ", "အချိန်"],
    },
    {
      q: "Free consultation ရှိလား?",
      a: "ဟုတ်ကဲ့၊ အသစ် customers များအတွက် မိနစ် ၃၀ အခမဲ့ consultation call ရပါတယ်။",
      tags: ["free", "consultation", "အခမဲ့"],
    },
    {
      q: "Contract / စာချုပ် ရှိလား?",
      a: "ဟုတ်ကဲ့၊ project စတင်ခင် service agreement/contract ချုပ်ပါတယ်။",
      tags: ["contract", "agreement", "စာချုပ်"],
    },
  ],

  // ── Location details ───────────────────────────────────────
  location: {
    address: CONFIG.address,
    mapLink: "https://maps.google.com/?q=16.8661,96.1951", // sample Yangon coords
    description: "Sanchaung မြောက်ဘက် အမှတ် ၁၂၃၊ လမ်းမကြီးအနီး",
  },

  // ── Hours ──────────────────────────────────────────────────
  hours: CONFIG.hours,

  // ── Contact ────────────────────────────────────────────────
  contact: {
    phone: CONFIG.phone,
    telegram: CONFIG.telegramLink,
    email: "info@htechstudio.com",
    facebook: "https://facebook.com/yourpage",
  },
};

/* ============================================================
   🤖  BOT LOGIC — no need to edit below (unless advanced)
   ============================================================ */

const bot = new Bot(process.env.BOT_TOKEN);

// ── Session: track known user IDs + current menu state ───────
bot.use(
  session({
    initial: () => ({ lastMenu: null }),
  })
);

// ── Known users set (in-memory; resets on cold start — acceptable for a single-server bot)
const knownUsers = new Set();

// ── Helper: build main menu keyboard ──────────────────────────
function buildMainMenu() {
  const kb = new InlineKeyboard();
  if (KNOWLEDGE.services.length > 0)
    kb.text("🛍 ထုတ်ကုန်/Service", "menu:services");
  if (KNOWLEDGE.menu.length > 0)
    kb.text("🍽 Menu", "menu:menu");
  kb.text("💰 ဈေးနှုန်း / Pricing", "menu:pricing");
  kb.row();
  kb.text("📍 လိပ်စာ/နာရီ", "menu:location");
  kb.text("📞 ဆက်သွယ်ရန်", "menu:contact");
  kb.row();
  kb.text("❓ FAQ", "menu:faq");
  return kb;
}

// ── Helper: format a list as numbered text ─────────────────────
function formatList(items, showPrice = false) {
  return items
    .map((item, i) => {
      let line = `${i + 1}. *${item.name}*`;
      if (showPrice && item.price) line += ` — ${item.price} ${CONFIG.currency}`;
      if (item.desc) line += `\n      ${item.desc}`;
      return line;
    })
    .join("\n\n");
}

// ── Helper: format FAQ ────────────────────────────────────────
function formatFaq(items) {
  return items
    .map((item, i) => `${i + 1}. *${item.q}*\n      ${item.a}`)
    .join("\n\n");
}

// ── /start command ────────────────────────────────────────────
bot.command("start", async (ctx) => {
  knownUsers.add(ctx.from.id);
  const text =
    `👋 Welcome to *${CONFIG.BOT_NAME}*\n` +
    `by *${CONFIG.BUSINESS_NAME}*\n\n` +
    `ငါ့ကို menu ကနေ သတင်းအချက်အလက် ရှာနိုင်ပါတယ်။\n` +
    `Below is the main menu — tap a button to explore.\n\n` +
    `🔍 You can also use /search <keyword> to search directly.`;

  await ctx.reply(text, {
    parse_mode: "Markdown",
    reply_markup: buildMainMenu(),
  });
});

// ── /search command ───────────────────────────────────────────
bot.command("search", async (ctx) => {
  const query = ctx.message.text.replace("/search", "").trim().toLowerCase();
  if (!query) {
    return ctx.reply("Usage: /search <keyword>\nExample: /search delivery");
  }

  const results = [];

  // Search services
  KNOWLEDGE.services.forEach((s) => {
    if (
      s.name.toLowerCase().includes(query) ||
      (s.desc && s.desc.toLowerCase().includes(query))
    ) {
      results.push(`🛍 *${s.name}* — ${s.price} ${CONFIG.currency}\n      ${s.desc}`);
    }
  });

  // Search products
  KNOWLEDGE.products.forEach((p) => {
    if (
      p.name.toLowerCase().includes(query) ||
      (p.desc && p.desc.toLowerCase().includes(query))
    ) {
      results.push(`📦 *${p.name}* — ${p.price} ${CONFIG.currency}\n      ${p.desc}`);
    }
  });

  // Search menu items
  KNOWLEDGE.menu.forEach((m) => {
    if (
      m.name.toLowerCase().includes(query) ||
      (m.desc && m.desc.toLowerCase().includes(query))
    ) {
      results.push(`🍽 *${m.name}* — ${m.price} ${CONFIG.currency}\n      ${m.desc}`);
    }
  });

  // Search FAQs (including tags)
  KNOWLEDGE.faqs.forEach((f) => {
    const searchable = (
      f.q +
      " " +
      f.a +
      " " +
      (f.tags ? f.tags.join(" ") : "")
    ).toLowerCase();
    if (searchable.includes(query)) {
      results.push(`❓ *${f.q}*\n      ${f.a}`);
    }
  });

  if (results.length === 0) {
    return ctx.reply(
      `❌ No results for "*${query}*".\n\nTry /search with a different keyword, or use /start to browse the menu.`,
      { parse_mode: "Markdown" }
    );
  }

  const header = `🔍 *Search results for "${query}"* (${results.length} found):\n\n`;
  await ctx.reply(header + results.join("\n\n---\n\n"), {
    parse_mode: "Markdown",
    reply_markup: new InlineKeyboard().text("🔙 Main Menu", "menu:home"),
  });
});

// ── /status (admin only) ──────────────────────────────────────
bot.command("status", async (ctx) => {
  if (ctx.from.id !== CONFIG.ADMIN_CHAT_ID) {
    return ctx.reply("⛔ Admin only command.");
  }
  await ctx.reply(
    `📊 *Bot Status*\n\n` +
      `Users tracked: ${knownUsers.size}\n` +
      `Business: ${CONFIG.BUSINESS_NAME}\n` +
      `Bot: ${CONFIG.BOT_NAME}\n` +
      `Services: ${KNOWLEDGE.services.length}\n` +
      `Products: ${KNOWLEDGE.products.length}\n` +
      `Menu items: ${KNOWLEDGE.menu.length}\n` +
      `FAQs: ${KNOWLEDGE.faqs.length}`,
    { parse_mode: "Markdown" }
  );
});

// ── /broadcast (admin only) ───────────────────────────────────
bot.command("broadcast", async (ctx) => {
  if (ctx.from.id !== CONFIG.ADMIN_CHAT_ID) {
    return ctx.reply("⛔ Admin only command.");
  }
  const msg = ctx.message.text.replace("/broadcast", "").trim();
  if (!msg) {
    return ctx.reply("Usage: /broadcast <message>\nSends to all known users.");
  }

  let sent = 0;
  let failed = 0;
  for (const userId of knownUsers) {
    try {
      await ctx.api.sendMessage(userId, `📢 *Broadcast*\n\n${msg}`, {
        parse_mode: "Markdown",
      });
      sent++;
    } catch {
      failed++;
    }
  }

  await ctx.reply(`📢 Broadcast done. Sent: ${sent}, Failed: ${failed}`);
});

// ── Inline callback handler ───────────────────────────────────
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  // ── Home ──
  if (data === "menu:home") {
    return ctx.editMessageText(
      `👋 *${CONFIG.BOT_NAME}* — Main Menu\nTap a button below:`,
      {
        parse_mode: "Markdown",
        reply_markup: buildMainMenu(),
      }
    );
  }

  // ── Services / Products ──
  if (data === "menu:services") {
    const allItems = [...KNOWLEDGE.products, ...KNOWLEDGE.services];
    const text = `🛍 *ထုတ်ကုန်များ / Services*\n\n${formatList(allItems, true)}`;
    return ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .text("💰 Full Pricing", "menu:pricing")
        .row()
        .text("🔙 Main Menu", "menu:home"),
    });
  }

  // ── Menu (food) ──
  if (data === "menu:menu") {
    const text = `🍽 *${CONFIG.BUSINESS_NAME} Menu*\n\n${formatList(KNOWLEDGE.menu, true)}`;
    return ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .text("🔙 Main Menu", "menu:home"),
    });
  }

  // ── Pricing ──
  if (data === "menu:pricing") {
    let text = `💰 *ဈေးနှုန်း / Pricing* — ${CONFIG.currency}\n\n`;

    if (KNOWLEDGE.products.length > 0) {
      text += `*📦 Products:*\n${formatList(KNOWLEDGE.products, true)}\n\n`;
    }
    if (KNOWLEDGE.services.length > 0) {
      text += `*🛠 Services:*\n${formatList(KNOWLEDGE.services, true)}\n\n`;
    }
    if (KNOWLEDGE.menu.length > 0) {
      text += `*🍽 Menu:*\n${formatList(KNOWLEDGE.menu, true)}\n\n`;
    }

    text += `📞 _For custom quotes, contact us._`;

    return ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .text("📞 Contact for Quote", "menu:contact")
        .row()
        .text("🔙 Main Menu", "menu:home"),
    });
  }

  // ── Location + Hours ──
  if (data === "menu:location") {
    const text =
      `📍 *လိပ်စာ / Location*\n\n` +
      `${KNOWLEDGE.location.description}\n` +
      `${KNOWLEDGE.location.address}\n\n` +
      `🗺 [Google Maps](${KNOWLEDGE.location.mapLink})\n\n` +
      `🕐 *နာရီ / Hours*\n${KNOWLEDGE.hours}`;

    return ctx.editMessageText(text, {
      parse_mode: "Markdown",
      disable_web_page_preview: false,
      reply_markup: new InlineKeyboard()
        .text("📞 Contact", "menu:contact")
        .row()
        .text("🔙 Main Menu", "menu:home"),
    });
  }

  // ── Contact ──
  if (data === "menu:contact") {
    const c = KNOWLEDGE.contact;
    const text =
      `📞 *ဆက်သွယ်ရန် / Contact*\n\n` +
      `📱 Phone: ${c.phone}\n` +
      `✉️ Email: ${c.email}\n` +
      `💬 Telegram: [Open](${c.telegram})\n` +
      `📘 Facebook: [Open](${c.facebook})\n\n` +
      `📍 [View on Map](${KNOWLEDGE.location.mapLink})`;

    return ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .text("📍 Location & Hours", "menu:location")
        .row()
        .text("🔙 Main Menu", "menu:home"),
    });
  }

  // ── FAQ ──
  if (data === "menu:faq") {
    const text =
      `❓ *FAQ / မေးလေ့ရှိသည့်မေးခွန်းများ*\n\n` +
      `${formatFaq(KNOWLEDGE.faqs)}\n\n` +
      `_🔍 Use /search <keyword> for specific questions._`;

    return ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard()
        .text("📞 Still need help?", "menu:contact")
        .row()
        .text("🔙 Main Menu", "menu:home"),
    });
  }
});

// ── Fallback: unknown text ────────────────────────────────────
bot.on("message:text", async (ctx) => {
  knownUsers.add(ctx.from.id);
  await ctx.reply(
    `🤔 I didn't understand that. Please use the menu or try /search.\n\n` +
      `Example: /search delivery`,
    {
      reply_markup: new InlineKeyboard()
        .text("📋 Main Menu", "menu:home")
        .row()
        .text("📞 Contact Us", "menu:contact"),
    }
  );
});

// ── Error handler ─────────────────────────────────────────────
bot.catch((err) => {
  console.error("Bot error:", err);
});

module.exports = bot;
