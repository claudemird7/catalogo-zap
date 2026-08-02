"use strict";

const fs = require("node:fs");
const path = require("node:path");

const dashboardModel = require("../models/dashboardModel");
const lojaModel = require("../models/lojaModel");

function texto(valor, limite = 500) {
    return String(valor || "")
        .trim()
        .slice(0, limite);
}

function validarCor(valor, corPadrao) {
    const cor = texto(valor, 7);

    if (/^#[0-9a-fA-F]{6}$/.test(cor)) {
        return cor;
    }

    return corPadrao;
}

function validarAno(valor) {
    const ano = Number.parseInt(valor, 10);
    const anoAtual = new Date().getFullYear();

    if (
        Number.isInteger(ano) &&
        ano >= 1800 &&
        ano <= anoAtual
    ) {
        return ano;
    }

    return null;
}

function apagarImagemLoja(imagem) {
    if (!imagem || !imagem.startsWith("/uploads/lojas/")) {
        return;
    }

    const caminho = path.join(
        __dirname,
        "..",
        "public",
        imagem
    );

    fs.unlink(caminho, (erro) => {
        if (erro && erro.code !== "ENOENT") {
            console.error(
                "Erro ao apagar imagem da loja:",
                erro
            );
        }
    });
}

function apagarArquivosNovos(req) {
    const arquivos = [
        req.files?.logo?.[0],
        req.files?.banner?.[0],
        req.files?.favicon?.[0]
    ].filter(Boolean);

    arquivos.forEach((arquivo) => {
        apagarImagemLoja(
            `/uploads/lojas/${arquivo.filename}`
        );
    });
}

function obterLojaId(req) {
    return Number(
        req.session?.usuario?.lojaId || 0
    );
}

function dashboard(req, res) {
    const usuario = req.session.usuario;

    const resumo = dashboardModel.obterResumo(
        usuario.lojaId
    );

    const indicadores = dashboardModel.obterIndicadores(
        usuario.lojaId
    );

    return res.render("admin/dashboard", {
        titulo: "Dashboard",
        paginaAtual: "dashboard",
        usuario,
        resumo,
        indicadores
    });
}

function exibirConfiguracoes(req, res) {
    const usuario = req.session.usuario;
    const lojaId = obterLojaId(req);

    if (!lojaId) {
        return res.status(403).send(
            "Não foi possível identificar a loja deste usuário."
        );
    }

    const loja = lojaModel.buscarPorId(lojaId);

    if (!loja) {
        return res.status(404).send(
            "Loja não encontrada."
        );
    }

    return res.render("admin/configuracoes", {
        titulo: "Configurações da Loja",
        paginaAtual: "configuracoes",
        usuario,
        loja,
        sucesso:
            req.query.sucesso === "1"
                ? "Configurações atualizadas com sucesso."
                : null,
        erro: texto(req.query.erro, 500) || null
    });
}

function salvarConfiguracoes(req, res) {
    const usuario = req.session.usuario;
    const lojaId = obterLojaId(req);

    if (!lojaId) {
        apagarArquivosNovos(req);

        return res.status(403).send(
            "Não foi possível identificar a loja deste usuário."
        );
    }

    const lojaAtual = lojaModel.buscarPorId(lojaId);

    if (!lojaAtual) {
        apagarArquivosNovos(req);

        return res.status(404).send(
            "Loja não encontrada."
        );
    }

    const nome = texto(req.body.nome, 120);

    if (!nome) {
        apagarArquivosNovos(req);

        return res.status(400).render(
            "admin/configuracoes",
            {
                titulo: "Configurações da Loja",
                paginaAtual: "configuracoes",
                usuario,
                loja: {
                    ...lojaAtual,
                    ...req.body
                },
                sucesso: null,
                erro: "Informe o nome da loja."
            }
        );
    }

    const removerBanner =
        req.body.remover_banner === "1";

    const novaLogo = req.files?.logo?.[0]
        ? `/uploads/lojas/${req.files.logo[0].filename}`
        : null;

    const novoBanner = req.files?.banner?.[0]
        ? `/uploads/lojas/${req.files.banner[0].filename}`
        : null;

    const novoFavicon = req.files?.favicon?.[0]
        ? `/uploads/lojas/${req.files.favicon[0].filename}`
        : null;

    const dados = {
        nome,

        slogan: texto(
            req.body.slogan,
            180
        ),

        logo:
            novaLogo ||
            texto(
                req.body.logo_atual || lojaAtual.logo,
                500
            ) ||
            null,

        banner: novoBanner
            ? novoBanner
            : removerBanner
                ? null
                : texto(
                    req.body.banner_atual ||
                    lojaAtual.banner,
                    500
                ) || null,

        favicon:
            novoFavicon ||
            texto(
                req.body.favicon_atual ||
                lojaAtual.favicon,
                500
            ) ||
            null,

        cor_primaria: validarCor(
            req.body.cor_primaria,
            "#0d6efd"
        ),

        cor_secundaria: validarCor(
            req.body.cor_secundaria,
            "#212529"
        ),

        mensagem_boas_vindas: texto(
            req.body.mensagem_boas_vindas,
            500
        ),

        texto_rodape: texto(
            req.body.texto_rodape,
            500
        ),

        descricao: texto(
            req.body.descricao,
            3000
        ),

        instagram: texto(
            req.body.instagram,
            255
        ),

        facebook: texto(
            req.body.facebook,
            255
        ),

        tiktok: texto(
            req.body.tiktok,
            255
        ),

        site: texto(
            req.body.site,
            255
        ),

        endereco: texto(
            req.body.endereco,
            500
        ),

        horario_atendimento: texto(
            req.body.horario_atendimento,
            500
        ),

        ano_fundacao: validarAno(
            req.body.ano_fundacao
        )
    };

    try {
        lojaModel.atualizarConfiguracoes(
            lojaId,
            dados
        );

        if (
            novaLogo &&
            lojaAtual.logo &&
            lojaAtual.logo !== novaLogo
        ) {
            apagarImagemLoja(
                lojaAtual.logo
            );
        }

        if (
            novoBanner &&
            lojaAtual.banner &&
            lojaAtual.banner !== novoBanner
        ) {
            apagarImagemLoja(
                lojaAtual.banner
            );
        }

        if (
            removerBanner &&
            !novoBanner &&
            lojaAtual.banner
        ) {
            apagarImagemLoja(
                lojaAtual.banner
            );
        }

        if (
            novoFavicon &&
            lojaAtual.favicon &&
            lojaAtual.favicon !== novoFavicon
        ) {
            apagarImagemLoja(
                lojaAtual.favicon
            );
        }

        req.session.usuario.lojaNome =
            dados.nome;

        return req.session.save((erroSessao) => {
            if (erroSessao) {
                console.error(
                    "Erro ao salvar a sessão:",
                    erroSessao
                );
            }

            return res.redirect(
                "/admin/configuracoes?sucesso=1"
            );
        });
    } catch (erro) {
        apagarArquivosNovos(req);

        console.error(
            "Erro ao atualizar configurações da loja:",
            erro
        );

        return res.status(500).render(
            "admin/configuracoes",
            {
                titulo: "Configurações da Loja",
                paginaAtual: "configuracoes",
                usuario,
                loja: {
                    ...lojaAtual,
                    ...dados
                },
                sucesso: null,
                erro:
                    "Não foi possível salvar as configurações. Tente novamente."
            }
        );
    }
}

module.exports = {
    dashboard,
    exibirConfiguracoes,
    salvarConfiguracoes
};