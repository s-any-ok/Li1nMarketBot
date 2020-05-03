const config = require('./config');
const helpers = require('./helpers');
const TelegramBot = require('node-telegram-bot-api');
const options = {
  webHook: {
    port: process.env.PORT
  }
};

const url = process.env.APP_URL || 'https://li1n-market-bot.herokuapp.com:443';
const bot = new TelegramBot(config.TOKEN, options);
bot.setWebHook(`${url}/bot${config.TOKEN}`);

bot.onText(/\/location/, function (msg) {
    var fromId = msg.from.id;
    bot.sendLocation(fromId, 50.757301, 25.353646);
  });