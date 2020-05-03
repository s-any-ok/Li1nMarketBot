const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const helpers = require('./helpers');
const kb = require('./keyboard-button');
const keyboard = require('./keyboard');
const options = {
  webHook: {
    port: process.env.PORT
  }
};

const url = process.env.APP_URL || 'https://li1n-market-bot.herokuapp.com:443';
const bot = new TelegramBot(config.TOKEN, options);
bot.setWebHook(`${url}/bot${config.TOKEN}`);

bot.on('message', msg => {

  switch(msg.text){
    case kb.home.films:
      break;
    case kb.home.cinemas:
      break;
    case kb.home.favourite:
      break;

  }

})

bot.onText(/\/start/, msg => {

    const text = `Вітаю, ${msg.from.first_name}\nВиберіть команду для початку роботи!`

    bot.sendMessage(helpers.getChatId(msg), text, {
      reply_markup: {
        keyboard: keyboard.home
      }
    });
});