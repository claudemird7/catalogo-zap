"use strict";

const lojaModel = require("../models/lojaModel");
const produtoModel = require("../models/produtoModel");

function obterLojaOu404(req, res) {
    const slug = String(req.params.slug || "").trim().toLowerCase();
    const loja = lojaModel.buscarPorSlug(slug);

    if (!loja) {
        res.status(404).send("Loja não encontrada ou indisponível.");
        return null;
    }

    return loja;
}

exports.raiz = (req, res) => {
    const slugDaSessao = req.session?.usuario?.lojaSlug;

    if (slugDaSessao) {
        return res.redirect(`/catalogo/${encodeURIComponent(slugDaSessao)}`);
    }

    const loja = lojaModel.buscarPrimeiraAtiva();
    if (!loja) {
        return res.status(404).send("Nenhum catálogo disponível.");
    }

    return res.redirect(`/catalogo/${encodeURIComponent(loja.slug)}`);
};

exports.home = (req, res) => {
    const loja = obterLojaOu404(req, res);
    if (!loja) return;

    const categorias = produtoModel.listarCategorias(loja.slug);

    return res.render("catalogo/index", {
        titulo: loja.nome,
        loja,
        categorias
    });
};

exports.detalhes = (req, res) => {
    const loja = obterLojaOu404(req, res);
    if (!loja) return;

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(404).send("Produto não encontrado.");
    }

    const produto = produtoModel.buscarPorId(id, loja.slug);
    if (!produto) {
        return res.status(404).send("Produto não encontrado nesta loja.");
    }

    return res.render("catalogo/produto", {
        titulo: produto.nome,
        loja,
        produto
    });
};
