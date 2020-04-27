const TOKEN = process.env.TELEGRAM_TOKEN || '1000060464:AAE6bwWUhoGttztN1KxjeNtyDsZuYLiB5rs';
const TelegramBot = require('node-telegram-bot-api');
const options = {
  webHook: {
    port: process.env.PORT
  }
};

const url = process.env.APP_URL || 'https://li1n-bot.herokuapp.com:443';
const bot = new TelegramBot(TOKEN, options);
bot.setWebHook(`${url}/bot${TOKEN}`);

bot.onText(/\/location/, function (msg) {
    var fromId = msg.from.id;
    bot.sendLocation(fromId, 50.757301, 25.353646);
  });