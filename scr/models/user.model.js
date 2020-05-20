'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  telegramId: {
    type: Number,
    required: true,
  },
  products: {
    type: [String],
    default: [],
  },
});

mongoose.model('users', UserSchema);
