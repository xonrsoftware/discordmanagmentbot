"use strict";

class StaticUtil {

    /**
     * Используется через await для ожидания указанного времени.
     *
     * @param {*} millis миллисекунды
     * @returns обещание
     */
    sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }

    /**
     * Проверка, что переменная не равна null или undefined и длина больше нуля.
     *
     * @param {*} str
     * @returns
     */
    isEmpty(str) {
        return (!str || 0 === str.length);
    }

    /**
     * Проверка, что переменная не равна null или undefined и содержимое не пустое.
     *
     * @param {*} str
     * @returns
     */
    isBlank(str) {
        return (!str || /^\s*$/.test(str));
    }

    /**
     * Отчистить текстовый канал от сообщений, игнорирует ошибку 10008 (неизвестное сообщение, может возникнуть, если сообщение было удалено до фактического исполнения нашего удаления, (Unknown message) https://discordapp.com/developers/docs/topics/opcodes-and-status-codes#json-json-error-codes).
     *
     * @param {*} channel референс канала из Discord.js.
     * @param {*} compare функция сравнения, в первый аргумент передаётся референс сообщения Discord.js. Да - оставить, нет - удалить.
     */
    async CleanUpTextChannel(channel, compare) {
        let lastid = null;
        while (true) {
            const messages = await channel.messages.fetch({
                limit: 100,
                ...(lastid !== null && {
                    before: lastid
                })
            });
            if (messages.size > 0) {
                lastid = messages.last().id;
                await Promise.all(messages.filter(x => !compare(x)).map(x => x.delete())).catch(reason => {
                    if (reason.code != 10008) {
                        console.log("DeletionError:" + reason);
                        process.exit(1);
                    }
                });
            } else {
                break;
            }
        }
    }

    /**
     * Является ли строка JSON структурой.
     *
     * @param {*} something строка для проверки.
     * @returns В случае успеха возвращает JSON структуру, иначе вернёт undefined.
     */
    isJSON(something) {
        if (typeof something != 'string')
            something = JSON.stringify(something);
        try {
            return JSON.parse(something);
        } catch (e) {
            return undefined;
        }
    }

}
module.exports = StaticUtil;