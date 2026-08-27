const { webhookCallback } = require("grammy");
const { bot } = require("./bot");

// Export as a Vercel serverless function
const handler = webhookCallback(bot, "std/http");

module.exports = handler;
