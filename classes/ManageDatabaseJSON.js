"use strict";

const StaticUtil = require('./StaticUtil.js');
const fs = require('fs');
const path = require('path');

/**
 * Класс для работы с .json файлами. Нужен для устранения битых файлов при экстренном отключении.
 *
 * @class ManageDatabaseJSON
 */
class ManageDatabaseJSON {

    constructor(filepathstring) {
        this.StaticUtil = new StaticUtil();
        this.fullfilepath = path.resolve(filepathstring);
        this.fileext = path.extname(this.fullfilepath);
        this.filebasename = path.basename(this.fullfilepath, this.fileext);
        this.filedir = path.dirname(this.fullfilepath);
        this.tempfilepath = `${this.filedir}/${this.filebasename}.tmp`;
        this.data = undefined;
    }

    /**
     * Проверяет наличие временного файла, его соответствие JSON. Заменяет обычный файл новым, если необходимо.
     *
     * @param {*} skipjsoncheck Пропускаем проверку, если мы уверены в том, что в файле JSON структура.
     * @returns Да/Нет Во временном файле находится JSON структура? (только, если не пропускается проверка)
     * @memberof ManageDatabaseJSON
     */
    tempfilecheck(skipjsoncheck) {
        if (fs.existsSync(this.tempfilepath)) {
            if (skipjsoncheck || this.StaticUtil.util.isJSON(fs.readFileSync(this.tempfilepath, 'utf8')) !== undefined) {
                fs.renameSync(this.tempfilepath, this.fullfilepath);
                return true;
            } else fs.unlinkSync(this.tempfilepath);
        }
        return false;
    }

    /**
     * Загружает в переменную this.data JSON структуру из .json файла.
     *
     * @returns JSON структуру.
     * @memberof ManageDatabaseJSON
     */
    load() {
        if (fs.existsSync(this.fullfilepath)) {
            let skipcheck = this.tempfilecheck();
            let filedata = fs.readFileSync(this.fullfilepath, 'utf8');
            if (!skipcheck) {
                filedata = this.StaticUtil.isJSON(filedata);
            } else filedata = JSON.parse(filedata);
            if (filedata !== undefined) {
                this.data = filedata;
                return this.data;
            } else throw new Error(`Файл ${this.fullfilepath} не является JSON структурой.`);
        } else throw new Error(`Файл ${this.fullfilepath} не существует.`);
    }

    /**
     * Сохраняет данные в .json файл.
     *
     * @memberof ManageDatabaseJSON
     */
    save() {
        if (this.data !== undefined) {
            fs.writeFileSync(this.tempfilepath, JSON.stringify(this.data, null, 4), {
                encoding: 'utf8',
                flag: 'w'
            });
            this.tempfilecheck(true);
        } else throw new Error(`Данные файла ${this.fullfilepath} не определены.`);
    }

}
module.exports = ManageDatabaseJSON;