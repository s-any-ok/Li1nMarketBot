'use strict';

const needle = require('needle');
const cheerio = require('cheerio');
const functions = require('./functions');

const url = 'https://www.atbmarket.com/hot/akcii/economy/';
const urlImg = 'https://www.atbmarket.com/';

needle.get(url, (error, res) => {
  if (error) throw error;

  const $ = cheerio.load(res.body);

  const promoText = $('.promo_info').text();
  const promoInfo = functions.getPromoInfo(promoText);
  const allProductsInfo = functions.getProductsObj(promoInfo);

  const productsImgs = [];
  $('.promo_image_link img').each((i, v) => {
    if (!$(v).attr('data-src')) return false;
    const imgUrl = urlImg + $(v).attr('data-src');
    productsImgs.push({ imgUrl });
  });

  const productsFullInfo = functions.getProductsFullInfo(allProductsInfo, productsImgs);
  console.log(productsFullInfo);
});
