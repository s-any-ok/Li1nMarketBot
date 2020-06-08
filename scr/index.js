/* eslint-disable camelcase */
'use strict';

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const geolib = require('geolib');
const mongoose = require('mongoose');
const helpers = require('./helpers');
const captions = require('./captions');
const kb = require('./button');
const keyboard = require('./keyboard');
//const database = require('../databases/database.json');
//const atbDatabase = require('../databases/atb-database.json');

const options = {
  webHook: { port: process.env.PORT },
};

const bot = new TelegramBot(process.env.TOKEN, options);
bot.setWebHook(`${process.env.APP_URL}/bot${process.env.TOKEN}`);

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB_URL, {
  useMongoClient: true,
});

const ACTION_TYPE = {
  ACTION_PRODUCTS: 'ap',
  SHOP_LOCATION: 'sl',
  PROD_TOGGLE_FAV: 'ptf',
};

const AtbProduct = require('./models/atb-product.model');
const Product = require('./models/product.model');
const Shop = require('./models/shop.model');
const User = require('./models/user.model');

//database.products.forEach(p => new Product(p).save());
//atbDatabase.atbProducts.forEach(p => new AtbProduct(p).save());

bot.on('message', msg => {

  const chatId = helpers.getChatId(msg);

  switch (msg.text) {

    case kb.home.favourite:
      showFavouriteProducts(chatId, msg.from.id);
      break;

    case kb.home.products:
      bot.sendMessage(chatId, 'Оберіть категорію товару', {
        reply_markup: {
          keyboard: keyboard.product,
        },
      });
      break;

    case kb.home.shops:
      bot.sendMessage(chatId, '🏠 Надіслати місцезнаходження', {
        reply_markup: {
          keyboard: keyboard.shops,
        },
      });
      break;

    case kb.home.help:

      bot.sendMessage(chatId, 'Інформація покищо відсутня', {
        reply_markup: {
          keyboard: keyboard.home,
        },
      });
      break;

    case kb.product.fruitVegetables:
      sendProductsByQuery(chatId, { type: 'fruitVegetables' });
      break;
    case kb.product.milkEggs:
      sendProductsByQuery(chatId, { type: 'milkEggs' });
      break;
    case kb.product.meatFishPoultry:
      sendProductsByQuery(chatId, { type: 'meatFishPoultry' });
      break;
    case kb.product.sausageCheese:
      sendProductsByQuery(chatId, { type: 'sausageCheese' });
      break;
    case kb.product.water:
      sendProductsByQuery(chatId, { type: 'water' });
      break;
    case kb.product.all:
      sendProductsByQuery(chatId, {});
      break;

    case kb.back:
      bot.sendMessage(chatId, 'Що бажаєте переглянути?', {
        reply_markup: {
          keyboard: keyboard.home,
        },
      });
      break;



  }

  if (msg.location) {
    sendShopsInCords(chatId, msg.location);
  }


});

bot.onText(/\/start/, msg => {

  const chatId = helpers.getChatId(msg);
  const userName = msg.from.first_name;

  const hello = captions.welcome(userName);

  bot.sendMessage(chatId, hello, {
    reply_markup: {
      keyboard: keyboard.home,
    },
  });
});

bot.onText(/\/atb/, msg => {

  const chatId = helpers.getChatId(msg);

  AtbProduct.find({}).then(products => {

    const html = captions.allAtbProducts(products);

    sendHtml(chatId, html, 'products');

  });
});

bot.onText(/\/p(.+)/, (msg, [source, match]) => {
  const productUuid = helpers.getItemUuid(source);
  const chatId = helpers.getChatId(msg);

  const atbMarker = 'a';

  if (productUuid[0] === atbMarker) {

    AtbProduct.findOne({ uuid: productUuid })
      .then(product => {
        const caption = captions.atbProduct(product.name, product.discription, product.oldPrice, product.price, product.sale);

        bot.sendPhoto(chatId, product.imgUrl, {
          caption,
          reply_markup: {
            inline_keyboard: [
              [{
                text: product.shop,
                url: product.shopUrl,
              }],
            ],
          },
        });
      });

  } else {

    Promise.all([
      Product.findOne({ uuid: productUuid }),
      User.findOne({ telegramId: msg.from.id }),
    ])
      .then(([product, user]) => {
        const caption = captions.shopsProducts(product.name, product.amount, product.price, product.data);

        let isFavourite = false;

        if (user) {
          isFavourite = user.products.indexOf(product.uuid) !== -1;
        }

        const favouriteText = isFavourite ?
          'Видалити з кошика' :
          'Додати в кошик';


        bot.sendPhoto(chatId, product.picture, {
          caption,
          reply_markup: {
            inline_keyboard: [
              [{
                text: favouriteText,
                callback_data: JSON.stringify({
                  type: ACTION_TYPE.PROD_TOGGLE_FAV,
                  productUuid: product.uuid,
                  isFav: isFavourite,
                }),
              }],
              [{
                text: product.shop,
                url: product.link,
              }],
            ],
          },
        });
      });
  }
});

bot.onText(/\/s(.+)/, (msg, [source, match]) => {

  const shopUuid = helpers.getItemUuid(source);
  const chatId = helpers.getChatId(msg);

  Shop.findOne({ uuid: shopUuid }).then(shop => {

    bot.sendMessage(chatId, `Магазин ${shop.name}`, {
      reply_markup: {
        inline_keyboard: [
          [{
            text: shop.name,
            url: shop.url,
          },
          {
            text: 'Показати на карті',
            callback_data: JSON.stringify({
              type: ACTION_TYPE.SHOP_LOCATION,
              lat: shop.location.latitude,
              lon: shop.location.longitude,
            }),
          },
          ],
          [{
            text: `Акційні товари`,
            callback_data: JSON.stringify({
              type: ACTION_TYPE.ACTION_PRODUCTS,
              productUuids: shop.products,
            }),
          }],
        ],
      },
    });

  });

});

bot.on('callback_query', query => {
  const userId = query.from.id;

  let data;
  try {
    data = JSON.parse(query.data);
  } catch (e) {
    throw new Error('Data is not a object');
  }

  const { type } = data;

  if (type === ACTION_TYPE.SHOP_LOCATION) {
    const { lat, lon } = data;
    bot.sendLocation(query.message.chat.id, lat, lon);
  } else if (type === ACTION_TYPE.PROD_TOGGLE_FAV) {
    toggleFavouriteProducts(userId, query.id, data);
  } else if (type === ACTION_TYPE.ACTION_PRODUCTS) {
    sendProductsByQuery(userId, { uuid: { '$in': data.productUuids } });
  }
});

// ------------------------------------

function sendHtml(chatId, html, keyboardName = null) {
  const options = {
    parse_mode: 'HTML',
  };

  if (keyboardName) {
    options['reply_markup'] = {
      keyboard: keyboard[keyboardName],
    };
  }

  bot.sendMessage(chatId, html, options);
}

function sendProductsByQuery(chatId, query) {
  Product.find(query).then(products => {

    const html = captions.productsByQuery(products);

    sendHtml(chatId, html, 'products');

  });
}

function sendShopsInCords(chatId, location) {

  Shop.find({}).then(shops => {

    shops.forEach(s => {
      s.distance = geolib.getDistance(location, s.location) / 1000;
    });

    shops = shops.sort(helpers.byField('distance'));

    const html = captions.shopsInCoords(shops);

    sendHtml(chatId, html, 'shops');
  });
}

function toggleFavouriteProducts(userId, queryId, { productUuid, isFav }) {
  let userPromise;

  User.findOne({ telegramId: userId })
    .then(user => {
      if (user) {
        if (isFav) {
          user.products = user.products.filter(pUuid => pUuid !== productUuid);
        } else {
          user.products.push(productUuid);
        }
        userPromise = user;
      } else {
        userPromise = new User({
          telegramId: userId,
          products: [productUuid],
        });
      }

      const answerText = isFav ?
        `Видалено з кошика` :
        `Продукт додано до кошика`;

      userPromise.save()
        .then(_ => {
          bot.answerCallbackQuery({
            callback_query_id: queryId,
            text: answerText,
          });
        });
    });
}

function showFavouriteProducts(chatId, telegramId) {
  User.findOne({ telegramId })
    .then(user => {

      if (user) {
        Product.find({ uuid: { '$in': user.products } }).then(products => {
          let html;
          if (products.length) {
            products = products.sort(helpers.byField('price'));

            html = captions.favouriteProducts(products);

            html = `🛍️ <b>Ваші продукти:</b>\n\n${html}`;
          } else {
            html = 'Ви ще нічого не додали';
          }

          sendHtml(chatId, html, 'home');
        });
      } else {
        sendHtml(chatId, 'Ви ще нічого не додали', 'home');
      }
    });
}
