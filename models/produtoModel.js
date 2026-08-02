"use strict";

const banco = require("../database/conexao");

function listarPorLoja(slugLoja = "loja-demo") {
    return banco.prepare(`
        SELECT
            p.id,
            p.nome,
            COALESCE(c.slug, 'sem-categoria') AS categoria,
            p.preco AS precoAntigo,
            COALESCE(
                p.preco_promocional,
                p.preco
            ) AS precoAtual,
            COALESCE(p.imagem, '') AS imagem,
            COALESCE(p.descricao, '') AS descricao,
            COALESCE(
                p.tipo_venda,
                'varejo'
            ) AS tipoVenda,

            CASE
                WHEN COALESCE(
                    p.tipo_venda,
                    'varejo'
                ) = 'atacado'
                THEN 1
                ELSE 0
            END AS atacado,

            CASE
                WHEN p.quantidade_minima IS NULL
                    OR p.quantidade_minima < 1
                THEN 1
                ELSE p.quantidade_minima
            END AS quantidadeMinima

        FROM produtos p

        INNER JOIN lojas l
            ON l.id = p.loja_id

        LEFT JOIN categorias c
            ON c.id = p.categoria_id

        WHERE
            l.slug = ?
            AND l.ativo = 1
            AND p.ativo = 1

        ORDER BY
            p.nome COLLATE NOCASE
    `).all(slugLoja);
}

function listarCategorias(slugLoja = "loja-demo") {
    return banco.prepare(`
        SELECT DISTINCT
            c.id,
            c.nome,
            c.slug

        FROM categorias c

        INNER JOIN lojas l
            ON l.id = c.loja_id

        INNER JOIN produtos p
            ON p.categoria_id = c.id
            AND p.loja_id = l.id
            AND p.ativo = 1

        WHERE
            l.slug = ?
            AND l.ativo = 1

        ORDER BY
            c.nome COLLATE NOCASE
    `).all(slugLoja);
}

function buscarPorId(id, slugLoja = "loja-demo") {
    const produto = banco.prepare(`
        SELECT
            p.id,
            p.nome,
            COALESCE(
                p.descricao,
                ''
            ) AS descricao,
            COALESCE(
                p.imagem,
                ''
            ) AS imagem,
            p.preco AS precoAntigo,
            COALESCE(
                p.preco_promocional,
                p.preco
            ) AS precoAtual,
            COALESCE(
                c.nome,
                'Sem categoria'
            ) AS categoria,
            COALESCE(
                c.slug,
                'sem-categoria'
            ) AS categoriaSlug,

            CASE
                WHEN p.quantidade_minima IS NULL
                    OR p.quantidade_minima < 1
                THEN 1
                ELSE p.quantidade_minima
            END AS quantidadeMinima,

            COALESCE(
                p.tipo_venda,
                'varejo'
            ) AS tipoVenda,

            CASE
                WHEN COALESCE(
                    p.tipo_venda,
                    'varejo'
                ) = 'atacado'
                THEN 1
                ELSE 0
            END AS atacado,

            COALESCE(
                p.produto_origem_id,
                p.id
            ) AS variacaoProdutoId

        FROM produtos p

        INNER JOIN lojas l
            ON l.id = p.loja_id

        LEFT JOIN categorias c
            ON c.id = p.categoria_id

        WHERE
            p.id = ?
            AND l.slug = ?
            AND l.ativo = 1
            AND p.ativo = 1

        LIMIT 1
    `).get(id, slugLoja);

    if (!produto) {
        return null;
    }

    const produtoFonte = produto.variacaoProdutoId;

    produto.cores = banco.prepare(`
        SELECT
            id,
            nome,
            valor
        FROM produto_cores
        WHERE
            produto_id = ?
            AND ativo = 1
        ORDER BY
            ordem,
            id
    `).all(produtoFonte);

    produto.tamanhos = banco.prepare(`
        SELECT
            id,
            nome
        FROM produto_tamanhos
        WHERE
            produto_id = ?
            AND ativo = 1
        ORDER BY
            ordem,
            id
    `).all(produtoFonte);

    produto.variacoes = banco.prepare(`
        SELECT
            pv.id,
            pv.estoque,
            COALESCE(
                pc.nome,
                ''
            ) AS cor,
            COALESCE(
                pt.nome,
                ''
            ) AS tamanho

        FROM produto_variacoes pv

        LEFT JOIN produto_cores pc
            ON pc.id = pv.cor_id

        LEFT JOIN produto_tamanhos pt
            ON pt.id = pv.tamanho_id

        WHERE
            pv.produto_id = ?
            AND pv.ativo = 1

        ORDER BY
            pc.ordem,
            pt.ordem,
            pv.id
    `).all(produtoFonte);

    produto.imagens = produto.imagem
        ? [produto.imagem]
        : [];

    produto.referencia = String(produto.id)
        .padStart(4, "0");

    return produto;
}

module.exports = {
    listarPorLoja,
    listarCategorias,
    buscarPorId
};