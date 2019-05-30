"use strict";

class Util {

    constructor(MainApp) {
        this.MainApp = MainApp;
    }
    /**
     * Используется через await для ожидания указанного времени.
     *
     * @param {*} millis миллисекунды
     * @returns обещание
     */
    sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }

    ResolveServerID(MainApp, serverid) {
        const server = serverid.length >= 18 ? this.MainApp.GuildStore.find(guild => guild.guildid == serverid) : this.MainApp.GuildStore[serverid];
        if (server === undefined) throw new Error(`Сервер ${serverid} не был найден, проверьте, что папка существует.`);
        else return server;
    }
    
}
module.exports = Util;