"use strict";

const banco = require("../database/conexao");
const bcrypt = require("bcryptjs");

function registrarAuditoria(usuarioId, lojaId, acao, detalhes = null) {
    banco.prepare(`
        INSERT INTO auditoria_admin (usuario_id, loja_id, acao, detalhes)
        VALUES (?, ?, ?, ?)
    `).run(usuarioId || null, lojaId || null, acao, detalhes);
}

function resumo() {
    const lojas = banco.prepare(`
        SELECT COUNT(*) total,
               SUM(CASE WHEN ativo=1 AND COALESCE(status,'ativa') <> 'arquivada' THEN 1 ELSE 0 END) ativas,
               SUM(CASE WHEN ativo=0 AND COALESCE(status,'ativa') <> 'arquivada' THEN 1 ELSE 0 END) bloqueadas
        FROM lojas WHERE COALESCE(status,'ativa') <> 'arquivada'
    `).get();
    const produtos = banco.prepare("SELECT COUNT(*) total FROM produtos").get();
    const usuarios = banco.prepare("SELECT COUNT(*) total FROM usuarios WHERE tipo='lojista'").get();
    const receita = banco.prepare(`
        SELECT COALESCE(SUM(p.valor_mensal),0) total
        FROM assinaturas a JOIN planos p ON p.id=a.plano_id
        JOIN lojas l ON l.id=a.loja_id
        WHERE a.status='ativa' AND l.ativo=1 AND COALESCE(l.status,'ativa') <> 'arquivada'
    `).get();
    const vencendo = banco.prepare(`
        SELECT COUNT(*) total FROM assinaturas a JOIN lojas l ON l.id=a.loja_id
        WHERE a.status='ativa' AND a.vencimento IS NOT NULL
          AND date(a.vencimento) BETWEEN date('now') AND date('now','+7 days')
          AND COALESCE(l.status,'ativa') <> 'arquivada'
    `).get();
    return {
        clientes: Number(usuarios.total || 0), lojas: Number(lojas.total || 0),
        ativas: Number(lojas.ativas || 0), bloqueadas: Number(lojas.bloqueadas || 0),
        produtos: Number(produtos.total || 0), receita: Number(receita.total || 0),
        vencendo: Number(vencendo.total || 0)
    };
}

const selecaoLojas = `
    SELECT l.*, p.nome plano_nome, p.valor_mensal,
           a.status assinatura_status, a.vencimento,
           CAST(julianday(a.vencimento)-julianday(date('now')) AS INTEGER) dias_restantes,
           (SELECT COUNT(*) FROM produtos pr WHERE pr.loja_id=l.id AND COALESCE(pr.tipo_venda,'varejo')='varejo') total_produtos,
           (SELECT COUNT(*) FROM categorias c WHERE c.loja_id=l.id) total_categorias,
           (SELECT COUNT(*) FROM produto_variacoes pv JOIN produtos pr2 ON pr2.id=pv.produto_id WHERE pr2.loja_id=l.id AND pv.estoque<=0) sem_estoque,
           (SELECT id FROM usuarios u WHERE u.loja_id=l.id AND u.tipo='lojista' ORDER BY u.id LIMIT 1) usuario_id,
           (SELECT nome FROM usuarios u WHERE u.loja_id=l.id AND u.tipo='lojista' ORDER BY u.id LIMIT 1) usuario_nome,
           (SELECT email FROM usuarios u WHERE u.loja_id=l.id AND u.tipo='lojista' ORDER BY u.id LIMIT 1) usuario_email,
           (SELECT ultimo_acesso FROM usuarios u WHERE u.loja_id=l.id AND u.tipo='lojista' ORDER BY u.id LIMIT 1) ultimo_acesso
    FROM lojas l
    LEFT JOIN assinaturas a ON a.loja_id=l.id
    LEFT JOIN planos p ON p.id=COALESCE(a.plano_id,l.plano_id)
`;

function listarLojas({ limite = null } = {}) {
    const sql = `${selecaoLojas} WHERE COALESCE(l.status,'ativa') <> 'arquivada' ORDER BY l.id DESC ${limite ? "LIMIT ?" : ""}`;
    return limite ? banco.prepare(sql).all(limite) : banco.prepare(sql).all();
}

function listarLojasPaginadas(filtros) {
    const condicoes = ["COALESCE(l.status,'ativa') <> 'arquivada'"];
    const params = [];
    if (filtros.busca) {
        condicoes.push("(LOWER(l.nome) LIKE LOWER(?) OR LOWER(COALESCE(l.responsavel,'')) LIKE LOWER(?) OR LOWER(COALESCE(l.email,'')) LIKE LOWER(?))");
        const termo = `%${filtros.busca}%`; params.push(termo, termo, termo);
    }
    if (filtros.status === "ativa") condicoes.push("l.ativo=1");
    if (filtros.status === "bloqueada") condicoes.push("l.ativo=0");
    if (filtros.planoId) { condicoes.push("COALESCE(a.plano_id,l.plano_id)=?"); params.push(filtros.planoId); }

    const where = `WHERE ${condicoes.join(" AND ")}`;
    const total = banco.prepare(`SELECT COUNT(*) total FROM lojas l LEFT JOIN assinaturas a ON a.loja_id=l.id ${where}`).get(...params).total;
    const totalPaginas = Math.max(1, Math.ceil(total / filtros.porPagina));
    const pagina = Math.min(filtros.pagina, totalPaginas);
    const offset = (pagina - 1) * filtros.porPagina;
    const lojas = banco.prepare(`${selecaoLojas} ${where} ORDER BY l.id DESC LIMIT ? OFFSET ?`).all(...params, filtros.porPagina, offset);
    return { lojas, total, pagina, totalPaginas };
}

function listarVencimentos(dias = 7) {
    return banco.prepare(`${selecaoLojas}
        WHERE a.vencimento IS NOT NULL AND date(a.vencimento) <= date('now', ?)
          AND COALESCE(l.status,'ativa') <> 'arquivada'
        ORDER BY date(a.vencimento) ASC LIMIT 8
    `).all(`+${Number(dias)} days`);
}

function buscarLojaDetalhada(id) {
    return banco.prepare(`${selecaoLojas} WHERE l.id=? LIMIT 1`).get(id);
}

function listarPlanos(incluirInativos = false) {
    return banco.prepare(`SELECT * FROM planos ${incluirInativos ? "" : "WHERE ativo=1"} ORDER BY valor_mensal,id`).all();
}

function slugify(valor) {
    return String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function criarLoja(dados, usuarioAdminId) {
    banco.exec("BEGIN");
    try {
        let slug = slugify(dados.nome) || "loja";
        let n = 1; const base = slug;
        while (banco.prepare("SELECT 1 FROM lojas WHERE slug=?").get(slug)) slug = `${base}-${++n}`;
        const resultado = banco.prepare(`
            INSERT INTO lojas(nome,slug,whatsapp,ativo,responsavel,email,status,plano_id)
            VALUES(?,?,?,?,?,?,?,?)
        `).run(dados.nome, slug, dados.whatsapp || null, 1, dados.responsavel || null, dados.email, "ativa", dados.planoId);
        const lojaId = Number(resultado.lastInsertRowid);
        banco.prepare("INSERT INTO usuarios(loja_id,nome,email,senha,tipo,ativo) VALUES(?,?,?,?, 'lojista',1)")
            .run(lojaId, dados.responsavel || dados.nome, dados.email, bcrypt.hashSync(dados.senha, 10));
        banco.prepare("INSERT INTO assinaturas(loja_id,plano_id,status,vencimento) VALUES(?,?, 'ativa',?)")
            .run(lojaId, dados.planoId, dados.vencimento || null);
        registrarAuditoria(usuarioAdminId, lojaId, "LOJA_CRIADA", `Loja ${dados.nome} criada`);
        banco.exec("COMMIT");
        return lojaId;
    } catch (erro) { banco.exec("ROLLBACK"); throw erro; }
}

function atualizarLoja(id, dados, usuarioAdminId) {
    const slug = slugify(dados.slug);
    banco.exec("BEGIN");
    try {
        banco.prepare(`UPDATE lojas SET nome=?,slug=?,responsavel=?,email=?,whatsapp=?,plano_id=? WHERE id=?`)
            .run(dados.nome, slug, dados.responsavel || null, dados.email, dados.whatsapp || null, dados.planoId, id);
        banco.prepare(`UPDATE usuarios SET nome=?,email=? WHERE loja_id=? AND tipo='lojista'`)
            .run(dados.responsavel || dados.nome, dados.email, id);
        banco.prepare(`
            INSERT INTO assinaturas(loja_id,plano_id,status,vencimento) VALUES(?,?,?,?)
            ON CONFLICT(loja_id) DO UPDATE SET plano_id=excluded.plano_id,status=excluded.status,vencimento=excluded.vencimento
        `).run(id, dados.planoId, dados.statusAssinatura, dados.vencimento || null);
        registrarAuditoria(usuarioAdminId, id, "LOJA_EDITADA", `Dados e plano atualizados`);
        banco.exec("COMMIT");
    } catch (erro) { banco.exec("ROLLBACK"); throw erro; }
}

function alternar(id, usuarioAdminId) {
    const loja = banco.prepare("SELECT ativo,nome FROM lojas WHERE id=?").get(id);
    if (!loja) return false;
    const ativo = loja.ativo ? 0 : 1;
    banco.prepare("UPDATE lojas SET ativo=?,status=? WHERE id=?").run(ativo, ativo ? "ativa" : "bloqueada", id);
    banco.prepare("UPDATE usuarios SET ativo=? WHERE loja_id=? AND tipo='lojista'").run(ativo, id);
    registrarAuditoria(usuarioAdminId, id, ativo ? "LOJA_ATIVADA" : "LOJA_BLOQUEADA", loja.nome);
    return true;
}

function resetarSenha(lojaId, senha, usuarioAdminId) {
    banco.prepare("UPDATE usuarios SET senha=? WHERE loja_id=? AND tipo='lojista'").run(bcrypt.hashSync(senha, 10), lojaId);
    registrarAuditoria(usuarioAdminId, lojaId, "SENHA_REDEFINIDA", "Senha do lojista redefinida");
}

function buscarUsuarioPrincipal(lojaId) {
    return banco.prepare(`
        SELECT u.*,l.nome loja_nome,l.slug loja_slug FROM usuarios u
        JOIN lojas l ON l.id=u.loja_id
        WHERE u.loja_id=? AND u.tipo='lojista' ORDER BY u.id LIMIT 1
    `).get(lojaId);
}

function arquivarLoja(id, usuarioAdminId) {
    const loja = banco.prepare("SELECT nome FROM lojas WHERE id=?").get(id);
    if (!loja) return false;
    banco.prepare("UPDATE lojas SET ativo=0,status='arquivada' WHERE id=?").run(id);
    banco.prepare("UPDATE usuarios SET ativo=0 WHERE loja_id=?").run(id);
    registrarAuditoria(usuarioAdminId, id, "LOJA_ARQUIVADA", loja.nome);
    return true;
}

function atualizarPlano(id, dados, usuarioAdminId) {
    banco.prepare(`UPDATE planos SET nome=?,limite_produtos=?,permite_atacado=?,permite_estoque=?,valor_mensal=?,ativo=? WHERE id=?`)
        .run(dados.nome, dados.limiteProdutos, dados.permiteAtacado, dados.permiteEstoque, dados.valorMensal, dados.ativo, id);
    registrarAuditoria(usuarioAdminId, null, "PLANO_EDITADO", `Plano ${dados.nome} atualizado`);
}

function listarAuditoria(limite = 10, lojaId = null) {
    const where = lojaId ? "WHERE a.loja_id=?" : "";
    const params = lojaId ? [lojaId, limite] : [limite];
    return banco.prepare(`
        SELECT a.*,u.nome usuario_nome,l.nome loja_nome
        FROM auditoria_admin a LEFT JOIN usuarios u ON u.id=a.usuario_id LEFT JOIN lojas l ON l.id=a.loja_id
        ${where} ORDER BY a.id DESC LIMIT ?
    `).all(...params);
}

module.exports = {
    resumo, listarLojas, listarLojasPaginadas, listarVencimentos, buscarLojaDetalhada,
    listarPlanos, criarLoja, atualizarLoja, alternar, resetarSenha,
    buscarUsuarioPrincipal, arquivarLoja, atualizarPlano, listarAuditoria, registrarAuditoria
};
