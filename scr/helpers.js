module.exports = {

    getChatId(msg) {
        return msg.chat.id;
    },

    getItemUuid(source) {
        return source.substr(2, source.length);
    },

    sendHtml(chatId, html, keyboardName = null) {
        const options = {
            parse_mode: 'HTML'
        }

        if (keyboardName) {
            options['reply_markup'] = {
                keyboard: keyboard[keyboardName]
            }
        }

        bot.sendMessage(chatId, html, options)
    }

}