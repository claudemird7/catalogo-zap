"use strict";

const banco = require("./conexao");

function adicionarColunaSeNaoExistir(tabela, coluna, definicao) {
    const colunas = banco.prepare(`PRAGMA table_info(${tabela})`).all();

    if (!colunas.some((item) => item.name === coluna)) {
        banco.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
    }
}

function executarMigracoes() {
    banco.exec(`
        CREATE TABLE IF NOT EXISTS planos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            limite_produtos INTEGER NOT NULL DEFAULT 30,
            permite_atacado INTEGER NOT NULL DEFAULT 0,
            permite_estoque INTEGER NOT NULL DEFAULT 1,
            valor_mensal REAL NOT NULL DEFAULT 0,
            ativo INTEGER NOT NULL DEFAULT 1,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assinaturas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            loja_id INTEGER NOT NULL UNIQUE,
            plano_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'ativa',
            vencimento DATE,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE CASCADE,
            FOREIGN KEY (plano_id) REFERENCES planos(id)
        );
    `);

    const totalPlanos = Number(
        banco.prepare("SELECT COUNT(*) AS total FROM planos").get()?.total || 0
    );

    if (totalPlanos === 0) {
        banco.exec(`
            INSERT INTO planos
                (nome, limite_produtos, permite_atacado, permite_estoque, valor_mensal)
            VALUES
                ('Grátis', 30, 0, 1, 0),
                ('Básico', 300, 1, 1, 39.90),
                ('Premium', 0, 1, 1, 79.90);
        `);
    }

    adicionarColunaSeNaoExistir("lojas", "slug", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "responsavel", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "email", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "status", "TEXT NOT NULL DEFAULT 'ativa'");
    adicionarColunaSeNaoExistir("lojas", "plano_id", "INTEGER");
    adicionarColunaSeNaoExistir("lojas", "logo", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "banner", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "favicon", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "slogan", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "descricao", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "cor_primaria", "TEXT DEFAULT '#0d6efd'");
    adicionarColunaSeNaoExistir("lojas", "cor_secundaria", "TEXT DEFAULT '#212529'");
    adicionarColunaSeNaoExistir("lojas", "mensagem_boas_vindas", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "texto_rodape", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "instagram", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "facebook", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "tiktok", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "site", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "endereco", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "horario_atendimento", "TEXT");
    adicionarColunaSeNaoExistir("lojas", "ano_fundacao", "INTEGER");

    const lojasSemSlug = banco.prepare(`
        SELECT id, nome
        FROM lojas
        WHERE slug IS NULL OR TRIM(slug) = ''
        ORDER BY id
    `).all();

    const gerarSlug = (texto) => String(texto || "loja")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "loja";

    const buscarSlug = banco.prepare(
        "SELECT id FROM lojas WHERE slug = ? AND id <> ?"
    );
    const atualizarSlug = banco.prepare(
        "UPDATE lojas SET slug = ? WHERE id = ?"
    );

    for (const loja of lojasSemSlug) {
        const base = gerarSlug(loja.nome);
        let slug = base;
        let sufixo = 2;

        while (buscarSlug.get(slug, loja.id)) {
            slug = `${base}-${sufixo}`;
            sufixo += 1;
        }

        atualizarSlug.run(slug, loja.id);
    }

    banco.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_lojas_slug_unico
        ON lojas(slug);

        CREATE TABLE IF NOT EXISTS produto_cores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            valor TEXT NOT NULL DEFAULT '#808080',
            ordem INTEGER NOT NULL DEFAULT 0,
            ativo INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS produto_tamanhos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            ordem INTEGER NOT NULL DEFAULT 0,
            ativo INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS produto_variacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            cor_id INTEGER,
            tamanho_id INTEGER,
            preco REAL,
            ativo INTEGER NOT NULL DEFAULT 1,
            estoque INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
            FOREIGN KEY (cor_id) REFERENCES produto_cores(id) ON DELETE CASCADE,
            FOREIGN KEY (tamanho_id) REFERENCES produto_tamanhos(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_produto_cores_produto
        ON produto_cores(produto_id);

        CREATE INDEX IF NOT EXISTS idx_produto_tamanhos_produto
        ON produto_tamanhos(produto_id);

        CREATE INDEX IF NOT EXISTS idx_produto_variacoes_produto
        ON produto_variacoes(produto_id);
    `);

    adicionarColunaSeNaoExistir("produtos", "quantidade_minima", "INTEGER NOT NULL DEFAULT 1");
    adicionarColunaSeNaoExistir("produto_variacoes", "estoque", "INTEGER NOT NULL DEFAULT 0");
    adicionarColunaSeNaoExistir("produtos", "possui_atacado", "INTEGER NOT NULL DEFAULT 0");
    adicionarColunaSeNaoExistir("produtos", "preco_atacado", "REAL");
    adicionarColunaSeNaoExistir("produtos", "quantidade_minima_atacado", "INTEGER");
    adicionarColunaSeNaoExistir("produtos", "tipo_venda", "TEXT NOT NULL DEFAULT 'varejo'");
    adicionarColunaSeNaoExistir("produtos", "produto_origem_id", "INTEGER");
    adicionarColunaSeNaoExistir("produtos", "modo_venda", "TEXT NOT NULL DEFAULT 'varejo'");
    adicionarColunaSeNaoExistir("usuarios", "ultimo_acesso", "DATETIME");

    banco.exec(`
        CREATE TABLE IF NOT EXISTS auditoria_admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            loja_id INTEGER,
            acao TEXT NOT NULL,
            detalhes TEXT,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
            FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_auditoria_admin_loja
        ON auditoria_admin(loja_id);

        CREATE INDEX IF NOT EXISTS idx_auditoria_admin_data
        ON auditoria_admin(criado_em);

        UPDATE lojas
        SET status = 'ativa'
        WHERE status IS NULL OR TRIM(status) = '';

        UPDATE lojas
        SET cor_primaria = '#0d6efd'
        WHERE cor_primaria IS NULL OR TRIM(cor_primaria) = '';

        UPDATE lojas
        SET cor_secundaria = '#212529'
        WHERE cor_secundaria IS NULL OR TRIM(cor_secundaria) = '';

        UPDATE produtos
        SET quantidade_minima = 1
        WHERE quantidade_minima IS NULL OR quantidade_minima < 1;

        UPDATE produtos
        SET possui_atacado = 0
        WHERE possui_atacado IS NULL;

        UPDATE produtos
        SET tipo_venda = 'varejo'
        WHERE tipo_venda IS NULL OR tipo_venda = '';

        UPDATE produtos
        SET modo_venda = CASE
            WHEN possui_atacado = 1 THEN 'varejo_atacado'
            ELSE 'varejo'
        END
        WHERE modo_venda IS NULL OR modo_venda = '';

        UPDATE produtos
        SET modo_venda = 'varejo_atacado'
        WHERE tipo_venda = 'varejo'
          AND possui_atacado = 1
          AND modo_venda = 'varejo';

        UPDATE produto_variacoes
        SET estoque = 0
        WHERE estoque IS NULL OR estoque < 0;

        CREATE INDEX IF NOT EXISTS idx_produtos_origem
        ON produtos(produto_origem_id);

        CREATE INDEX IF NOT EXISTS idx_produtos_tipo_venda
        ON produtos(tipo_venda);
    `);

    const planoPadrao = banco.prepare(`
        SELECT id
        FROM planos
        WHERE ativo = 1
        ORDER BY valor_mensal ASC, id ASC
        LIMIT 1
    `).get();

    if (planoPadrao) {
        banco.prepare(`
            UPDATE lojas
            SET plano_id = ?
            WHERE plano_id IS NULL
        `).run(planoPadrao.id);

        banco.prepare(`
            INSERT INTO assinaturas (loja_id, plano_id, status, vencimento)
            SELECT l.id, COALESCE(l.plano_id, ?), 'ativa', NULL
            FROM lojas l
            WHERE NOT EXISTS (
                SELECT 1 FROM assinaturas a WHERE a.loja_id = l.id
            )
        `).run(planoPadrao.id);
    }
}

module.exports = { executarMigracoes };
