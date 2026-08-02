"use strict";

const banco = require("../database/conexao");

function buscarPorEmail(email) {
    return banco
        .prepare(`
            SELECT
                usuarios.id,
                usuarios.loja_id,
                usuarios.nome,
                usuarios.email,
                usuarios.senha,
                usuarios.tipo,
                usuarios.ativo,

                lojas.nome AS loja_nome,
                lojas.slug AS loja_slug,
                lojas.ativo AS loja_ativa,
                lojas.status AS loja_status

            FROM usuarios

            LEFT JOIN lojas
                ON lojas.id = usuarios.loja_id

            WHERE LOWER(usuarios.email) = LOWER(?)

            LIMIT 1
        `)
        .get(email);
}

function buscarPorId(id) {
    return banco
        .prepare(`
            SELECT
                usuarios.id,
                usuarios.loja_id,
                usuarios.nome,
                usuarios.email,
                usuarios.tipo,
                usuarios.ativo,

                lojas.nome AS loja_nome,
                lojas.slug AS loja_slug,
                lojas.ativo AS loja_ativa,
                lojas.status AS loja_status

            FROM usuarios

            LEFT JOIN lojas
                ON lojas.id = usuarios.loja_id

            WHERE usuarios.id = ?

            LIMIT 1
        `)
        .get(id);
}

function buscarSessaoValida(id) {
    return banco
        .prepare(`
            SELECT
                usuarios.id,
                usuarios.loja_id,
                usuarios.nome,
                usuarios.email,
                usuarios.tipo,
                usuarios.ativo,

                lojas.nome AS loja_nome,
                lojas.slug AS loja_slug,
                lojas.ativo AS loja_ativa,
                lojas.status AS loja_status

            FROM usuarios

            LEFT JOIN lojas
                ON lojas.id = usuarios.loja_id

            WHERE
                usuarios.id = ?
                AND usuarios.ativo = 1

            LIMIT 1
        `)
        .get(id);
}

function registrarAcesso(id) {
    banco
        .prepare(`
            UPDATE usuarios
            SET ultimo_acesso = CURRENT_TIMESTAMP
            WHERE id = ?
        `)
        .run(id);
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    buscarSessaoValida,
    registrarAcesso
};
