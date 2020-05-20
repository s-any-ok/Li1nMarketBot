'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  uuid: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
  },
  amount: {
    type: String,
  },
  data: {
    type: String,
  },
  link: {
    type: String,
  },
  picture: {
    type: String,
  },
  shop: {
    type: String,
  },
});

mongoose.model('products', ProductSchema);
