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

        // Сортируем эмодзи по их желаемой позиции.
        this.emojisarray = this.emojisarray.sort((a, b) => {
            if (a.Settings.Position < b.Settings.Position)
                return -1;
            if (a.Settings.Position > b.Settings.Position)
                return 1;
            return 0;
        });

        // Получаем первый свободный ID.
        let availableid = 1 + Math.max(...this.emojisarray.map(emoji => emoji.UniqueID));

        let position = 0;

        for (const emoji of this.emojisarray) {
            // Заполняем пропуски позиции, исправляем другие ошибки. Задаём уникальный номер, если его нет.
            availableid = await emoji.preprocessing(availableid, position++);
        }

        // Проверяем нужно ли перерисовывать список в канале.
        const ExistingMessages = await this.СheckPositionsOfMessages();

        // Синхронно добавляем новые элементы.
        for (const Emoji of this.emojisarray.filter(Emoji => !ExistingMessages.includes(Emoji.Settings.MessageID))) {
            await Emoji.checkupdate();
        }

        // Ассинхронно проверяем обновление для каждого эмодзи и ожидаем проверки всех.
        await Promise.all(this.emojisarray.map(Emoji => ExistingMessages.includes(Emoji.Settings.MessageID)));
    }

    /**
     * Проверка позиций эмодзи в текстовом канале на Дискорд сервере, очищение при необходимости.
     *
     * @returns массив с существующими номерами сообщений эмодзи в текстовом канале.
     * @memberof CommandBaseClass
     */
    async СheckPositionsOfMessages() {
        // Отчищаем канал от всех сообщений, которые отсутствуют в файлах эмодзи.
        await this.Util.CleanUpTextChannel(this.client.channels.get(this.Settings.ChannelID), (Message) => {
            return this.emojisarray.findIndex(EmojiContainer => EmojiContainer.Settings.MessageID == Message.id) === -1 ? false : true;
        });

        let ExistingMessages = [];
        let LastID = null;
        let FirstEncounter;
        let NeedToWipe = false;
        // Цикл проверки позиции эмодзи в канале.
        while (true) {
            // Получаем следующие 100 сообщений, порядо от последнего сообщения в канале.
            const Messages = await this.client.channels.get(this.Settings.ChannelID).messages.fetch({
                limit: 100,
                ...(LastID !== null && {
                    before: LastID
                })
            });
            if (Messages.size > 0) {
                LastID = Messages.last().id;
                for (const Message of Messages.values()) {
                    // Находим первый элемент с совпадающим номером сообщеиня.
                    const Element = this.emojisarray.find(EmojiContainer => EmojiContainer.Settings.MessageID == Message.id);
                    if (Element !== undefined) {
                        if (FirstEncounter === undefined) FirstEncounter = Element.Settings.Position;
                        // Начинаем идти от первого найденного сообщения и проверять позицию на совпадение.
                        else if (--FirstEncounter != Element.Settings.Position) {
                            NeedToWipe = true;
                            break;
                        }

                        ExistingMessages.push(Message.id);
                    }
                }
                if (NeedToWipe) break;
            } else {
                break;
            }
        }

        // Если мы не дошли до нуля, и первое совпадение было найдено. 
        if (!NeedToWipe && FirstEncounter !== 0 && FirstEncounter !== undefined) NeedToWipe = true;

        if (NeedToWipe === true) {
            // Отчищаем канал от всех сообщений, если нужно.
            await this.Util.CleanUpTextChannel(this.client.channels.get(this.Settings.ChannelID), () => {
                return false;
            });
            return [];
        }
        return ExistingMessages;
    }

}
module.exports = Command;