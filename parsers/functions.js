'use strict';

const jsonBeautify = require('json-beautify');

module.exports = {
  getPromoInfo(promoText) {
    return promoText.split`\n`.map(w => w.trim()).filter(n => n);
  },
  getProductsObj(promoInfo) {
    const products = [];

    for (let i = 0; i < promoInfo.length; i += 7) {

      const economy = promoInfo[i];

      if (economy[0] !== 'Е') break;

      const id = i / 7 + 1;
      const name = promoInfo[i + 5];
      const discription = promoInfo[i + 6];
      const sale = promoInfo[i + 1];
      const price = parseInt(promoInfo[i + 2]) / 100;
      const oldPrice = parseFloat(promoInfo[i + 4]);

      const product = makeProduct(id, name, discription, sale, price, oldPrice);

      products.push(product);
    }
    return products;
  },

  createProductsFullInfo(allProductsInfo, productsImgs) {
    const productsFullInfo = [];
    for (let i = 0; i < allProductsInfo.length; i++) {
      const productFullInfo = Object.assign(allProductsInfo[i], productsImgs[i]);
      productsFullInfo.push(productFullInfo);
    }
    return productsFullInfo;
  },

  serializeInfoTojson(productsFullInfo) {
    const typeOfItems = 'products';
    const objectForDatabase = { [typeOfItems]: productsFullInfo };
    return jsonBeautify(objectForDatabase, null, 2, 80);
  },

};

function makeProduct(id, name, discription, sale, price, oldPrice) {
  return { id, name, discription, sale, price, oldPrice };
}
