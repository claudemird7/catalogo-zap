"use strict";

const banco = require("../database/conexao");

function buscarPorSlug(slug) {
    return banco.prepare(`
        SELECT
            *
        FROM lojas
        WHERE slug = ?
          AND ativo = 1
          AND COALESCE(status, 'ativa') = 'ativa'
        LIMIT 1
    `).get(slug);
}

function buscarPrimeiraAtiva() {
    return banco.prepare(`
        SELECT
            *
        FROM lojas
        WHERE ativo = 1
          AND COALESCE(status, 'ativa') = 'ativa'
        ORDER BY id
        LIMIT 1
    `).get();
}

function buscarPorId(id) {
    return banco.prepare(`
        SELECT *
        FROM lojas
        WHERE id = ?
        LIMIT 1
    `).get(id);
}

function atualizarConfiguracoes(id, dados) {
    return banco.prepare(`
        UPDATE lojas
        SET
            nome = ?,
            slogan = ?,
            logo = ?,
            banner = ?,
            favicon = ?,
            cor_primaria = ?,
            cor_secundaria = ?,
            mensagem_boas_vindas = ?,
            texto_rodape = ?,
            descricao = ?,
            instagram = ?,
            facebook = ?,
            tiktok = ?,
            site = ?,
            endereco = ?,
            horario_atendimento = ?,
            ano_fundacao = ?
        WHERE id = ?
    `).run(
        dados.nome,
        dados.slogan,
        dados.logo,
        dados.banner,
        dados.favicon,
        dados.cor_primaria,
        dados.cor_secundaria,
        dados.mensagem_boas_vindas,
        dados.texto_rodape,
        dados.descricao,
        dados.instagram,
        dados.facebook,
        dados.tiktok,
        dados.site,
        dados.endereco,
        dados.horario_atendimento,
        dados.ano_fundacao,
        id
    );
}

module.exports = {
    buscarPorSlug,
    buscarPrimeiraAtiva,
    buscarPorId,
    atualizarConfiguracoes
};