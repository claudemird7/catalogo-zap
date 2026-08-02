"use strict";

const banco = require("../database/conexao");

console.log("Criando banco de dados...");

// =========================
// TABELA LOJAS
// =========================
banco.exec(`
CREATE TABLE IF NOT EXISTS lojas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    whatsapp TEXT,
    cor_principal TEXT DEFAULT '#1688f8',
    cor_whatsapp TEXT DEFAULT '#25d366',
    ativo INTEGER DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// =========================
// TABELA CATEGORIAS
// =========================
banco.exec(`
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loja_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    slug TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,

    FOREIGN KEY(loja_id)
        REFERENCES lojas(id)
        ON DELETE CASCADE
);
`);

// =========================
// TABELA PRODUTOS
// =========================
banco.exec(`
CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loja_id INTEGER NOT NULL,
    categoria_id INTEGER,

    nome TEXT NOT NULL,
    descricao TEXT,

    preco REAL NOT NULL,
    preco_promocional REAL,

    imagem TEXT,

    ativo INTEGER DEFAULT 1,

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(loja_id)
        REFERENCES lojas(id)
        ON DELETE CASCADE,

    FOREIGN KEY(categoria_id)
        REFERENCES categorias(id)
        ON DELETE SET NULL
);
`);

// =========================
// TABELA USUÁRIOS
// =========================
banco.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    loja_id INTEGER,

    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,

    tipo TEXT NOT NULL DEFAULT 'lojista',
    ativo INTEGER NOT NULL DEFAULT 1,

    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(loja_id)
        REFERENCES lojas(id)
        ON DELETE CASCADE
);
`);

require("../database/migracoes").executarMigracoes();

console.log("Banco criado com sucesso, incluindo as tabelas de variações.");

banco.close();