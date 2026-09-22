import { Bot } from "grammy";
import { InlineKeyboard } from "grammy";

// ============================================================
//  BOOKING BOT — H-Tech Studio (Myanmar Freelance Template)
//  Use: clinics, salons, tuition, restaurants, services
//  Base: grammY  |  Deploy: Vercel Serverless
// ============================================================

// ──────────────────────────────────────────────────────────────
//  CUSTOMIZE HERE — Main Config
// ──────────────────────────────────────────────────────────────
const BOT_NAME = "My Booking Bot";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "123456789";
const BUSINESS_NAME = "H-Tech Clinic";
const CURRENCY = "Ks";
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
//  CUSTOMIZE YOUR SERVICES HERE
//  Add, remove, or edit services for your client's business.
// ──────────────────────────────────────────────────────────────
const SERVICES = [
  {
    name: "General Checkup",
    durationMin: 30,
    price: 5000,
    emoji: "🩺",
  },
  {
    name: "Dental Cleaning",
    durationMin: 45,
    price: 15000,
    emoji: "🦷",
  },
  {
    name: "Vaccination",
    durationMin: 15,
    price: 10000,
    emoji: "💉",
  },
  {
    name: "Eye Exam",
    durationMin: 30,
    price: 8000,
    emoji: "👁",
  },
];
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
//  CUSTOMIZE HERE — Bookable Hours
//  Business operating hours for available time slots.
// ──────────────────────────────────────────────────────────────
const BOOKABLE_START_HOUR = 9;   // 9 AM
const BOOKABLE_END_HOUR = 17;    // 5 PM
const SLOT_INTERVAL_MIN = 60;    // 60-minute slots
const ADVANCE_BOOKING_DAYS = 7;  // Show next 7 days
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
//  Session Store (in-memory — swap for Upstash Redis in prod)
// ──────────────────────────────────────────────────────────────
const sessions = new Map();
// Shape: { step, service, date, time, name, phone }

// ──────────────────────────────────────────────────────────────
//  Bookings Store (in-memory — swap for DB in prod)
// ──────────────────────────────────────────────────────────────
const bookings = new Map();
// Key: user id → Array of booking objects
let bookingCounter = 1000;

// ──────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, { step: null });
  }
  return sessions.get(userId);
}

function clearSession(userId) {
  sessions.delete(userId);
}

function generateRef() {
  bookingCounter++;
  return `BK-${bookingCounter}`;
}

/** Return array of { date, label } for next N days (no weekends optional) */
function getNextDays(n) {
  const days = [];
  const now = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
    const label = `${weekday}, ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    days.push({ date: dateStr, label });
  }
  return days;
}

/** Return available time slots for a given date string */
function getAvailableSlots(dateStr, userId) {
  const slots = [];
  for (let h = BOOKABLE_START_HOUR; h < BOOKABLE_END_HOUR; h += SLOT_INTERVAL_MIN / 60) {
    const hh = String(h).padStart(2, "0");
    const timeStr = `${hh}:00`;
    // Check if this slot is already booked by anyone
    let taken = false;
    for (const [uid, userBookings] of bookings) {
      for (const b of userBookings) {
        if (b.date === dateStr && b.time === timeStr && b.status !== "cancelled") {
          taken = true;
          break;
        }
      }
      if (taken) break;
    }
    if (!taken) {
      slots.push(timeStr);
    }
  }
  return slots;
}

/** Build confirmation text */
function buildConfirmText(session) {
  const svc = SERVICES.find((s) => s.name === session.service);
  return [
    `📋 *Booking Confirmation*`,
    ``,
    `🏪 *${BUSINESS_NAME}*`,
    ``,
    `💇 Service: ${svc ? svc.emoji : ""} ${session.service}`,
    `💰 Price: ${svc ? svc.price.toLocaleString() : "?"} ${CURRENCY}`,
    `⏱ Duration: ${svc ? svc.durationMin : "?"} min`,
    `📅 Date: ${session.date}`,
    `🕐 Time: ${session.time}`,
    `👤 Name: ${session.name}`,
    `📞 Phone: ${session.phone}`,
    ``,
    `Reply *Confirm* to finalize or *Cancel* to abort.`,
  ].join("\n");
}

/** Format a booking for display */
function fmtBooking(b) {
  const statusIcon =
    b.status === "confirmed"
      ? "✅"
      : b.status === "cancelled"
        ? "❌"
        : "⏳";
  return `${statusIcon} \`${b.ref}\` — ${b.service}\n   📅 ${b.date} at ${b.time} | ${b.name}`;
}

// ──────────────────────────────────────────────────────────────
//  Bot Init
// ──────────────────────────────────────────────────────────────
const bot = new Bot(process.env.BOT_TOKEN);

// ──────────────────────────────────────────────────────────────
//  /start — Welcome + main menu
// ──────────────────────────────────────────────────────────────
bot.command("start", async (ctx) => {
  clearSession(ctx.from.id);
  const kb = new InlineKeyboard()
    .text("📅 Book Now", "menu_book")
    .row()
    .text("📋 My Bookings", "menu_mybookings");

  await ctx.reply(
    [
      `👋 Welcome to *${BUSINESS_NAME}*!`,
      ``,
      `I can help you book an appointment quickly.`,
      ``,
      `Choose an option below 👇`,
    ].join("\n"),
    { reply_markup: kb, parse_mode: "Markdown" }
  );
});

// ──────────────────────────────────────────────────────────────
//  Menu callbacks
// ──────────────────────────────────────────────────────────────
bot.callbackQuery("menu_book", async (ctx) => {
  await ctx.answerCallbackQuery();
  const sess = getSession(ctx.from.id);
  sess.step = "choose_service";

  const kb = new InlineKeyboard();
  for (const svc of SERVICES) {
    kb.text(
      `${svc.emoji} ${svc.name} — ${svc.price.toLocaleString()} ${CURRENCY} (${svc.durationMin}m)`,
      `svc:${svc.name}`
    );
    kb.row();
  }
  kb.text("⬅ Cancel", "cancel_flow");

  await ctx.editMessageText(
    `📅 *Choose a Service*\n\nPick the service you'd like to book:`,
    { reply_markup: kb, parse_mode: "Markdown" }
  );
});

bot.callbackQuery("menu_mybookings", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userBookings = bookings.get(String(ctx.from.id)) || [];
  if (userBookings.length === 0) {
    await ctx.editMessageText("📋 You have no bookings yet.\n\nTap /start to book one.");
    return;
  }
  const lines = userBookings.slice(-10).reverse().map(fmtBooking);
  await ctx.editMessageText(
    `📋 *Your Bookings*\n\n${lines.join("\n\n")}`,
    { parse_mode: "Markdown" }
  );
});

// ──────────────────────────────────────────────────────────────
//  Service selection
// ──────────────────────────────────────────────────────────────
bot.callbackQuery(/^svc:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const svcName = ctx.match[1];
  const sess = getSession(ctx.from.id);

  if (sess.step !== "choose_service") {
    await ctx.editMessageText("Session expired. Please /start again.");
    return;
  }

  sess.service = svcName;
  sess.step = "choose_date";

  const days = getNextDays(ADVANCE_BOOKING_DAYS);
  const kb = new InlineKeyboard();
  for (const d of days) {
    kb.text(d.label, `date:${d.date}:${d.label}`);
    kb.row();
  }
  kb.text("⬅ Back", "menu_book");

  await ctx.editMessageText(
    `📅 *${svcName}*\n\nSelect a date:`,
    { reply_markup: kb, parse_mode: "Markdown" }
  );
});

// ──────────────────────────────────────────────────────────────
//  Date selection
// ──────────────────────────────────────────────────────────────
bot.callbackQuery(/^date:(.+):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const dateStr = ctx.match[1];
  const dateLabel = ctx.match[2];
  const sess = getSession(ctx.from.id);

  if (sess.step !== "choose_date") {
    await ctx.editMessageText("Session expired. Please /start again.");
    return;
  }

  sess.date = dateStr;
  sess.dateLabel = dateLabel;
  sess.step = "choose_time";

  const slots = getAvailableSlots(dateStr, ctx.from.id);
  if (slots.length === 0) {
    await ctx.editMessageText(
      `❌ No available slots for *${dateLabel}*.\n\nPlease choose a different date.`,
      { parse_mode: "Markdown" }
    );
    // Go back to date step
    sess.step = "choose_date";
    const days = getNextDays(ADVANCE_BOOKING_DAYS);
    const kb = new InlineKeyboard();
    for (const d of days) {
      kb.text(d.label, `date:${d.date}:${d.label}`);
      kb.row();
    }
    kb.text("⬅ Back", "menu_book");
    await ctx.editMessageText(
      `📅 *${sess.service}*\n\nSelect a date:`,
      { reply_markup: kb, parse_mode: "Markdown" }
    );
    return;
  }

  const kb = new InlineKeyboard();
  for (const s of slots) {
    kb.text(`🕐 ${s}`, `time:${s}`);
    kb.row();
  }
  kb.text("⬅ Back", `date:${dateStr}:${dateLabel}`);

  await ctx.editMessageText(
    `📅 *${dateLabel}*\n\nAvailable time slots:`,
    { reply_markup: kb, parse_mode: "Markdown" }
  );
});

// ──────────────────────────────────────────────────────────────
//  Time selection → ask for name
// ──────────────────────────────────────────────────────────────
bot.callbackQuery(/^time:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const time = ctx.match[1];
  const sess = getSession(ctx.from.id);

  if (sess.step !== "choose_time") {
    await ctx.editMessageText("Session expired. Please /start again.");
    return;
  }

  sess.time = time;
  sess.step = "ask_name";

  await ctx.editMessageText(
    `👤 *Enter your name*\n\nType your full name:`,
    { parse_mode: "Markdown" }
  );
});

// ──────────────────────────────────────────────────────────────
//  Cancel flow
// ──────────────────────────────────────────────────────────────
bot.callbackQuery("cancel_flow", async (ctx) => {
  await ctx.answerCallbackQuery();
  clearSession(ctx.from.id);
  await ctx.editMessageText("❌ Booking cancelled.\n\nTap /start to try again.");
});

// ──────────────────────────────────────────────────────────────
//  Text message handler (multi-step conversation)
// ──────────────────────────────────────────────────────────────
bot.on("message:text", async (ctx) => {
  const sess = getSession(ctx.from.id);

  // ── Ask Name ──
  if (sess.step === "ask_name") {
    const name = ctx.message.text.trim();
    if (name.length < 2 || name.length > 100) {
      await ctx.reply("⚠️ Please enter a valid name (2-100 characters).");
      return;
    }
    sess.name = name;
    sess.step = "ask_phone";
    await ctx.reply(
      `📞 *Enter your phone number*\n\nExample: 09-123456789`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // ── Ask Phone ──
  if (sess.step === "ask_phone") {
    const phone = ctx.message.text.trim();
    if (phone.length < 7 || phone.length > 20) {
      await ctx.reply("⚠️ Please enter a valid phone number (7-20 digits).");
      return;
    }
    sess.phone = phone;
    sess.step = "confirm";

    const confirmText = buildConfirmText(sess);
    const kb = new InlineKeyboard()
      .text("✅ Confirm", "confirm_booking")
      .row()
      .text("❌ Cancel", "cancel_flow");

    await ctx.reply(confirmText, { reply_markup: kb, parse_mode: "Markdown" });
    return;
  }

  // ── Confirm step — ignore random text, only buttons work ──
  if (sess.step === "confirm") {
    await ctx.reply(
      "Please use the buttons above to Confirm or Cancel.",
      {
        reply_markup: new InlineKeyboard()
          .text("✅ Confirm", "confirm_booking")
          .row()
          .text("❌ Cancel", "cancel_flow"),
      }
    );
    return;
  }

  // Default: no active session
  await ctx.reply("Tap /start to begin booking.", {
    reply_markup: new InlineKeyboard().text("📅 Start", "menu_book"),
  });
});

// ──────────────────────────────────────────────────────────────
//  Confirm booking
// ──────────────────────────────────────────────────────────────
bot.callbackQuery("confirm_booking", async (ctx) => {
  await ctx.answerCallbackQuery();
  const sess = getSession(ctx.from.id);

  if (sess.step !== "confirm") {
    await ctx.editMessageText("Session expired. Please /start again.");
    return;
  }

  const ref = generateRef();
  const svc = SERVICES.find((s) => s.name === sess.service);
  const booking = {
    ref,
    userId: ctx.from.id,
    username: ctx.from.username || "N/A",
    service: sess.service,
    date: sess.date,
    dateLabel: sess.dateLabel || sess.date,
    time: sess.time,
    name: sess.name,
    phone: sess.phone,
    price: svc ? svc.price : 0,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };

  // Store booking
  const key = String(ctx.from.id);
  if (!bookings.has(key)) bookings.set(key, []);
  bookings.get(key).push(booking);

  // ── Notify Admin ──
  const adminMsg = [
    `🔔 *New Booking Received*`,
    ``,
    `📋 Ref: \`${ref}\``,
    `💇 Service: ${sess.service}`,
    `📅 Date: ${sess.dateLabel || sess.date}`,
    `🕐 Time: ${sess.time}`,
    ``,
    `👤 Customer: ${sess.name}`,
    `📞 Phone: ${sess.phone}`,
    `💬 Username: @${ctx.from.username || "N/A"}`,
    `🆔 User ID: ${ctx.from.id}`,
    `💰 Price: ${booking.price.toLocaleString()} ${CURRENCY}`,
  ].join("\n");

  try {
    await ctx.api.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Failed to notify admin:", err.message);
  }

  // ── Confirm to customer ──
  clearSession(ctx.from.id);

  await ctx.editMessageText(
    [
      `✅ *Booking Confirmed!*`,
      ``,
      `📋 Reference: \`${ref}\``,
      `🏪 *${BUSINESS_NAME}*`,
      `💇 ${sess.service}`,
      `📅 ${sess.dateLabel || sess.date} at ${sess.time}`,
      `👤 ${sess.name}`,
      `📞 ${sess.phone}`,
      ``,
      `Save your reference number! Tap /start for more options.`,
    ].join("\n"),
    { parse_mode: "Markdown" }
  );
});

// ──────────────────────────────────────────────────────────────
//  /status — Admin: today's bookings
// ──────────────────────────────────────────────────────────────
bot.command("status", async (ctx) => {
  if (String(ctx.from.id) !== String(ADMIN_CHAT_ID)) {
    await ctx.reply("⛔ Admin only.");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const allToday = [];

  for (const [, userBookings] of bookings) {
    for (const b of userBookings) {
      if (b.date === today && b.status === "confirmed") {
        allToday.push(b);
      }
    }
  }

  if (allToday.length === 0) {
    await ctx.reply("📋 No bookings for today.");
    return;
  }

  const lines = allToday.map(
    (b, i) =>
      `${i + 1}. \`${b.ref}\` ${b.time} — ${b.service}\n   👤 ${b.name} (${b.phone})`
  );

  await ctx.reply(
    `📋 *Today's Bookings (${today})* — ${allToday.length} total\n\n${lines.join("\n\n")}`,
    { parse_mode: "Markdown" }
  );
});

// ──────────────────────────────────────────────────────────────
//  Error handler
// ──────────────────────────────────────────────────────────────
bot.catch((err) => {
  console.error("Bot error:", err);
});

// ──────────────────────────────────────────────────────────────
//  Export for Vercel serverless
// ──────────────────────────────────────────────────────────────
export default bot;
