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

const ACTION_TYPE = {
  CINEMA_FILMS: 'cfs',
  FILM_CINEMAS: 'fcs',
  CINEMA_LOCATION: 'cl',
  FILM_TOGGLE_FAV: 'ftf'
}


require('./models/film.model');
require('./models/cinema.model');
require('./models/user.model');

const Film = mongoose.model('films');
const Cinema = mongoose.model('cinemas');
const User = mongoose.model('users');

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
      showFavouriteFilms(chatId, msg.from.id)
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
          keyboard: keyboard.cinemas
        }
      })
      break;

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

  Promise.all([
     Film.findOne({uuid: filmUuid}),
     User.findOne({telegramId: msg.from.id})
    ])
  .then(([film, user]) => {
    const caption = `Назва: ${film.name}\nРік: ${film.year}\nРейтинг: ${film.rate}\nТривалість: ${film.length}\nКраїна: ${film.country}`;
    
    let isFavourite = false;

    if (user) {
      isFavourite = user.films.indexOf(film.uuid) !== -1;
    }

    const favouriteText = isFavourite ? 'Видалити з обраних' : 'Додати в обрані';


    bot.sendPhoto(chatId, film.picture, {
      caption: caption,
      reply_markup: {
        inline_keyboard: 
          [
            [
              {
                text: favouriteText,
                callback_data: JSON.stringify({
                  type: ACTION_TYPE.FILM_TOGGLE_FAV,
                  filmUuid: film.uuid,
                  isFav: isFavourite
                })
              },
              {
                text: 'Показати кінотеатри',
                callback_data: JSON.stringify({
                  type: ACTION_TYPE.FILM_CINEMAS,
                  cinemaUuids: film.cinemas
                })
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

bot.onText(/\/c(.+)/, (msg, [source, match]) => {

  const cinemaUuid = helpers.getItemUuid(source);
  const chatId = helpers.getChatId(msg);

  Cinema.findOne({uuid: cinemaUuid}).then(cinema => {

    bot.sendMessage(chatId, `Кінотеатр ${cinema.name}`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: cinema.name,
              url: cinema.url
            },
            {
              text: 'Показати на карті',
              callback_data: JSON.stringify({
                type: ACTION_TYPE.CINEMA_LOCATION,
                lat: cinema.location.latitude,
                lon: cinema.location.longitude,
              })
            }
          ],
          [
            {
              text: 'Зараз на екрані',
              callback_data: JSON.stringify({
                type: ACTION_TYPE.CINEMA_FILMS,
                filmUuids: cinema.films
              })
            }
          ]
        ]
      }
    })

  });

})

bot.on('callback_query', query => {
  const userId = query.from.id

  let data
  try {
    data = JSON.parse(query.data)
  } catch (e) {
    throw new Error('Data is not a object')
  }

  const { type } = data

  if (type === ACTION_TYPE.CINEMA_LOCATION) {
    const { lat, lon } = data
    bot.sendLocation(query.message.chat.id, lat, lon)
  } else if (type === ACTION_TYPE.FILM_TOGGLE_FAV) {
    toggleFavouriteFilm(userId, query.id, data)
  } else if (type === ACTION_TYPE.CINEMA_FILMS) {
    sendFilmsByQuery(userId, {uuid: {'$in': data.filmUuids}})
  } else if (type === ACTION_TYPE.FILM_CINEMAS) {
    sendFilmCinemasByQuery(userId, {uuid: {'$in': data.cinemaUuids}})
  }
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

    cinemas.forEach(c => {
      c.distance = geolib.getDistance(location, c.location) / 1000
    })

    cinemas = _.sortBy(cinemas, 'distance')

    const html = cinemas.map((c, i) => {
      return `<b>${i + 1}.</b> ${c.name}. <em>Відстань</em> - <strong>${c.distance}</strong> км. /c${c.uuid}`
    }).join('\n')

    sendHtml(chatId, html, 'home')
  })
}

function toggleFavouriteFilm(userId, queryId, {filmUuid, isFav}) {
  let userPromise

  User.findOne({telegramId: userId})
  .then(user => {
    if (user) {
      if (isFav) {
        user.films = user.films.filter(fUuid => fUuid !== filmUuid)
      } else {
        user.films.push(filmUuid)
      }
      userPromise = user
    } else {
      userPromise = new User({
        telegramId: userId,
        films: [filmUuid]
      })
    }

    const answerText = isFav ? `Видалено з обраних` : `Фільм додано до обраних`

    userPromise.save()
    .then(_ => {
      bot.answerCallbackQuery({
        callback_query_id: queryId,
        text: answerText
      })
    })
  })
}

function showFavouriteFilms(chatId, telegramId) {
  User.findOne({telegramId})
    .then(user => {

      if (user) {
        Film.find({uuid: {'$in': user.films}}).then(films => {
          let html
          if (films.length) {
            html = films.map(f => {
              return `${f.name} - <b>${f.rate}</b> (/f${f.uuid})`
            }).join('\n')
            html = `<b>Ваші фільми:</b>\n${html}`
          } else {
            html = 'Ви ще нічого не додали'
          }

          sendHtml(chatId, html, 'home')
        })
      } else {
        sendHtml(chatId, 'Ви ще нічого не додали', 'home')
      }
    })
}

function sendFilmCinemasByQuery(userId, query) {
  Cinema.find(query).then(cinemas => {
    const html = cinemas.map((c, i) => {
      return `<b>${i + 1}.</b> ${c.name} - /c${c.uuid}`
    }).join('\n')

    sendHtml(userId, html, 'home')
  })
}
