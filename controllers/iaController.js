"use strict";

function index(req, res) {

    res.render("admin/ia/index", {
        titulo: "Inteligência Artificial",
        paginaAtual: "ia",
        usuario: req.session.usuario
    });

}

function banner(req, res) {

    res.render("admin/ia/banner", {
        titulo: "Criar Banner IA",
        paginaAtual: "ia",
        usuario: req.session.usuario
    });

}

function produto(req, res) {

    res.render("admin/ia/produto", {
        titulo: "Descrição IA",
        paginaAtual: "ia",
        usuario: req.session.usuario
    });

}

function marketing(req, res) {

    res.render("admin/ia/marketing", {
        titulo: "Marketing IA",
        paginaAtual: "ia",
        usuario: req.session.usuario
    });

}

module.exports = {
    index,
    banner,
    produto,
    marketing
};