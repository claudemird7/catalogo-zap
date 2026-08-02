"use strict";

const produtoModel = require("../models/produtoModel");

function listar(req, res) {
    try {
        const slugLoja = String(req.query.loja || "loja-demo").trim();
        const produtos = produtoModel.listarPorLoja(slugLoja);
        return res.status(200).json(produtos);
    } catch (erro) {
        console.error("Erro ao listar produtos:", erro);
        return res.status(500).json({
            erro: "Não foi possível carregar os produtos."
        });
    }
}

module.exports = { listar };
