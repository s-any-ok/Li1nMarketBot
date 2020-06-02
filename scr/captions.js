'use strict';

module.exports = {

  welcome(userName) {
    return `✋ Вітаю, ${userName}\nВиберіть команду для початку роботи!`;
  },
  allAtbProducts(products) {
    return products.map((p, i) =>
      `<b>${i + 1})</b> ${p.name}\n🏬 ${p.shop}\n🆔 /p${p.uuid}\n`)
      .join('\n');
  },

  atbProduct(name, discription, oldPrice, price, sale) {
    return `${name}\n${discription}\n\n❌ Стара ціна: ${oldPrice} грн.\n🏷️ Ціна: ${price} грн.\n\n🔥 Знижка: ${sale}`;
  },

  shopsProducts(name, amount, price, data) {
    return `${name} - ${amount}\n\n🏷️ Ціна: ${price} грн.\n\n🔥 Акційний термін:\n${data}`;
  },
  productsByQuery(products) {
    return products.map((p, i) =>
      `<b>${i + 1})</b> ${p.name}\n🏬 ${p.shop}\n🆔 /p${p.uuid}\n`)
      .join('\n');
  },
  shopsInCoords(shops) {
    return shops.map((s, i) =>
      `<b>${i + 1}.</b> ${s.name}. <em>Відстань</em> - <strong>${s.distance}</strong> км.🆔 /s${s.uuid}`)
      .join('\n\n');
  },
  favouriteProducts(products) {
    return products.map(p =>
      `✅  ${p.name}\n🏷️ <b>${p.price} грн.</b>\n🏬 <b>${p.shop}</b>\n🆔 (/p${p.uuid})\n`)
      .join('\n');
  },

};
