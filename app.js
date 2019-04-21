"use strict";

const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const path = require('path');

// Загрузка собственных классов.
const ScriptEmojiGuildStore = require('./classes/ScriptEmojiGuildStore.js');
const ManageDatabaseJSON = require('./classes/ManageDatabaseJSON.js');

// Предупреждение о временном ограничении запросов по API Дискорда.
client.on('rateLimit', (rateLimitInfo) => {
    console.log(`Warning, rate limited: ${JSON.stringify(rateLimitInfo)}`);
});

// Блок выключения при возникновении ошибок.
client.on('error', (error) => {
    console.log(`Error d.js: ${error}`);
    process.exit(1);
});

process.on('unhandledRejection', function (reason, p) {
    console.log(`Possibly Unhandled Rejection at: Promise ${p} reason: ${reason}`);
    process.exit(1);
});

process.on('uncaughtException', function (err) {
    console.log(`Caught exception: ${err}`);
    process.exit(1);
});

// Инициализация файла конфигурации бота.
const configfile = new ManageDatabaseJSON("./config.json");
const config = configfile.load();


let isready = false;

// Событие https://discord.js.org/#/docs/main/master/class/Client?scrollTo=e-ready после подключения бота и его готовности. 
client.on('ready', async () => {
    // Предотвращаем повторной вызов функции, если она уже была обработана. (Возможно при повторном подключении к Discord серверам после обрыва связи.)
    if (isready) return;
    else isready = true;

    const fullpath = path.resolve("./data/servers");
    let promises = [];
    // Ассинхронно инициализируем все необходимые сервера.
    for (const guildid of fs.readdirSync(fullpath).filter(guildid => guildid !== "000000000000000000")) {
        const guilddir = path.resolve(fullpath, guildid);
        if (fs.statSync(guilddir).isDirectory()) {
            // Создаём экземпляр класса сервера.
            const ScriptEmojiGuildStoreVar = new ScriptEmojiGuildStore(guildid, guilddir);
            // Инициализируем.
            promises.push(ScriptEmojiGuildStoreVar.init(client));
        }
    }
    await Promise.all(promises);
    console.log("Done");
    process.exit(0);
});

// Запуск бота https://discord.js.org/#/docs/main/master/class/Client?scrollTo=login, токен из конфигурационного файла config.json в корне папки бота.
client.login(config.token);