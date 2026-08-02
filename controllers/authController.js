"use strict";

const bcrypt = require("bcryptjs");

const usuarioModel = require("../models/usuarioModel");

function renderizarLogin(
    res,
    {
        status = 200,
        erro = null,
        email = ""
    } = {}
) {
    return res.status(status).render("admin/login", {
        titulo: "Entrar no painel",
        erro,
        email
    });
}

function exibirLogin(req, res) {
    return renderizarLogin(res);
}

function entrar(req, res) {
    const email = String(
        req.body.email || ""
    ).trim();

    const senha = String(
        req.body.senha || ""
    );

    if (!email || !senha) {
        return renderizarLogin(res, {
            status: 400,
            erro: "Informe o e-mail e a senha.",
            email
        });
    }

    const usuario =
        usuarioModel.buscarPorEmail(email);

    if (!usuario) {
        return renderizarLogin(res, {
            status: 401,
            erro: "E-mail ou senha inválidos.",
            email
        });
    }

    if (Number(usuario.ativo) !== 1) {
        return renderizarLogin(res, {
            status: 403,
            erro:
                "Este usuário está desativado. Entre em contato com o administrador.",
            email
        });
    }

    const senhaCorreta = bcrypt.compareSync(
        senha,
        usuario.senha
    );

    if (!senhaCorreta) {
        return renderizarLogin(res, {
            status: 401,
            erro: "E-mail ou senha inválidos.",
            email
        });
    }

    const ehSuperAdmin =
        usuario.tipo === "superadmin";

    if (!ehSuperAdmin) {
        if (!usuario.loja_id) {
            return renderizarLogin(res, {
                status: 403,
                erro:
                    "Este usuário não está vinculado a uma loja.",
                email
            });
        }

        if (Number(usuario.loja_ativa) !== 1) {
            return renderizarLogin(res, {
                status: 403,
                erro:
                    "Esta loja está desativada. Entre em contato com o administrador.",
                email
            });
        }

        const statusLoja = String(
            usuario.loja_status || "ativa"
        ).toLowerCase();

        if (
            statusLoja === "bloqueada" ||
            statusLoja === "suspensa" ||
            statusLoja === "arquivada"
        ) {
            return renderizarLogin(res, {
                status: 403,
                erro:
                    "Esta loja está indisponível. Entre em contato com o administrador.",
                email
            });
        }
    }

    return req.session.regenerate((erro) => {
        if (erro) {
            console.error(
                "Erro ao iniciar sessão:",
                erro
            );

            return renderizarLogin(res, {
                status: 500,
                erro:
                    "Não foi possível iniciar a sessão.",
                email
            });
        }

        try {
            usuarioModel.registrarAcesso(
                usuario.id
            );
        } catch (erroAcesso) {
            console.error(
                "Erro ao registrar acesso:",
                erroAcesso
            );
        }

        req.session.usuario = {
            id: usuario.id,
            lojaId: usuario.loja_id || null,
            nome: usuario.nome,
            email: usuario.email,
            tipo: usuario.tipo,
            lojaNome: usuario.loja_nome || null,
            lojaSlug: usuario.loja_slug || null
        };

        return req.session.save((erroSessao) => {
            if (erroSessao) {
                console.error(
                    "Erro ao salvar sessão:",
                    erroSessao
                );

                return renderizarLogin(res, {
                    status: 500,
                    erro:
                        "Não foi possível concluir o login.",
                    email
                });
            }

            return res.redirect(
                ehSuperAdmin
                    ? "/premium"
                    : "/admin"
            );
        });
    });
}

function voltarPremium(req, res) {
    if (!req.session?.superAdminOriginal) {
        return res.redirect("/admin");
    }

    req.session.usuario = {
        ...req.session.superAdminOriginal
    };

    delete req.session.superAdminOriginal;

    return req.session.save((erro) => {
        if (erro) {
            console.error(
                "Erro ao restaurar sessão do Super Admin:",
                erro
            );
        }

        return res.redirect("/premium");
    });
}

function sair(req, res) {
    if (!req.session) {
        return res.redirect("/admin/login");
    }

    return req.session.destroy((erro) => {
        if (erro) {
            console.error(
                "Erro ao encerrar sessão:",
                erro
            );
        }

        res.clearCookie("catalogo.sid", {
            httpOnly: true,
            sameSite: "lax"
        });

        return res.redirect("/admin/login");
    });
}

module.exports = {
    exibirLogin,
    entrar,
    voltarPremium,
    sair
};