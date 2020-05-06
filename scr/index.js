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
  ACTION_PRODUCTS: 'ap',
  SHOP_LOCATION: 'sl',
  PROD_TOGGLE_FAV: 'ptf'
}


require('./models/product.model');
require('./models/shop.model');
require('./models/user.model');

const Product = mongoose.model('products');
const Shop = mongoose.model('shops');
const User = mongoose.model('users');

//database.products.forEach(p => new Product(p).save());
//database.shops.forEach(s => new Shop(s).save());

bot.on('message', msg => {

  const chatId = helpers.getChatId(msg);

  switch(msg.text){
    case kb.home.products:
      bot.sendMessage(chatId, 'Оберіть категорію товару', {
        reply_markup: {
          keyboard: keyboard.product
        }
      });
      break;
    case kb.home.favourite:
      showFavouriteProducts(chatId, msg.from.id)
      break;
    case kb.product.fruit_vegetables:
      sendProductsByQuery(chatId, {type: 'fruit_vegetables'})
      break;
    case kb.product.milk_eggs:
      sendProductsByQuery(chatId, {type: 'milk_eggs'})
      break;
    case kb.product.meat_fish_poultry:
      sendProductsByQuery(chatId, {type: 'meat_fish_poultry'})
      break;
    case kb.product.sausage_cheese:
      sendProductsByQuery(chatId, {type: 'sausage_cheese'})
      break;
    case kb.product.water:
      sendProductsByQuery(chatId, {type: 'water'})
      break;
    case kb.product.random:
      sendProductsByQuery(chatId, {})
      break;
    
    case kb.back:
      bot.sendMessage(chatId, 'Що бажаєте переглянути?', {
        reply_markup: {
          keyboard: keyboard.home
        }
      });
      break;
      case kb.home.shops:
      bot.sendMessage(chatId, 'Надіслати місцезнаходження', {
        reply_markup: {
          keyboard: keyboard.shops
        }
      })
      break;

  }

  if (msg.location) {
    sendShopsInCords(chatId, msg.location)
  }
 

})

bot.onText(/\/start/, msg => {

    const chatId = helpers.getChatId(msg);

    const text = `✋ Вітаю, ${msg.from.first_name}\nВиберіть команду для початку роботи!`

    bot.sendMessage(chatId, text, {
      reply_markup: {
        keyboard: keyboard.home
      }
    });
});

bot.onText(/\/p(.+)/, (msg, [source, match]) => {
  const productUuid = helpers.getItemUuid(source);
  const chatId = helpers.getChatId(msg);

  Promise.all([
     Product.findOne({uuid: productUuid}),
     User.findOne({telegramId: msg.from.id})
    ])
  .then(([product, user]) => {
    const caption = `${product.name} - ${product.amount}\n\n🏷️ Ціна: ${product.price} грн.\n\n🔥 Акційний термін:\n${product.data}`;
    
    let isFavourite = false;

    if (user) {
      isFavourite = user.products.indexOf(product.uuid) !== -1;
    }

    const favouriteText = isFavourite ? 'Видалити з кошика' : 'Додати в кошик';


    bot.sendPhoto(chatId, product.picture, {
      caption: caption,
      reply_markup: {
        inline_keyboard: 
          [
            [
              {
                text: favouriteText,
                callback_data: JSON.stringify({
                  type: ACTION_TYPE.PROD_TOGGLE_FAV,
                  productUuid: product.uuid,
                  isFav: isFavourite
                })
              }
            ],
            [
              {
                text: product.shop,
                url: product.link
              }
            ]
          ]
      }
    })
  })
})

bot.onText(/\/s(.+)/, (msg, [source, match]) => {

  const shopUuid = helpers.getItemUuid(source);
  const chatId = helpers.getChatId(msg);

  Shop.findOne({uuid: shopUuid}).then(shop => {

    bot.sendMessage(chatId, `Магазин ${shop.name}`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: shop.name,
              url: shop.url
            },
            {
              text: 'Показати на карті',
              callback_data: JSON.stringify({
                type: ACTION_TYPE.SHOP_LOCATION,
                lat: shop.location.latitude,
                lon: shop.location.longitude,
              })
            }
          ],
          [
            {
              text: `Акційні товари`,
              callback_data: JSON.stringify({
                type: ACTION_TYPE.ACTION_PRODUCTS,
                productUuids: shop.products
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

  if (type === ACTION_TYPE.SHOP_LOCATION) {
    const { lat, lon } = data
    bot.sendLocation(query.message.chat.id, lat, lon)
  } else if (type === ACTION_TYPE.PROD_TOGGLE_FAV) {
    toggleFavouriteProducts(userId, query.id, data)
  } else if (type === ACTION_TYPE.ACTION_PRODUCTS) {
    sendProductsByQuery(userId, {uuid: {'$in': data.productUuids}})
  }
})

// ------------------------------------

function sendProductsByQuery(chatId, query){
  Product.find(query).then(products => {

    const html = products.map((p, i) => {
      return `<b>${i + 1})</b> ${p.name}\n🇮🇩 /p${p.uuid}`
    }).join('\n');

    sendHtml(chatId, html, 'products')

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

function sendShopsInCords(chatId, location) {

  Shop.find({}).then(shops => {

    shops.forEach(s => {
      s.distance = geolib.getDistance(location, s.location) / 1000
    })

    shops = _.sortBy(shops, 'distance')

    const html = shops.map((s, i) => {
      return `<b>${i + 1}.</b> ${s.name}. <em>Відстань</em> - <strong>${s.distance}</strong> км.\n🇮🇩 /s${s.uuid}`
    }).join('\n')

    sendHtml(chatId, html, 'home')
  })
}

function toggleFavouriteProducts(userId, queryId, {productUuid, isFav}) {
  let userPromise

  User.findOne({telegramId: userId})
  .then(user => {
    if (user) {
      if (isFav) {
        user.products = user.products.filter(pUuid => pUuid !== productUuid)
      } else {
        user.products.push(productUuid)
      }
      userPromise = user
    } else {
      userPromise = new User({
        telegramId: userId,
        products: [productUuid]
      })
    }

    const answerText = isFav ? `Видалено з кошика` : `Продукт додано до кошика`

    userPromise.save()
    .then(_ => {
      bot.answerCallbackQuery({
        callback_query_id: queryId,
        text: answerText
      })
    })
  })
}

function showFavouriteProducts(chatId, telegramId) {
  User.findOne({telegramId})
    .then(user => {

      if (user) {
        Product.find({uuid: {'$in': user.products}}).then(products => {
          let html
          if (products.length) {
            html = products.map(p => {
              return `✅  ${p.name}\n🏷️ <b>${p.price} грн.</b>\n🏬 <b>${p.shop}</b>\n🇮🇩 (/p${p.uuid})\n`
            }).join('\n')
            html = `<b>Ваші продукти:</b>\n\n${html}`
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

