"use strict";

const banco = require("../database/conexao");

function obterResumo(lojaId) {
    const filtroLoja = lojaId ? "WHERE loja_id = ?" : "";
    const parametros = lojaId ? [lojaId] : [];

    const produtos = banco.prepare(`
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) AS ativos,
            SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) AS inativos
        FROM produtos
        ${filtroLoja}
    `).get(...parametros);

    const categorias = banco.prepare(`
        SELECT COUNT(*) AS total
        FROM categorias
        ${filtroLoja}
    `).get(...parametros);

    return {
        produtos: Number(produtos?.total || 0),
        ativos: Number(produtos?.ativos || 0),
        inativos: Number(produtos?.inativos || 0),
        categorias: Number(categorias?.total || 0)
    };
}

function obterIndicadores(lojaId) {
    const condicaoLoja = lojaId ? "AND p.loja_id = ?" : "";
    const parametros = lojaId ? [lojaId] : [];

    const resultado = banco.prepare(`
        SELECT
            SUM(
                CASE
                    WHEN p.ativo = 1
                     AND p.preco_promocional IS NOT NULL
                     AND p.preco_promocional < p.preco
                    THEN 1 ELSE 0
                END
            ) AS promocao,
            SUM(
                CASE
                    WHEN p.ativo = 1
                     AND COALESCE(p.possui_atacado, 0) = 1
                    THEN 1 ELSE 0
                END
            ) AS atacado,
            SUM(
                CASE
                    WHEN p.ativo = 1
                     AND NOT EXISTS (
                        SELECT 1
                        FROM produto_variacoes pv
                        WHERE pv.produto_id = COALESCE(p.produto_origem_id, p.id)
                          AND pv.ativo = 1
                          AND COALESCE(pv.estoque, 0) > 0
                     )
                    THEN 1 ELSE 0
                END
            ) AS semEstoque
        FROM produtos p
        WHERE 1 = 1
        ${condicaoLoja}
    `).get(...parametros);

    return {
        semEstoque: Number(resultado?.semEstoque || 0),
        promocao: Number(resultado?.promocao || 0),
        atacado: Number(resultado?.atacado || 0)
    };
}

module.exports = {
    obterResumo,
    obterIndicadores
};
