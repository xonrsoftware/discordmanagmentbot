"use strict";

const md5File = require('md5-file/promise');
const path = require('path');
const crypto = require('crypto');
const Discord = require('discord.js');
const sharp = require('sharp');

const ManageDatabaseJSON = require('./ManageDatabaseJSON.js');

class OneEmojiClass {

    constructor(MainApp, filepathstring) {
        this.MainApp = MainApp;
        this.Util = MainApp.Util;

        // Информация о конфигурационном файле.
        this.fullfilepath = path.resolve(filepathstring);
        this.filebasename = path.basename(this.fullfilepath, ".json");
        this.filedir = path.dirname(this.fullfilepath);

        // Создание полных путей к другим файлам.
        this.fullpathtempfile = path.resolve(this.filedir, `${this.filebasename}.tmp`);
        this.fullapthimagefile = path.resolve(this.filedir, `${this.filebasename}.png`);
    }

    async init(client) {
        // Получаем список эмодзи по названию.
        let emojisarray = this.guild.emojis.filter(x => x.name == this.Settings.EmojiName).array();
        // Вырезаем первый элемент.
        this.emojid = emojisarray.shift();
        // Удаляем остальные
        await Promise.all(emojisarray.map(x => x.delete()));
        if (!this.client) {
            this.client = client;
            this.guild = client.guilds.get(this.guildid);
            this.SettingsFile = new ManageDatabaseJSON(this.fullfilepath);
            this.Settings = this.SettingsFile.load();
        } else throw new Error(`Сервер ${this.guildid} уже был инициализирован.`);
    }

    /**
     *  Проверяет необходимость установки уникального номера, изменения позиции эмодзи в конфигурационном файле.
     *
     * @param {*} nextid свободный уникальный номер.
     * @param {*} position необходимая позиция эмодзи.
     * @returns уникальный номер эмодзи.
     * @memberof OneEmojiClass
     */
    preprocessing(nextid, ignoresave = false) {
        let needtosave = false;

        if (this.Util.isBlank(this.Settings.UniqueID) || this.Settings.UniqueID === -1) {
            this.Settings.UniqueID = nextid++;
            needtosave = true;
        }

        if (needtosave && !ignoresave) this.SettingsFile.save();

        return {
            nextid: nextid,
            saved: needtosave
        };
    }


    /**
     * Запуск проверки на необходимость обновления эмодзи и его сообщения.
     *
     * @memberof OneEmojiClass
     */
    async checkupdate() {
        // Генерируем md5 хеш картинки.
        const newimagehash = await md5File(this.fullapthimagefile);
        let needimageupdate = false;

        if (newimagehash != this.Settings.ImageHash) {
            // Устанавливаем новый md5 хеш картинки.
            this.Settings.ImageHash = newimagehash;
            needimageupdate = true;
        }

        if (!needimageupdate) {
            // Нужно обновить эмодзи, если он отсутствует.
            if (this.emojid === undefined) needimageupdate = true;
        }

        if (needimageupdate) {
            // Удаляем прошлый эмодзи, если он есть.
            if (this.emojid !== undefined) await this.emojid.delete();
            // Создаём новый эмодзи и получаем референс класса https://discord.js.org/#/docs/main/master/class/GuildEmoji. 
            this.emojid = await this.guild.emojis.create(this.fullapthimagefile, this.Settings.EmojiName);
        }

        //Сбрасываем хеш сообщения, если было обновление картинки.
        if (this.Settings.MessageHash !== undefined)
            this.Settings.MessageHash = "";

        this.SettingsFile.save();
        return needimageupdate;
    }

}
module.exports = OneEmojiClass;