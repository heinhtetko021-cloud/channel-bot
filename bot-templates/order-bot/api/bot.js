const { Bot, InlineKeyboard } = require("grammy");

// ============================================================
// CUSTOMIZE HERE — Edit these values for your client's business
// ============================================================
const config = {
  BOT_NAME: "H-Tech Shop Bot",          // Display name for the bot
  CHANNEL_ID: process.env.ADMIN_CHAT_ID || "",  // Owner/admin Telegram chat ID
  CURRENCY: "Ks",                         // Currency symbol (Myanmar Kyat)
  SHOP_NAME: "H-Tech Studio Shop",        // Client's shop name
};

// ============================================================
// CUSTOMIZE YOUR PRODUCTS HERE
// Each product needs: id (unique string), name, price (number), category, emoji
// To add/remove products, just edit this array. Categories auto-generate menu.
// ============================================================
const PRODUCTS = [
  // --- Category: Accessories ---
  { id: "acc1", name: "Phone Case (Clear)",  price: 3000,  category: "Accessories", emoji: "📱" },
  { id: "acc2", name: "Phone Case (Leather)", price: 8000,  category: "Accessories", emoji: "👝" },
  { id: "acc3", name: "Screen Protector",     price: 2000,  category: "Accessories", emoji: "🛡️" },
  { id: "acc4", name: "Car Charger",          price: 5000,  category: "Accessories", emoji: "🔌" },

  // --- Category: Gadgets ---
  { id: "gad1", name: "Bluetooth Earbuds",    price: 15000, category: "Gadgets",     emoji: "🎧" },
  { id: "gad2", name: "Wireless Mouse",       price: 12000, category: "Gadgets",     emoji: "🖱️" },
  { id: "gad3", name: "USB-C Hub 5-in-1",    price: 25000, category: "Gadgets",     emoji: "💻" },

  // --- Category: Services ---
  { id: "svc1", name: "Phone Repair (Basic)", price: 10000, category: "Services",    emoji: "🔧" },
  { id: "svc2", name: "Phone Repair (Screen)", price: 30000, category: "Services",   emoji: "🪟" },
  { id: "svc3", name: "Software Install",     price: 5000,  category: "Services",    emoji: "💿" },
];

// ============================================================
// INTERNAL — You should not need to edit below this line
// ============================================================

const bot = new Bot(process.env.BOT_TOKEN);

// --- In-memory stores (swap for Upstash Redis in production) ---
const carts = new Map();       // userId -> [{ productId, qty }]
const conversations = new Map(); // userId -> { step, data }
let ordersToday = 0;

// --- Helpers ---
function getCart(userId) {
  if (!carts.has(userId)) carts.set(userId, []);
  return carts.get(userId);
}

function cartTotal(userId) {
  return getCart(userId).reduce((sum, item) => {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getCategories() {
  const cats = [...new Set(PRODUCTS.map((p) => p.category))];
  return cats;
}

function getProductsByCategory(category) {
  return PRODUCTS.filter((p) => p.category === category);
}

// --- Category menu (inline keyboard) ---
function categoryMenu() {
  const kb = new InlineKeyboard();
  getCategories().forEach((cat) => {
    kb.text(cat, `cat:${cat}`);
  });
  return kb;
}

// --- Product list keyboard for a category ---
function productListKeyboard(category) {
  const kb = new InlineKeyboard();
  const products = getProductsByCategory(category);
  products.forEach((p) => {
    kb.text(`${p.emoji} ${p.name} — ${p.price.toLocaleString()} ${config.CURRENCY}`, `prod:${p.id}`);
    kb.row();
  });
  kb.text("🔙 Back to Categories", "back:cats");
  return kb;
}

// --- Cart keyboard ---
function cartKeyboard(userId) {
  const cart = getCart(userId);
  const kb = new InlineKeyboard();
  if (cart.length === 0) {
    kb.text("🛒 Cart is empty", "noop");
  } else {
    cart.forEach((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      if (!product) return;
      kb.text(`${product.emoji} ${product.name}`, `noop`);
      kb.row();
      kb.text(`➖`, `cart:dec:${item.productId}`);
      kb.text(`${item.qty}`, `noop`);
      kb.text(`➕`, `cart:inc:${item.productId}`);
      kb.text(`🗑️ Remove`, `cart:rm:${item.productId}`);
      kb.row();
    });
    kb.row();
    kb.text(`💰 Total: ${cartTotal(userId).toLocaleString()} ${config.CURRENCY}`, "noop");
    kb.row();
    kb.text("✅ Checkout", "checkout:start");
    kb.text("🔙 Back to Shop", "back:cats");
  }
  return kb;
}

// --- /start handler ---
bot.command("start", async (ctx) => {
  const name = ctx.from?.first_name || "there";
  await ctx.reply(
    `👋 Welcome to *${escapeHtml(config.SHOP_NAME)}*!\n\n` +
      `I'm *${escapeHtml(config.BOT_NAME)}*. Browse our products and place orders right here.\n\n` +
      `Choose a category below to get started:`,
    {
      parse_mode: "Markdown",
      reply_markup: categoryMenu(),
    }
  );
});

// --- /status admin command ---
bot.command("status", async (ctx) => {
  if (String(ctx.chat?.id) !== String(config.CHANNEL_ID)) {
    return ctx.reply("⛔ You are not authorized to use this command.");
  }
  await ctx.reply(
    `📊 *Admin Status*\n\n` +
      `📅 Orders today: *${ordersToday}*\n` +
      `🛒 Active carts: *${carts.size}*\n` +
      `📦 Total products: *${PRODUCTS.length}*`,
    { parse_mode: "Markdown" }
  );
});

// --- Category selection callback ---
bot.callbackQuery(/^cat:(.+)$/, async (ctx) => {
  const category = ctx.match[1];
  const products = getProductsByCategory(category);
  if (products.length === 0) {
    await ctx.answerCallbackQuery({ text: "No products found.", show_alert: true });
    return;
  }
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `📂 *${escapeHtml(category)}*\n\nTap a product to see details:`,
    {
      parse_mode: "Markdown",
      reply_markup: productListKeyboard(category),
    }
  );
});

// --- Product detail callback ---
bot.callbackQuery(/^prod:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    await ctx.answerCallbackQuery({ text: "Product not found.", show_alert: true });
    return;
  }
  await ctx.answerCallbackQuery();
  const kb = new InlineKeyboard();
  kb.text(`🛒 Add to Cart`, `cart:add:${product.id}`);
  kb.row();
  kb.text(`📂 Back to ${product.category}`, `cat:${product.category}`);
  kb.text(`🏠 All Categories`, "back:cats");

  await ctx.editMessageText(
    `${product.emoji} *${escapeHtml(product.name)}*\n\n` +
      `💰 Price: *${product.price.toLocaleString()} ${config.CURRENCY}*\n` +
      `📂 Category: ${product.category}\n\n` +
      `Tap below to add to your cart:`,
    {
      parse_mode: "Markdown",
      reply_markup: kb,
    }
  );
});

// --- Back to categories ---
bot.callbackQuery("back:cats", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `📂 Choose a category:`,
    {
      parse_mode: "Markdown",
      reply_markup: categoryMenu(),
    }
  );
});

// --- Cart: Add item ---
bot.callbackQuery(/^cart:add:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    await ctx.answerCallbackQuery({ text: "Product not found.", show_alert: true });
    return;
  }
  const cart = getCart(ctx.from.id);
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ productId, qty: 1 });
  }
  await ctx.answerCallbackQuery({ text: `✅ ${product.name} added to cart!` });
  // Show updated cart
  await ctx.editMessageText(
    `🛒 *Your Cart*\n\n` +
      (cart.length > 0
        ? `Items below. Adjust quantities or proceed to checkout.`
        : `Your cart is empty. Browse products to add items.`),
    {
      parse_mode: "Markdown",
      reply_markup: cartKeyboard(ctx.from.id),
    }
  );
});

// --- Cart: Increment quantity ---
bot.callbackQuery(/^cart:inc:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const cart = getCart(ctx.from.id);
  const item = cart.find((i) => i.productId === productId);
  if (item) {
    item.qty += 1;
    await ctx.answerCallbackQuery({ text: "Quantity increased." });
  } else {
    await ctx.answerCallbackQuery({ text: "Item not in cart.", show_alert: true });
    return;
  }
  await ctx.editMessageText(
    `🛒 *Your Cart*`,
    {
      parse_mode: "Markdown",
      reply_markup: cartKeyboard(ctx.from.id),
    }
  );
});

// --- Cart: Decrement quantity ---
bot.callbackQuery(/^cart:dec:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const cart = getCart(ctx.from.id);
  const idx = cart.findIndex((i) => i.productId === productId);
  if (idx === -1) {
    await ctx.answerCallbackQuery({ text: "Item not in cart.", show_alert: true });
    return;
  }
  cart[idx].qty -= 1;
  if (cart[idx].qty <= 0) {
    cart.splice(idx, 1);
  }
  await ctx.answerCallbackQuery({ text: "Quantity decreased." });
  await ctx.editMessageText(
    `🛒 *Your Cart*`,
    {
      parse_mode: "Markdown",
      reply_markup: cartKeyboard(ctx.from.id),
    }
  );
});

// --- Cart: Remove item ---
bot.callbackQuery(/^cart:rm:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const cart = getCart(ctx.from.id);
  const idx = cart.findIndex((i) => i.productId === productId);
  if (idx !== -1) {
    cart.splice(idx, 1);
    await ctx.answerCallbackQuery({ text: "Item removed from cart." });
  } else {
    await ctx.answerCallbackQuery({ text: "Item not in cart.", show_alert: true });
    return;
  }
  await ctx.editMessageText(
    `🛒 *Your Cart*`,
    {
      parse_mode: "Markdown",
      reply_markup: cartKeyboard(ctx.from.id),
    }
  );
});

// --- Cart: View cart (noop button triggers nothing special, but /cart command works) ---
bot.command("cart", async (ctx) => {
  await ctx.reply(
    `🛒 *Your Cart*`,
    {
      parse_mode: "Markdown",
      reply_markup: cartKeyboard(ctx.from.id),
    }
  );
});

// --- Checkout flow ---
bot.callbackQuery("checkout:start", async (ctx) => {
  const cart = getCart(ctx.from.id);
  if (cart.length === 0) {
    await ctx.answerCallbackQuery({ text: "Your cart is empty!", show_alert: true });
    return;
  }
  await ctx.answerCallbackQuery();
  // Start conversation: ask for name
  conversations.set(ctx.from.id, { step: "ask_name", data: {} });
  await ctx.editMessageText(
    `✅ *Checkout*\n\n` +
      `Great! Let's complete your order.\n\n` +
      `📝 What is your *full name*?`,
    { parse_mode: "Markdown" }
  );
});

// --- Conversation handler for text messages (checkout steps) ---
bot.on("message:text", async (ctx) => {
  const userId = ctx.from.id;
  const convo = conversations.get(userId);
  if (!convo) return; // No active conversation, ignore

  if (convo.step === "ask_name") {
    convo.data.name = ctx.message.text.trim();
    convo.step = "ask_phone";
    await ctx.reply(
      `📞 Thanks, ${escapeHtml(convo.data.name)}!\n\nWhat is your *phone number*?`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (convo.step === "ask_phone") {
    convo.data.phone = ctx.message.text.trim();
    convo.step = "ask_address";
    await ctx.reply(
      `📍 Got it! Now, what is your *delivery address*?\n\n` +
        `(Include street, township, city)`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (convo.step === "ask_address") {
    convo.data.address = ctx.message.text.trim();
    convo.step = "confirm";

    const cart = getCart(userId);
    const total = cartTotal(userId);

    // Build order summary
    let itemsList = "";
    cart.forEach((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      if (product) {
        itemsList += `  ${product.emoji} ${product.name} × ${item.qty} = ${(product.price * item.qty).toLocaleString()} ${config.CURRENCY}\n`;
      }
    });

    const kb = new InlineKeyboard();
    kb.text("✅ Confirm Order", "checkout:confirm");
    kb.text("❌ Cancel", "checkout:cancel");

    await ctx.reply(
      `📋 *Order Summary*\n\n` +
        itemsList +
        `\n💰 *Total: ${total.toLocaleString()} ${config.CURRENCY}*\n\n` +
        `👤 Name: ${escapeHtml(convo.data.name)}\n` +
        `📞 Phone: ${escapeHtml(convo.data.phone)}\n` +
        `📍 Address: ${escapeHtml(convo.data.address)}\n\n` +
        `Please confirm your order:`,
      { parse_mode: "Markdown", reply_markup: kb }
    );
    return;
  }
});

// --- Checkout: Confirm ---
bot.callbackQuery("checkout:confirm", async (ctx) => {
  const userId = ctx.from.id;
  const convo = conversations.get(userId);
  if (!convo || convo.step !== "confirm") {
    await ctx.answerCallbackQuery({ text: "No active order to confirm.", show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery({ text: "Order placed!" });

  const cart = getCart(userId);
  const total = cartTotal(userId);
  ordersToday += 1;

  // Build items list for admin message
  let itemsList = "";
  cart.forEach((item) => {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    if (product) {
      itemsList += `  ${product.emoji} ${product.name} × ${item.qty} = ${(product.price * item.qty).toLocaleString()} ${config.CURRENCY}\n`;
    }
  });

  const orderMessage =
    `🛒 *NEW ORDER #${ordersToday}*\n` +
    `━━━━━━━━━━━━━━━━━\n\n` +
    `📦 Items:\n${itemsList}\n` +
    `💰 Total: *${total.toLocaleString()} ${config.CURRENCY}*\n\n` +
    `👤 Customer: *${escapeHtml(convo.data.name)}*\n` +
    `📞 Phone: \`${escapeHtml(convo.data.phone)}\`\n` +
    `📍 Address: ${escapeHtml(convo.data.address)}\n\n` +
    `━━━━━━━━━━━━━━━━━\n` +
    `📅 ${new Date().toLocaleDateString("en-GB")} | ⏰ ${new Date().toLocaleTimeString("en-GB")}`;

  // Send order to admin (owner's chat)
  if (config.CHANNEL_ID) {
    try {
      await bot.api.sendMessage(config.CHANNEL_ID, orderMessage, { parse_mode: "Markdown" });
    } catch (err) {
      console.error("Failed to send order to admin:", err.message);
    }
  }

  // Confirm to customer
  await ctx.editMessageText(
    `✅ *Order Placed Successfully!*\n\n` +
      `Thank you, *${escapeHtml(convo.data.name)}*!\n\n` +
      `We have received your order and will contact you at *${escapeHtml(convo.data.phone)}* shortly.\n\n` +
      `📍 Delivery to: ${escapeHtml(convo.data.address)}\n\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `Need help? Contact us: @${escapeHtml(config.BOT_NAME.replace(/\s+/g, "_").toLowerCase())}\n` +
      `Or call the shop directly.`,
    { parse_mode: "Markdown" }
  );

  // Clear cart and conversation
  carts.set(userId, []);
  conversations.delete(userId);
});

// --- Checkout: Cancel ---
bot.callbackQuery("checkout:cancel", async (ctx) => {
  const userId = ctx.from.id;
  conversations.delete(userId);
  await ctx.answerCallbackQuery({ text: "Order cancelled." });
  await ctx.editMessageText(
    `❌ Order cancelled.\n\nYour cart is still saved. You can continue shopping or checkout later.`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("📂 Browse Products", "back:cats").text("🛒 View Cart", "noop"),
    }
  );
});

// --- Catch-all for unknown callbacks ---
bot.on("callback_query:data", async (ctx) => {
  // Prevent "loading" spinner from hanging
  await ctx.answerCallbackQuery();
});

// --- Error handler ---
bot.catch((err) => {
  console.error("Bot error:", err);
});

// --- Exports ---
// The default export is the Vercel webhook handler.
// vercel.json rewrites all requests (including the setWebhook target
// `https://<url>/api/bot`) to this file, and Vercel invokes the default
// export below, which delegates to the shared adapter in webhook.js.
module.exports = async function handler(req, res) {
  const runWebhook = require("./webhook");
  return runWebhook(req, res);
};

// Attach the Bot instance as `.bot` so local scripts (set-webhook.js,
// dev.js) and tests can reuse the exact same bot. This is set AFTER the
// default export because re-assigning module.exports would otherwise
// discard the `.bot` property.
module.exports.bot = bot;
