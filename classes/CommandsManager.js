"use strict";

const fs = require('fs');
const path = require('path');

const ManageDatabaseJSON = require('./ManageDatabaseJSON.js');
const Util = require('./Util.js');

class CommandsManager {

    constructor(MainApp) {
        this.MainApp = MainApp;
        this.client = MainApp.client;
        this.commands = new Map();
    }

    async init(fullpath) {
        let promises = [];
        let arraytoprocess = [];

        if (fs.statSync(fullpath).isDirectory())
            arraytoprocess = fs.readdirSync(fullpath).map(entry => path.resolve(`${fullpath}/${entry}`)).filter(entry => !fs.statSync(entry).isDirectory());
        else
            arraytoprocess = [fullpath];

        for (const commandclassfile of arraytoprocess) {
            const Command = require(commandclassfile);

            const filebasename = path.basename(commandclassfile, ".js");
            // Создаём экземпляр класса команды.
            const CommandClass = new Command(this);
            // Добавляем команду по названию файла класса.
            this.commands.set(filebasename, CommandClass);

            // Инициализируем.
            promises.push(CommandClass.init());
        }

        await Promise.all(promises);
    }

    async execute(...args) {
        let command = this.commands.get(args[0]);
        if (command !== undefined) {
            await command.execute();
        } else throw new Error(`Комманда ${args[0]} была не найдена.`);
    }

}
module.exports = CommandsManager;