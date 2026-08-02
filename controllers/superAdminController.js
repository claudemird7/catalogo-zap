"use strict";

const model = require("../models/superAdminModel");

function inteiroPositivo(valor) {
    const numero = Number(valor);
    return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function dashboard(req, res) {
    res.render("premium/dashboard", {
        titulo: "Painel Premium",
        paginaAtual: "dashboard",
        usuario: req.session.usuario,
        resumo: model.resumo(),
        lojasRecentes: model.listarLojas({ limite: 6 }),
        vencimentos: model.listarVencimentos(7),
        atividades: model.listarAuditoria(8),
        mensagem: req.query.mensagem || null
    });
}

function lojas(req, res) {
    const filtros = {
        busca: String(req.query.busca || "").trim(),
        status: String(req.query.status || "").trim(),
        planoId: inteiroPositivo(req.query.planoId),
        pagina: inteiroPositivo(req.query.pagina) || 1,
        porPagina: 10
    };
    const resultado = model.listarLojasPaginadas(filtros);
    res.render("premium/lojas", {
        titulo: "Gerenciar lojas",
        paginaAtual: "lojas",
        usuario: req.session.usuario,
        planos: model.listarPlanos(true),
        filtros,
        ...resultado,
        mensagem: req.query.mensagem || null
    });
}

function novaLoja(req, res) {
    res.render("premium/nova-loja", {
        titulo: "Nova loja",
        paginaAtual: "lojas",
        usuario: req.session.usuario,
        planos: model.listarPlanos(),
        erro: null,
        dados: {}
    });
}

function criarLoja(req, res) {
    const dados = {
        nome: String(req.body.nome || "").trim(),
        responsavel: String(req.body.responsavel || "").trim(),
        email: String(req.body.email || "").trim(),
        senha: String(req.body.senha || ""),
        whatsapp: String(req.body.whatsapp || "").trim(),
        planoId: inteiroPositivo(req.body.planoId),
        vencimento: req.body.vencimento || null
    };

    if (!dados.nome || !dados.responsavel || !dados.email || dados.senha.length < 6 || !dados.planoId) {
        return res.status(400).render("premium/nova-loja", {
            titulo: "Nova loja",
            paginaAtual: "lojas",
            usuario: req.session.usuario,
            planos: model.listarPlanos(),
            erro: "Preencha os campos obrigatórios. A senha deve ter pelo menos 6 caracteres.",
            dados
        });
    }

    try {
        const lojaId = model.criarLoja(dados, req.session.usuario.id);
        return res.redirect(`/premium/lojas/${lojaId}?mensagem=Loja criada com sucesso`);
    } catch (erro) {
        return res.status(400).render("premium/nova-loja", {
            titulo: "Nova loja",
            paginaAtual: "lojas",
            usuario: req.session.usuario,
            planos: model.listarPlanos(),
            erro: erro.message.includes("UNIQUE") ? "Este e-mail já está cadastrado." : "Não foi possível criar a loja.",
            dados
        });
    }
}

function detalhesLoja(req, res) {
    const id = inteiroPositivo(req.params.id);
    const loja = id ? model.buscarLojaDetalhada(id) : null;
    if (!loja) return res.status(404).send("Loja não encontrada.");

    res.render("premium/loja-detalhes", {
        titulo: loja.nome,
        paginaAtual: "lojas",
        usuario: req.session.usuario,
        loja,
        atividades: model.listarAuditoria(10, id),
        mensagem: req.query.mensagem || null
    });
}

function editarLoja(req, res) {
    const id = inteiroPositivo(req.params.id);
    const loja = id ? model.buscarLojaDetalhada(id) : null;
    if (!loja) return res.status(404).send("Loja não encontrada.");

    res.render("premium/loja-editar", {
        titulo: `Editar ${loja.nome}`,
        paginaAtual: "lojas",
        usuario: req.session.usuario,
        planos: model.listarPlanos(true),
        loja,
        erro: null
    });
}

function salvarLoja(req, res) {
    const id = inteiroPositivo(req.params.id);
    const dados = {
        nome: String(req.body.nome || "").trim(),
        slug: String(req.body.slug || "").trim(),
        responsavel: String(req.body.responsavel || "").trim(),
        email: String(req.body.email || "").trim(),
        whatsapp: String(req.body.whatsapp || "").trim(),
        planoId: inteiroPositivo(req.body.planoId),
        vencimento: req.body.vencimento || null,
        statusAssinatura: String(req.body.statusAssinatura || "ativa")
    };

    if (!id || !dados.nome || !dados.slug || !dados.email || !dados.planoId) {
        const loja = { id, ...dados };
        return res.status(400).render("premium/loja-editar", {
            titulo: "Editar loja",
            paginaAtual: "lojas",
            usuario: req.session.usuario,
            planos: model.listarPlanos(true),
            loja,
            erro: "Preencha todos os campos obrigatórios."
        });
    }

    try {
        model.atualizarLoja(id, dados, req.session.usuario.id);
        return res.redirect(`/premium/lojas/${id}?mensagem=Dados atualizados com sucesso`);
    } catch (erro) {
        const loja = { id, ...dados };
        return res.status(400).render("premium/loja-editar", {
            titulo: "Editar loja",
            paginaAtual: "lojas",
            usuario: req.session.usuario,
            planos: model.listarPlanos(true),
            loja,
            erro: erro.message.includes("UNIQUE") ? "O slug ou e-mail já está em uso." : "Não foi possível atualizar a loja."
        });
    }
}

function alternar(req, res) {
    const id = inteiroPositivo(req.params.id);
    if (id) model.alternar(id, req.session.usuario.id);
    res.redirect(req.get("referer") || "/premium/lojas");
}

function exibirResetSenha(req, res) {
    const id = inteiroPositivo(req.params.id);
    const loja = id ? model.buscarLojaDetalhada(id) : null;
    if (!loja) return res.status(404).send("Loja não encontrada.");
    res.render("premium/resetar-senha", {
        titulo: "Redefinir senha",
        paginaAtual: "lojas",
        usuario: req.session.usuario,
        loja,
        erro: null
    });
}

function resetarSenha(req, res) {
    const id = inteiroPositivo(req.params.id);
    const senha = String(req.body.senha || "");
    const confirmar = String(req.body.confirmar || "");
    const loja = id ? model.buscarLojaDetalhada(id) : null;
    if (!loja) return res.status(404).send("Loja não encontrada.");

    if (senha.length < 6 || senha !== confirmar) {
        return res.status(400).render("premium/resetar-senha", {
            titulo: "Redefinir senha",
            paginaAtual: "lojas",
            usuario: req.session.usuario,
            loja,
            erro: "As senhas devem ser iguais e ter pelo menos 6 caracteres."
        });
    }

    model.resetarSenha(id, senha, req.session.usuario.id);
    res.redirect(`/premium/lojas/${id}?mensagem=Senha redefinida com sucesso`);
}

function entrarComoLojista(req, res) {
    const id = inteiroPositivo(req.params.id);
    const lojista = id ? model.buscarUsuarioPrincipal(id) : null;
    if (!lojista || lojista.ativo !== 1) return res.status(400).send("Lojista indisponível.");

    req.session.superAdminOriginal = { ...req.session.usuario };
    req.session.usuario = {
        id: lojista.id,
        lojaId: lojista.loja_id,
        nome: lojista.nome,
        email: lojista.email,
        tipo: "lojista",
        lojaNome: lojista.loja_nome,
        lojaSlug: lojista.loja_slug,
        emSuporte: true
    };
    model.registrarAuditoria(req.session.superAdminOriginal.id, id, "ACESSO_SUPORTE", `Entrou como lojista em ${lojista.loja_nome}`);
    res.redirect("/admin");
}

function arquivarLoja(req, res) {
    const id = inteiroPositivo(req.params.id);
    if (id) model.arquivarLoja(id, req.session.usuario.id);
    res.redirect("/premium/lojas?mensagem=Loja arquivada");
}

function planos(req, res) {
    res.render("premium/planos", {
        titulo: "Planos",
        paginaAtual: "planos",
        usuario: req.session.usuario,
        planos: model.listarPlanos(true),
        mensagem: req.query.mensagem || null
    });
}

function salvarPlano(req, res) {
    const id = inteiroPositivo(req.params.id);
    if (!id) return res.status(400).send("Plano inválido.");
    model.atualizarPlano(id, {
        nome: String(req.body.nome || "").trim(),
        limiteProdutos: Math.max(0, Number(req.body.limiteProdutos || 0)),
        valorMensal: Math.max(0, Number(String(req.body.valorMensal || "0").replace(",", "."))),
        permiteAtacado: req.body.permiteAtacado ? 1 : 0,
        permiteEstoque: req.body.permiteEstoque ? 1 : 0,
        ativo: req.body.ativo ? 1 : 0
    }, req.session.usuario.id);
    res.redirect("/premium/planos?mensagem=Plano atualizado");
}

module.exports = {
    dashboard, lojas, novaLoja, criarLoja, detalhesLoja, editarLoja,
    salvarLoja, alternar, exibirResetSenha, resetarSenha,
    entrarComoLojista, arquivarLoja, planos, salvarPlano
};
