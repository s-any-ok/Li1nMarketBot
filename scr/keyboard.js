'use strict';
const kb = require('./button');

module.exports = {
  home: [
    [kb.home.products, kb.home.shops],
    [kb.home.favourite, kb.home.help],
  ],
  product: [
    [kb.product.sausageCheese],
    [kb.product.meatFishPoultry],
    [kb.product.fruitVegetables],
    [kb.product.milkEggs],
    [kb.product.water],
    [kb.product.all],
    [kb.back],
  ],
  shops: [
    [{
      text: '🏠 Надіслати місцезнаходження',
      // eslint-disable-next-line camelcase
      request_location: true,
    }],
    [kb.back],
  ],
};
