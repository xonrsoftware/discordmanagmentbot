"use strict";

const md5File = require('md5-file/promise');
const path = require('path');
const crypto = require('crypto');
const Discord = require('discord.js');
const sharp = require('sharp');

const ManageDatabaseJSON = require('./ManageDatabaseJSON.js');
const OneEmojiClass = require('./OneEmojiClass.js');

class OneEmojiMessagesClass extends OneEmojiClass {

    constructor(MainApp, filepathstring, channelid) {
        super(MainApp, filepathstring);
        this.channelid = channelid;
    }

    init(client) {
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
    preprocessing(nextid, position) {
        let needtosave;
        [nextid, needtosave] = super.preprocessing(nextid, true).values();

        if (this.Settings.Position !== position) {
            this.Position = position;
           // this.Settings.Position = position;
           // if (!needtosave) needtosave = true;
        }else console.log(`Желаемая позиция эмодзи ${this.fullfilepath} не совпадает с фактической.`);

       // if (needtosave) this.SettingsFile.save();

        return needtosave;
    }

    /**
     * Генерация форматинного Embed для отправки.
     *
     * @param {*} emojid Референс эмодзи.
     * @returns MessageEmbed https://discord.js.org/#/docs/main/master/class/MessageEmbed.
     * @memberof OneEmojiMessagesClass
     */
    createformatedembed() {
        return this.Settings.MessageContent;
    }

    /**
     * Запуск проверки на необходимость обновления сообщения эмодзи.
     *
     * @memberof OneEmojiMessagesClass
     */
    async checkupdate() {
        // Генерируем md5 хеш картинки.
        let Message;

        // Пытаемся получить сообщение, если есть его номер. При отсутствии будет возвращено undefined.
        if (!this.Util.isBlank(this.Settings.MessageID))
            Message = await this.guild.channels.get(this.channelid).messages.fetch(this.Settings.MessageID).catch(reason => {
                if (reason.code != 10008) {
                    console.log("Emoji message get error.");
                    console.log(reason);
                    process.exit(1);
                }
            });

        const MessageContent = this.createformatedembed();

        //Устанавливаем время, если оно не установлено.
        if (this.Util.isBlank(this.Settings.MesageData.TimeStamp)) {
            this.Settings.Embed.TimeStamp = (+new Date());
        }

        // Генерируем md5 хеш на основе Embed, переведённого с помощью _apiTransform в JSON структуру.
        const NewMessageHash = crypto.createHash('md5').update(JSON.stringify(MessageContent).concat(this.Settings.ImageHash)).digest("hex");

        if ((Message == undefined || NewMessageHash != this.Settings.MesageData.MessageHash) && this.Util.isBlank(this.Settings.DontPublish)) {
            if (Message) {
                // Редактируем сообщение, если оно есть.
                await Message.edit(MessageContent);
            } else {
                // Отправляем сообщение и записываем его номер.
                this.Settings.MessageID = (await this.guild.channels.get(this.channelid).send(MessageContent)).id;
            }
            this.Settings.MessageHash = NewMessageHash;
            this.SettingsFile.save();
        }
    }

}
module.exports = OneEmojiMessagesClass;