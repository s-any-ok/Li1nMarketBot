const TelegramBot = require('node-telegram-bot-api');
const geolib = require('geolib');
const _ = require('lodash');
const mongoose = require('mongoose');
const config = require('./config');
const helpers = require('./helpers');
const kb = require('./keyboard-button');
const keyboard = require('./keyboard');
const database = require('../database.json');
const options = {
  webHook: {
    port: process.env.PORT
  }
};

const url = process.env.APP_URL || 'https://li1n-market-bot.herokuapp.com:443';
const bot = new TelegramBot(config.TOKEN, options);
bot.setWebHook(`${url}/bot${config.TOKEN}`);

mongoose.Promise = global.Promise;

mongoose.connect(config.DB_URL, {
  useMongoClient: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
})

require('./models/film.model');
require('./models/cinema.model');

const Film = mongoose.model('films');
const Cinema = mongoose.model('cinemas');

//database.films.forEach(f => new Film(f).save());
//database.cinemas.forEach(c => new Cinema(c).save());

bot.on('message', msg => {

  const chatId = helpers.getChatId(msg);

  switch(msg.text){
    case kb.home.films:
      bot.sendMessage(chatId, 'Оберіть жанр', {
        reply_markup: {
          keyboard: keyboard.film
        }
      });
      break;
    case kb.home.favourite:
      break;
    case kb.film.comedy:
      sendFilmByQuery(chatId, {type: 'comedy'})
      break;
    case kb.film.random:
      sendFilmByQuery(chatId, {})
      break;
    case kb.film.action:
      sendFilmByQuery(chatId, {type: 'action'})
      break;
    case kb.back:
      bot.sendMessage(chatId, 'Що бажаєте переглянути?', {
        reply_markup: {
          keyboard: keyboard.home
        }
      });
      break;
      case kb.home.cinemas:
      bot.sendMessage(chatId, 'Надіслати місцезнаходження', {
        reply_markup: {
          keyboard: [
            [
              {
                text: 'Надіслати місцезнаходження',
                request_location: true
              }
            ],
            [kb.back]
          ]
        }
      })
      break;

  }

 
  msg.location = {
    latitude: 59.843103,
    longitude: 30.205378
  }

  if (msg.location) {
    sendCinemasInCords(chatId, msg.location)
  }
 

})

bot.onText(/\/start/, msg => {

    const chatId = helpers.getChatId(msg);

    const text = `Вітаю, ${msg.from.first_name}\nВиберіть команду для початку роботи!`

    bot.sendMessage(chatId, text, {
      reply_markup: {
        keyboard: keyboard.home
      }
    });
});

bot.onText(/\/f(.+)/, (msg, [source, match]) => {
  const filmUuid = helpers.getItemUuid(source);
  const chatId = helpers.getChatId(msg);

  Film.findOne({uuid: filmUuid}).then(film => {
    const caption = `Назва: ${film.name}\nРік: ${film.year}\nРейтинг: ${film.rate}\nТривалість: ${film.length}\nКраїна: ${film.country}`;
    
    bot.sendPhoto(chatId, film.picture, {
      caption: caption,
      reply_markup: {
        inline_keyboard: 
          [
            [
              {
                text: 'Додати у вибрані',
                callback_data: film.uuid
              },
              {
                text: 'Показати кінотеатри',
                callback_data: film.uuid
              }
            ],
            [
              {
                text: `КиноПоиск ${film.name}`,
                url: film.link
              }
            ]
          ]
      }
    })
  })
})

// ------------------------------------

function sendFilmByQuery(chatId, query){
  Film.find(query).then(films => {

    const html = films.map((f, i) => {
      return `<b>${i + 1}</b> ${f.name} - /f${f.uuid}`
    }).join('\n');

    sendHtml(chatId, html, 'films')

  })
}

function sendHtml(chatId, html, keyboardName = null) {
  const options = {
    parse_mode: 'HTML'
  }

  if (keyboardName) {
    options['reply_markup'] = {
      keyboard: keyboard[keyboardName]
    }
  }

  bot.sendMessage(chatId, html, options)
}

function sendCinemasInCords(chatId, location) {

  Cinema.find({}).then(cinemas => {

   /* cinemas.forEach(c => {
      c.distance = geolib.getDistance(location, c.location) / 1000
    })

    cinemas = _.sortBy(cinemas, 'distance')*/

    const html = cinemas.map((c, i) => {
      return `<b>${i + 1}</b> ${c.name}. <em>Відстань</em> - <strong>1000</strong> км. /c${c.uuid}`
    }).join('\n')

    sendHtml(chatId, html, 'home')
  })
}