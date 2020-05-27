'use strict';
module.exports = {

  getChatId(msg) {
    return msg.chat.id;
  },

  getItemUuid(source) {
    return source.substr(2, source.length);
  },

  getCaptionOfProduct(name, amount, price, data) {
    return `${name} - ${amount}\n\n🏷️ Ціна: ${price} грн.\n\n🔥 Акційний термін:\n${data}`;
  },
};
