'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShopSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  uuid: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  location: {
    type: Schema.Types.Mixed,
  },
  products: {
    type: [String],
    default: [],
  },
});

mongoose.model('shops', ShopSchema);
