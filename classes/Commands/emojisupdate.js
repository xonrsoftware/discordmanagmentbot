"use strict";

const fs = require('fs');
const path = require('path');

const CommandBaseClass = require('../CommandBaseClass.js');
const OneEmojiClass = require('../OneEmojiClass.js');
const ManageDatabaseJSON = require('../ManageDatabaseJSON.js');

class Command extends CommandBaseClass {

    constructor(object) {
        super(object);
        
    }

    async init(...args) {

    }

    async execute() {
        console.log("emojisupdate");
        // Загружаем конфигурацию для сервера.
        this.Settings = (new ManageDatabaseJSON(`${this.basedir}/config.json`)).load();

        if (this.Util.isBlank(this.Settings.ChannelID)) throw new Error("Не задан текстовый канал для сервера " + this.guildid);

        // Загружаем все эмодзи для сервера.
        const activedirectory = path.resolve(`${this.basedir}/active`);
        const files = fs.readdirSync(activedirectory);
        for (const filename of files) {
            if (path.extname(filename) === ".json") {
                // Создаём экземпляр класса эмодзи для каждого найденного .json файла.
                const EmojiGuild = new OneEmojiClass(this.MainApp, path.resolve(activedirectory, filename), this.Settings.ChannelID);
                this.emojisarray.push(EmojiGuild);
                // Инициализируем.
                await EmojiGuild.init(this.client);
            }
        }

        if (this.emojisarray.length === 0) throw new Error("Отсутствует эмодзи для сервера " + this.guildid);

        // Получаем первый свободный ID.
        let availableid = 1 + Math.max(...this.emojisarray.map(emoji => emoji.UniqueID));

        let position = 0;

        for (const emoji of this.emojisarray) {
            // Заполняем пропуски позиции, исправляем другие ошибки. Задаём уникальный номер, если его нет.
            availableid = await emoji.preprocessing(availableid);
        }

        for (const Emoji of this.emojisarray) {
            await Emoji.checkupdate();
        }
    }

}
module.exports = Command;