'use strict';

const needle = require('needle');
const cheerio = require('cheerio');
const fs = require('fs');
const functions = require('./functions');


const shopUrl = 'https://www.atbmarket.com/';
const economyUrl = shopUrl + 'hot/akcii/economy/';


needle.get(economyUrl, (error, res) => {
  if (error) throw error;

  const $ = cheerio.load(res.body);

  const promoText = $('.promo_info').text();
  const promoInfo = functions.getPromoInfo(promoText);
  const allProductsInfo = functions.getProductsObj(promoInfo);

  const productsImgs = [];
  $('.promo_image_link img').each((i, v) => {
    if (!$(v).attr('data-src')) return false;
    const imgUrl = shopUrl + $(v).attr('data-src');
    productsImgs.push({ imgUrl, shopUrl });
  });

  const productsFullInfo = functions.createProductsFullInfo(allProductsInfo, productsImgs);

  const jsonData = functions.serializeInfoTojson(productsFullInfo);
  const jsonFile = './atb-database.json';
  fs.writeFile(jsonFile, jsonData, () => {
    console.log('Saved ' + jsonFile);
  });
});
