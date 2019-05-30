"use strict";

const fs = require('fs');
const path = require('path');

const OneEmojiClass = require('./OneEmojiClass.js');
const ManageDatabaseJSON = require('./ManageDatabaseJSON.js');
const Util = require('./Util.js');

class GuildStore {

    constructor(guildid, basedir, MainApp) {
        this.client = MainApp.client;
        this.guildid = guildid;
        this.basedir = basedir;
    }

    async init(MainApp) {
        this.guild = this.client.guilds.get(this.guildid);
    }

}
module.exports = GuildStore;