const kb = require('./keyboard-button');

module.exports = {
    home: [
        [kb.home.products, kb.home.shops],
        [kb.home.favourite]
    ],
    product: [
        [kb.product.sausage_cheese, kb.product.meat_fish_poultry],
        [kb.product.fruit_vegetables, kb.product.milk_eggs],
        [kb.product.water],
        [kb.product.random],
        [kb.back ]
    ],
    shops: [
        [
          {
            text: 'Надіслати місцезнаходження',
            request_location: true
          }
        ],
        [kb.back]
      ]
}