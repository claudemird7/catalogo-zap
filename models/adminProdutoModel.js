"use strict";

const banco = require("../database/conexao");

function montarFiltros(lojaId, filtros = {}) {
    const condicoes = ["p.loja_id = ?", "COALESCE(p.tipo_venda, 'varejo') = 'varejo'"];
    const argumentos = [lojaId];
    if (filtros.busca) {
        condicoes.push("(p.nome LIKE ? OR p.descricao LIKE ?)");
        argumentos.push(`%${filtros.busca}%`, `%${filtros.busca}%`);
    }
    if (filtros.categoriaId) { condicoes.push("p.categoria_id = ?"); argumentos.push(filtros.categoriaId); }
    if (filtros.status === "ativo") condicoes.push("p.ativo = 1");
    if (filtros.status === "inativo") condicoes.push("p.ativo = 0");
    return { where: condicoes.join(" AND "), argumentos };
}

function listar(lojaId, filtros = {}) {
    const pagina = Math.max(1, Number.parseInt(filtros.pagina, 10) || 1);
    const porPagina = 10;
    const consulta = montarFiltros(lojaId, filtros);
    const total = banco.prepare(`SELECT COUNT(*) AS total FROM produtos p WHERE ${consulta.where}`).get(...consulta.argumentos).total;
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const produtos = banco.prepare(`
        SELECT p.*, c.nome AS categoria_nome,
            (SELECT COUNT(*) FROM produto_cores pc WHERE pc.produto_id = p.id AND pc.ativo = 1) AS total_cores,
            (SELECT COUNT(*) FROM produto_tamanhos pt WHERE pt.produto_id = p.id AND pt.ativo = 1) AS total_tamanhos,
            (SELECT COALESCE(SUM(pv.estoque),0) FROM produto_variacoes pv WHERE pv.produto_id = p.id AND pv.ativo = 1) AS estoque_total
        FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE ${consulta.where}
        ORDER BY p.nome COLLATE NOCASE LIMIT ? OFFSET ?
    `).all(...consulta.argumentos, porPagina, (paginaAtual - 1) * porPagina);
    return { produtos, paginacao: { total, paginaAtual, totalPaginas, porPagina } };
}

function listarCategorias(lojaId) {
    return banco.prepare("SELECT id, nome FROM categorias WHERE loja_id = ? ORDER BY ordem, nome COLLATE NOCASE").all(lojaId);
}

function buscarPorId(id, lojaId) {
    const produto = banco.prepare("SELECT * FROM produtos WHERE id = ? AND loja_id = ? AND COALESCE(tipo_venda,'varejo')='varejo'").get(id, lojaId);
    if (!produto) return null;
    produto.cores = banco.prepare("SELECT id,nome,valor,ordem FROM produto_cores WHERE produto_id=? AND ativo=1 ORDER BY ordem,id").all(produto.id);
    produto.tamanhos = banco.prepare("SELECT id,nome,ordem FROM produto_tamanhos WHERE produto_id=? AND ativo=1 ORDER BY ordem,id").all(produto.id);
    produto.variacoes = banco.prepare(`
        SELECT pv.id, COALESCE(pc.nome,'') AS cor, COALESCE(pt.nome,'') AS tamanho, pv.estoque
        FROM produto_variacoes pv
        LEFT JOIN produto_cores pc ON pc.id=pv.cor_id
        LEFT JOIN produto_tamanhos pt ON pt.id=pv.tamanho_id
        WHERE pv.produto_id=? AND pv.ativo=1 ORDER BY pc.ordem,pt.ordem,pv.id
    `).all(produto.id);
    return produto;
}

function categoriaPertenceALoja(id, lojaId) {
    return !id || Boolean(banco.prepare("SELECT 1 FROM categorias WHERE id=? AND loja_id=?").get(id, lojaId));
}

function obterCategoriaAtacado(lojaId) {
    let categoria = banco.prepare("SELECT id FROM categorias WHERE loja_id=? AND slug='atacado'").get(lojaId);
    if (!categoria) {
        const ordem = banco.prepare("SELECT COALESCE(MAX(ordem),0)+1 AS ordem FROM categorias WHERE loja_id=?").get(lojaId).ordem;
        const resultado = banco.prepare("INSERT INTO categorias(loja_id,nome,slug,ordem) VALUES(?, 'Atacado', 'atacado', ?)").run(lojaId, ordem);
        categoria = { id: Number(resultado.lastInsertRowid) };
    }
    return categoria.id;
}

function chaveVariacao(cor, tamanho) { return `${String(cor || '').trim()}|${String(tamanho || '').trim()}`; }

function salvarVariacoes(produtoId, cores, tamanhos, estoques = {}) {
    banco.prepare("DELETE FROM produto_variacoes WHERE produto_id=?").run(produtoId);
    banco.prepare("DELETE FROM produto_cores WHERE produto_id=?").run(produtoId);
    banco.prepare("DELETE FROM produto_tamanhos WHERE produto_id=?").run(produtoId);
    const inserirCor = banco.prepare("INSERT INTO produto_cores(produto_id,nome,valor,ordem,ativo) VALUES(?,?,?,?,1)");
    const inserirTam = banco.prepare("INSERT INTO produto_tamanhos(produto_id,nome,ordem,ativo) VALUES(?,?,?,1)");
    const coresSalvas = cores.map((c,i)=>({ id:Number(inserirCor.run(produtoId,c.nome,c.valor,i).lastInsertRowid), nome:c.nome }));
    const tamanhosSalvos = tamanhos.map((t,i)=>({ id:Number(inserirTam.run(produtoId,t.nome,i).lastInsertRowid), nome:t.nome }));
    const inserir = banco.prepare("INSERT INTO produto_variacoes(produto_id,cor_id,tamanho_id,ativo,estoque) VALUES(?,?,?,1,?)");
    const estoque = (c,t) => Math.max(0, Number.parseInt(estoques[chaveVariacao(c,t)],10) || 0);
    if (coresSalvas.length && tamanhosSalvos.length) {
        for (const c of coresSalvas) for (const t of tamanhosSalvos) inserir.run(produtoId,c.id,t.id,estoque(c.nome,t.nome));
    } else if (coresSalvas.length) {
        for (const c of coresSalvas) inserir.run(produtoId,c.id,null,estoque(c.nome,""));
    } else if (tamanhosSalvos.length) {
        for (const t of tamanhosSalvos) inserir.run(produtoId,null,t.id,estoque("",t.nome));
    } else {
        inserir.run(produtoId,null,null,estoque("",""));
    }
}

function sincronizarAtacado(produtoId, lojaId, dados) {
    const filho = banco.prepare("SELECT id FROM produtos WHERE produto_origem_id=? AND loja_id=? AND tipo_venda='atacado'").get(produtoId, lojaId);
    const vendeAtacado = ["varejo_atacado", "atacado"].includes(dados.modoVenda);
    const vendeVarejo = ["varejo", "varejo_atacado"].includes(dados.modoVenda);

    banco.prepare("UPDATE produtos SET ativo=?, modo_venda=?, possui_atacado=? WHERE id=? AND loja_id=?")
        .run(vendeVarejo ? dados.ativo : 0, dados.modoVenda, vendeAtacado ? 1 : 0, produtoId, lojaId);

    if (!vendeAtacado) {
        if (filho) banco.prepare("UPDATE produtos SET ativo=0 WHERE id=?").run(filho.id);
        return;
    }

    const categoriaAtacado = obterCategoriaAtacado(lojaId);
    const nomeAtacado = `${dados.nome} - Atacado`;
    if (filho) {
        banco.prepare(`UPDATE produtos SET categoria_id=?,nome=?,descricao=?,preco=?,preco_promocional=NULL,imagem=?,ativo=?,quantidade_minima=?,tipo_venda='atacado',modo_venda='atacado' WHERE id=?`)
            .run(categoriaAtacado,nomeAtacado,dados.descricao,dados.precoAtacado,dados.imagem,dados.ativo,dados.quantidadeMinimaAtacado,filho.id);
    } else {
        banco.prepare(`INSERT INTO produtos(loja_id,categoria_id,nome,descricao,preco,preco_promocional,imagem,ativo,quantidade_minima,possui_atacado,tipo_venda,produto_origem_id,modo_venda)
            VALUES(?,?,?,?,?,NULL,?,?,?,0,'atacado',?,'atacado')`)
            .run(lojaId,categoriaAtacado,nomeAtacado,dados.descricao,dados.precoAtacado,dados.imagem,dados.ativo,dados.quantidadeMinimaAtacado,produtoId);
    }
}

function criar(lojaId, dados) {
    banco.exec("BEGIN");
    try {
        const r=banco.prepare(`INSERT INTO produtos(loja_id,categoria_id,nome,descricao,preco,preco_promocional,imagem,ativo,quantidade_minima,possui_atacado,preco_atacado,quantidade_minima_atacado,tipo_venda,modo_venda)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'varejo',?)`).run(lojaId,dados.categoriaId,dados.nome,dados.descricao,dados.preco,dados.precoPromocional,dados.imagem,dados.ativo,dados.quantidadeMinima,dados.possuiAtacado,dados.precoAtacado,dados.quantidadeMinimaAtacado,dados.modoVenda);
        const id=Number(r.lastInsertRowid);
        salvarVariacoes(id,dados.cores,dados.tamanhos,dados.estoques);
        sincronizarAtacado(id,lojaId,dados);
        banco.exec("COMMIT"); return id;
    } catch(e){ banco.exec("ROLLBACK"); throw e; }
}

function atualizar(id, lojaId, dados) {
    banco.exec("BEGIN");
    try {
        const ok=banco.prepare(`UPDATE produtos SET categoria_id=?,nome=?,descricao=?,preco=?,preco_promocional=?,imagem=?,ativo=?,quantidade_minima=?,possui_atacado=?,preco_atacado=?,quantidade_minima_atacado=?,modo_venda=? WHERE id=? AND loja_id=? AND COALESCE(tipo_venda,'varejo')='varejo'`)
            .run(dados.categoriaId,dados.nome,dados.descricao,dados.preco,dados.precoPromocional,dados.imagem,dados.ativo,dados.quantidadeMinima,dados.possuiAtacado,dados.precoAtacado,dados.quantidadeMinimaAtacado,dados.modoVenda,id,lojaId).changes>0;
        if(!ok) throw new Error("Produto não encontrado.");
        salvarVariacoes(id,dados.cores,dados.tamanhos,dados.estoques);
        sincronizarAtacado(id,lojaId,dados);
        banco.exec("COMMIT"); return true;
    } catch(e){ banco.exec("ROLLBACK"); throw e; }
}

function excluir(id, lojaId) {
    banco.exec("BEGIN");
    try {
        banco.prepare("DELETE FROM produtos WHERE produto_origem_id=? AND loja_id=?").run(id,lojaId);
        const ok=banco.prepare("DELETE FROM produtos WHERE id=? AND loja_id=? AND COALESCE(tipo_venda,'varejo')='varejo'").run(id,lojaId).changes>0;
        banco.exec("COMMIT"); return ok;
    } catch(e){ banco.exec("ROLLBACK"); throw e; }
}

module.exports={listar,listarCategorias,buscarPorId,categoriaPertenceALoja,criar,atualizar,excluir};
