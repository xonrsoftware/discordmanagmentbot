"use strict";

const md5File = require('md5-file/promise');
const path = require('path');
const crypto = require('crypto');
const Discord = require('discord.js');
const sharp = require('sharp');

const Util = require('./Util.js');
const ManageDatabaseJSON = require('./ManageDatabaseJSON.js');

class ScriptOneEmojiGuildStore {

    constructor(guildid, filepathstring, channelid) {
        this.guildid = guildid;
        this.channelid = channelid;

        // Информация о конфигурационном файле.
        this.fullfilepath = path.resolve(filepathstring);
        this.filebasename = path.basename(this.fullfilepath, ".json");
        this.filedir = path.dirname(this.fullfilepath);

        // Создание полных путей к другим файлам.
        this.fullpathtempfile = path.resolve(this.filedir, `${this.filebasename}.tmp`);
        this.fullapthimagefile = path.resolve(this.filedir, `${this.filebasename}.png`);
    }

    async init(client) {
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
     * @memberof ScriptOneEmojiGuildStore
     */
    async preprocessing(nextid, position) {
        let needtosave = false;

        if (Util.isBlank(this.Settings.UniqueID) || this.Settings.UniqueID === -1) {
            this.Settings.UniqueID = nextid++;
            needtosave = true;
        }

        if (this.Settings.Position !== position) {
            this.Settings.Position = position;
        }

        if (needtosave) this.SettingsFile.save();

        return nextid;
    }

    /**
     * Генерация форматинного Embed для отправки.
     *
     * @param {*} emojid Референс эмодзи.
     * @returns MessageEmbed https://discord.js.org/#/docs/main/master/class/MessageEmbed.
     * @memberof ScriptOneEmojiGuildStore
     */
    async createformatedembed(emojid) {
        return new Discord.MessageEmbed()
            .setTitle(this.Settings.Embed.Title)
            .setDescription(this.Settings.Embed.Description)
            .setTimestamp(this.Settings.Embed.TimeStamp)
            .setURL(this.Settings.Embed.URL)
            .addField("Предпросмотр", `\n(16x16):\n${emojid}\n\n(32x32):`)
            .setImage("attachment://" + this.filebasename + "_small.png")
            .attachFiles([{
                attachment: (await sharp(this.fullapthimagefile)
                    .resize(32, 32)
                    .toBuffer()),
                name: this.filebasename + "_small.png"
            }, {
                attachment: this.fullapthimagefile,
                name: this.filebasename + ".png"
            }])
            .setThumbnail("attachment://" + this.filebasename + ".png")
            .setColor(this.Settings.Embed.Color);
    }

    /**
     * Запуск проверки на необходимость обновления эмодзи и его сообщения.
     *
     * @memberof ScriptOneEmojiGuildStore
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
        // Получаем список эмодзи по названию.
        let emojisarray = this.guild.emojis.filter(x => x.name == this.Settings.EmojiName).array();
        // Вырезаем первый элемент.
        let emojid = emojisarray.shift();
        // Удаляем остальные
        await Promise.all(emojisarray.map(x => x.delete()));


        if (!needimageupdate) {
            // Нужно обновить эмодзи, если он отсутствует.
            if (emojid === undefined) needimageupdate = true;
        }

        if (needimageupdate) {
            // Удаляем прошлый эмодзи, если он есть.
            if (emojid !== undefined) await emojid.delete();
            // Создаём новый эмодзи и получаем референс класса https://discord.js.org/#/docs/main/master/class/GuildEmoji. 
            emojid = await this.guild.emojis.create(this.fullapthimagefile, this.Settings.EmojiName);
        }

        let Message = undefined;

        // Пытаемся получить сообщение, если есть его номер. При отсутствии будет возвращено undefined.
        if (!Util.isBlank(this.Settings.MessageID))
            Message = await this.guild.channels.get(this.channelid).messages.fetch(this.Settings.MessageID).catch(reason => {
                if (reason.code != 10008) {
                    console.log("Emoji message get error.");
                    console.log(reason);
                    process.exit(1);
                }
            });

        const Embed = await this.createformatedembed(emojid);

        //Устанавливаем время, если оно не установлено.
        if (Util.isBlank(this.Settings.Embed.TimeStamp)) {
            this.Settings.Embed.TimeStamp = (+new Date());
        }

        // Генерируем md5 хеш на основе Embed, переведённого с помощью _apiTransform в JSON структуру.
        const NewMessageHash = crypto.createHash('md5').update(JSON.stringify(Embed._apiTransform())).digest("hex");

        if ((Message == undefined || needimageupdate || NewMessageHash != this.Settings.MessageHash) && Util.isBlank(this.Settings.DontPublish)) {
            if (Message) {
                // Редактируем сообщение, если оно есть.
                await Message.edit(Embed);
            } else {
                // Отправляем сообщение и записываем его номер.
                this.Settings.MessageID = (await this.guild.channels.get(this.channelid).send(Embed)).id;
            }
            this.Settings.MessageHash = NewMessageHash;
            this.SettingsFile.save();
        }
    }

};
module.exports = ScriptOneEmojiGuildStore;