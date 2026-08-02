"use strict";

const banco = require("../database/conexao");

function buscarPorId(id) {
    return banco.prepare(`
        SELECT
            id,
            nome,
            limite_produtos,
            permite_atacado,
            permite_estoque,
            valor_mensal,
            ativo,
            criado_em
        FROM planos
        WHERE id = ?
        LIMIT 1
    `).get(id);
}

function buscarPlanoDaLoja(lojaId) {
    return banco.prepare(`
        SELECT
            p.id,
            p.nome,
            p.limite_produtos,
            p.permite_atacado,
            p.permite_estoque,
            p.valor_mensal,
            p.ativo,
            a.status AS assinatura_status,
            a.vencimento
        FROM lojas l
        LEFT JOIN assinaturas a
            ON a.loja_id = l.id
        LEFT JOIN planos p
            ON p.id = COALESCE(a.plano_id, l.plano_id)
        WHERE l.id = ?
        LIMIT 1
    `).get(lojaId);
}

function listarAtivos() {
    return banco.prepare(`
        SELECT
            id,
            nome,
            limite_produtos,
            permite_atacado,
            permite_estoque,
            valor_mensal
        FROM planos
        WHERE ativo = 1
        ORDER BY valor_mensal, id
    `).all();
}

function contarProdutosDaLoja(lojaId) {
    const resultado = banco.prepare(`
        SELECT COUNT(*) AS total
        FROM produtos
        WHERE loja_id = ?
          AND ativo = 1
    `).get(lojaId);

    return Number(resultado?.total || 0);
}

function podeCadastrarProduto(lojaId) {
    const plano = buscarPlanoDaLoja(lojaId);

    if (!plano) {
        return {
            permitido: false,
            motivo: "A loja ainda não possui um plano configurado.",
            plano: null,
            totalProdutos: 0
        };
    }

    if (plano.ativo !== 1) {
        return {
            permitido: false,
            motivo: "O plano da loja está inativo.",
            plano,
            totalProdutos: 0
        };
    }

    if (
        plano.assinatura_status &&
        plano.assinatura_status !== "ativa"
    ) {
        return {
            permitido: false,
            motivo: "A assinatura da loja não está ativa.",
            plano,
            totalProdutos: 0
        };
    }

    const totalProdutos = contarProdutosDaLoja(lojaId);
    const limiteProdutos = Number(plano.limite_produtos || 0);

    if (limiteProdutos === 0) {
        return {
            permitido: true,
            motivo: null,
            plano,
            totalProdutos
        };
    }

    if (totalProdutos >= limiteProdutos) {
        return {
            permitido: false,
            motivo:
                `Seu plano permite até ${limiteProdutos} produtos ativos.`,
            plano,
            totalProdutos
        };
    }

    return {
        permitido: true,
        motivo: null,
        plano,
        totalProdutos
    };
}

function permiteAtacado(lojaId) {
    const plano = buscarPlanoDaLoja(lojaId);

    return Boolean(
        plano &&
        plano.ativo === 1 &&
        Number(plano.permite_atacado) === 1
    );
}

function permiteEstoque(lojaId) {
    const plano = buscarPlanoDaLoja(lojaId);

    return Boolean(
        plano &&
        plano.ativo === 1 &&
        Number(plano.permite_estoque) === 1
    );
}

module.exports = {
    buscarPorId,
    buscarPlanoDaLoja,
    listarAtivos,
    contarProdutosDaLoja,
    podeCadastrarProduto,
    permiteAtacado,
    permiteEstoque
};