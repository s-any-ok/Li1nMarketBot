'use strict';

module.exports = {

  atbProducts(name, discription, oldPrice, price, sale) {
    return `${name}\n${discription}\n\n❌ Стара ціна: ${oldPrice} грн.\n🏷️ Ціна: ${price} грн.\n\n🔥 Знижка: ${sale}`;
  },

  shopsProducts(name, amount, price, data) {
    return `${name} - ${amount}\n\n🏷️ Ціна: ${price} грн.\n\n🔥 Акційний термін:\n${data}`;
  },

};
