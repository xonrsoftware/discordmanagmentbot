"use strict";

const fs = require('fs');
const path = require('path');

const CommandBaseClass = require('../CommandBaseClass.js');
const ManageDatabaseJSON = require('../ManageDatabaseJSON.js');
const Util = require('../Util.js');

class Command extends CommandBaseClass {

    constructor(object) {
        super(object);
    }

    async init(...args) {

    }

    async execute(...args) {
        console.log("serverslist");
    }
    
}
module.exports = Command;