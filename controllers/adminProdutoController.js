"use strict";

const fs = require("node:fs");
const path = require("node:path");
const model = require("../models/adminProdutoModel");
const planoModel = require("../models/planoModel");

const texto = (valor) => String(valor ?? "").trim();
const paraLista = (valor) => valor === undefined ? [] : (Array.isArray(valor) ? valor : [valor]);

function numero(valor) {
    const limpo = texto(valor).replace(/\s/g, "");
    if (!limpo) return null;
    return Number(limpo.includes(",")
        ? limpo.replace(/\./g, "").replace(",", ".")
        : limpo);
}

function apagarImagem(imagem) {
    if (!imagem || !imagem.startsWith("/uploads/produtos/")) return;
    fs.unlink(path.join(__dirname, "..", "public", imagem), () => {});
}

function normalizarEstoques(body) {
    const chaves = paraLista(body.estoqueChave);
    const quantidades = paraLista(body.estoqueQuantidade);
    return Object.fromEntries(chaves.map((chave, indice) => [
        texto(chave), Math.max(0, Number.parseInt(quantidades[indice], 10) || 0)
    ]));
}

function normalizarVariacoes(body) {
    const nomesCores = paraLista(body.corNome);
    const valoresCores = paraLista(body.corValor);
    const cores = nomesCores.map((nome, indice) => ({
        nome: texto(nome),
        valor: /^#[0-9a-f]{6}$/i.test(texto(valoresCores[indice]))
            ? texto(valoresCores[indice])
            : "#808080"
    })).filter((cor) => cor.nome);

    const tamanhos = paraLista(body.tamanhoNome)
        .map((nome) => ({ nome: texto(nome) }))
        .filter((tamanho) => tamanho.nome);

    return { cores, tamanhos };
}

function obterDados(req, imagemAtual = null) {
    const variacoes = normalizarVariacoes(req.body);
    return {
        nome: texto(req.body.nome),
        categoriaId: texto(req.body.categoriaId)
            ? Number.parseInt(req.body.categoriaId, 10) : null,
        preco: numero(req.body.preco),
        precoPromocional: numero(req.body.precoPromocional),
        descricao: texto(req.body.descricao) || null,
        imagem: req.file ? `/uploads/produtos/${req.file.filename}` : imagemAtual,
        ativo: req.body.ativo === "1" ? 1 : 0,
        quantidadeMinima: Math.max(1, Number.parseInt(req.body.quantidadeMinima, 10) || 1),
        cores: variacoes.cores,
        tamanhos: variacoes.tamanhos,
        estoques: normalizarEstoques(req.body),
        modoVenda: ["varejo", "varejo_atacado", "atacado"].includes(texto(req.body.modoVenda)) ? texto(req.body.modoVenda) : "varejo",
        possuiAtacado: ["varejo_atacado", "atacado"].includes(texto(req.body.modoVenda)) ? 1 : 0,
        precoAtacado: numero(req.body.precoAtacado),
        quantidadeMinimaAtacado: Math.max(1, Number.parseInt(req.body.quantidadeMinimaAtacado, 10) || 1)
    };
}

function validar(dados, lojaId) {
    const erros = [];
    if (!dados.nome) erros.push("Informe o nome do produto.");
    if (!Number.isFinite(dados.preco) || dados.preco < 0) erros.push("Informe um preço válido.");
    if (dados.precoPromocional !== null &&
        (!Number.isFinite(dados.precoPromocional) || dados.precoPromocional < 0)) {
        erros.push("Informe um preço promocional válido.");
    }
    if (!Number.isInteger(dados.quantidadeMinima) || dados.quantidadeMinima < 1) {
        erros.push("A quantidade mínima deve ser um número inteiro maior ou igual a 1.");
    }
    if (["varejo_atacado", "atacado"].includes(dados.modoVenda)) {
        if (!Number.isFinite(dados.precoAtacado) || dados.precoAtacado < 0) {
            erros.push("Informe um preço de atacado válido.");
        }
        if (!Number.isInteger(dados.quantidadeMinimaAtacado) || dados.quantidadeMinimaAtacado < 2) {
            erros.push("A quantidade mínima do atacado deve ser pelo menos 2.");
        }
    }
    if (!model.categoriaPertenceALoja(dados.categoriaId, lojaId)) {
        erros.push("A categoria escolhida é inválida.");
    }
    return erros;
}

function listar(req, res) {
    const usuario = req.session.usuario;
    const filtros = {
        busca: texto(req.query.busca), categoriaId: texto(req.query.categoriaId),
        status: texto(req.query.status), pagina: req.query.pagina
    };
    const resultado = model.listar(usuario.lojaId, filtros);
    res.render("admin/produtos/lista", {
        titulo: "Produtos", paginaAtual: "produtos", usuario, filtros,
        categorias: model.listarCategorias(usuario.lojaId),
        produtos: resultado.produtos, paginacao: resultado.paginacao,
        mensagem: texto(req.query.mensagem), erro: texto(req.query.erro)
    });
}

function renderizarFormulario(req, res, { produto, erros = [], modo, status = 200 }) {
    const usuario = req.session.usuario;
    produto.cores = Array.isArray(produto.cores) ? produto.cores : [];
    produto.tamanhos = Array.isArray(produto.tamanhos) ? produto.tamanhos : [];
    produto.variacoes = Array.isArray(produto.variacoes) ? produto.variacoes : [];
    res.status(status).render("admin/produtos/formulario", {
        titulo: modo === "novo" ? "Novo produto" : "Editar produto",
        paginaAtual: "produtos", usuario,
        categorias: model.listarCategorias(usuario.lojaId), produto, erros,
        acao: modo === "novo" ? "/admin/produtos" : `/admin/produtos/${produto.id}`,
        modo
    });
}

function exibirNovo(req, res) {
    renderizarFormulario(req, res, { produto: { ativo: 1, quantidade_minima: 1, possui_atacado: 0, modo_venda: "varejo", quantidade_minima_atacado: 10, cores: [], tamanhos: [], variacoes: [] }, modo: "novo" });
}

function criar(req, res) {

    const permissao = planoModel.podeCadastrarProduto(
        req.session.usuario.lojaId
    );

    if (!permissao.permitido) {

        if (req.file) {
            apagarImagem(
                `/uploads/produtos/${req.file.filename}`
            );
        }

        return res.redirect(
            "/admin/produtos?erro=" +
            encodeURIComponent(permissao.motivo)
        );
    }

    const dados = obterDados(req);
    const erros = validar(dados, req.session.usuario.lojaId);
    if (erros.length) {
        if (req.file) apagarImagem(dados.imagem);
        return renderizarFormulario(req, res, { produto: dados, erros, modo: "novo", status: 400 });
    }
    model.criar(req.session.usuario.lojaId, dados);
    res.redirect("/admin/produtos?mensagem=" + encodeURIComponent("Produto cadastrado com sucesso."));
}

function exibirEditar(req, res) {
    const produto = model.buscarPorId(req.params.id, req.session.usuario.lojaId);
    if (!produto) return res.status(404).send("Produto não encontrado.");
    renderizarFormulario(req, res, { produto, modo: "editar" });
}

function atualizar(req, res) {
    const atual = model.buscarPorId(req.params.id, req.session.usuario.lojaId);
    if (!atual) {
        if (req.file) apagarImagem(`/uploads/produtos/${req.file.filename}`);
        return res.status(404).send("Produto não encontrado.");
    }
    const dados = obterDados(req, atual.imagem);
    dados.id = atual.id;
    const erros = validar(dados, req.session.usuario.lojaId);
    if (erros.length) {
        if (req.file) apagarImagem(dados.imagem);
        dados.imagem = atual.imagem;
        return renderizarFormulario(req, res, { produto: dados, erros, modo: "editar", status: 400 });
    }
    model.atualizar(atual.id, req.session.usuario.lojaId, dados);
    if (req.file) apagarImagem(atual.imagem);
    res.redirect("/admin/produtos?mensagem=" + encodeURIComponent("Produto atualizado com sucesso."));
}

function excluir(req, res) {
    const produto = model.buscarPorId(req.params.id, req.session.usuario.lojaId);
    if (!produto) return res.redirect("/admin/produtos?erro=" + encodeURIComponent("Produto não encontrado."));
    model.excluir(produto.id, req.session.usuario.lojaId);
    apagarImagem(produto.imagem);
    res.redirect("/admin/produtos?mensagem=" + encodeURIComponent("Produto excluído com sucesso."));
}

module.exports = { listar, exibirNovo, criar, exibirEditar, atualizar, excluir };