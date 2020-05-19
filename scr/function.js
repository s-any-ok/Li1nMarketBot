module.exports = {

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