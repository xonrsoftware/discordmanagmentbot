"use strict";

const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

// Загрузка собственных классов.
const GuildStore = require('./classes/GuildStore.js');
const CommandsManager = require('./classes/CommandsManager.js');
const Util = require('./classes/Util.js');
const ManageDatabaseJSON = require('./classes/ManageDatabaseJSON.js');


/*process.on('unhandledRejection', function (reason, p) {
    console.log(`Possibly Unhandled Rejection at: Promise ${p} reason: ${reason}`);
    process.exit(1);
});*/



class MainApp {
    constructor() {
        // Инициализация файла конфигурации бота.
        this.configfile = new ManageDatabaseJSON("./config.json");
        this.config = this.configfile.load();
        this.client = new Discord.Client();
        this.Util = new Util(this);
        this.GuildStore = [];
    }
    
    async init() {

        let isready = false;

        // Событие https://discord.js.org/#/docs/main/master/class/Client?scrollTo=e-ready после подключения бота и его готовности. 
        this.client.on('ready', async () => {
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
                    const GuildStoreVar = new GuildStore(guildid, guilddir, this);
                    this.GuildStore.push(GuildStoreVar);
                    // Инициализируем.
                    promises.push(GuildStoreVar.init());
                }
            }

            await Promise.all(promises);

            const CommandsManagerVar = new CommandsManager(this);
            await CommandsManagerVar.init("./classes/Commands");
            await CommandsManagerVar.init("./classes/Commands/CustomCommands");
            await CommandsManagerVar.execute("serverslist");

            console.log("Done");
            process.exit(0);
        });

        // Предупреждение о временном ограничении запросов по API Дискорда.
        this.client.on('rateLimit', (rateLimitInfo) => {
            console.log(`Warning, rate limited: ${JSON.stringify(rateLimitInfo)}`);
        });

        // Блок выключения при возникновении ошибок.
        this.client.on('error', (error) => {
            console.log(`Error d.js: ${error}`);
            process.exit(1);
        });


        // Запуск бота https://discord.js.org/#/docs/main/master/class/Client?scrollTo=login, токен из конфигурационного файла config.json в корне папки бота.
        this.client.login(this.config.token);
    }

}
// Инициализируем приложение.
(new MainApp()).init();