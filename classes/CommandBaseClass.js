"use strict";

const fs = require('fs');
const path = require('path');

const ManageDatabaseJSON = require('./ManageDatabaseJSON.js');
const Util = require('./Util.js');

class CommandBaseClass {

    constructor(CommandManager) {
        this.MainApp = CommandManager.MainApp;
        this.Util = CommandManager.MainApp.Util;
        this.client = CommandManager.MainApp.client;
        this.ServerSettings = CommandManager.MainApp.ServerSettings;
        this.GuildStore = CommandManager.MainApp.GuildStore;
    }

    async init(...args) {

    }

    async execute(...args) {

    }
    
}
module.exports = CommandBaseClass;