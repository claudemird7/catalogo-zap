"use strict";

const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const caminhoBanco = path.join(
    __dirname,
    "catalogo.db"
);

const banco = new DatabaseSync(caminhoBanco);

banco.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
`);

module.exports = banco;
