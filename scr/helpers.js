module.exports = {

    getChatId(msg){
        return msg.chat.id;
    },

    getItemUuid(source){
        return source.uuid;
    }

}