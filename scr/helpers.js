'use strict';
module.exports = {

  getChatId(msg) {
    return msg.chat.id;
  },

  getItemUuid(source) {
    return source.substr(2, source.length);
  },

  byField(field) {
    return (a, b) =>
      (a[field] > b[field] ? 1 : -1);
  },

};
