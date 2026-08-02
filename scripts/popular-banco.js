"use strict";

const banco = require("../database/conexao");

console.log("Inserindo dados iniciais...");

const inserirLoja = banco.prepare(`
    INSERT OR IGNORE INTO lojas (
        nome,
        slug,
        whatsapp,
        cor_principal,
        cor_whatsapp
    )
    VALUES (?, ?, ?, ?, ?)
`);

inserirLoja.run(
    "Catálogo Zap",
    "loja-demo",
    "5511985699564",
    "#1688f8",
    "#25d366"
);

const loja = banco
    .prepare("SELECT id FROM lojas WHERE slug = ?")
    .get("loja-demo");

if (!loja) {
    throw new Error("A loja não foi encontrada.");
}

const categorias = [
    { nome: "Tênis", slug: "tenis", ordem: 1 },
    { nome: "Camisetas", slug: "camisetas", ordem: 2 },
    { nome: "Blusas", slug: "blusas", ordem: 3 },
    { nome: "Calças", slug: "calcas", ordem: 4 },
    { nome: "Acessórios", slug: "acessorios", ordem: 5 }
];

const inserirCategoria = banco.prepare(`
    INSERT INTO categorias (
        loja_id,
        nome,
        slug,
        ordem
    )
    SELECT ?, ?, ?, ?
    WHERE NOT EXISTS (
        SELECT 1
        FROM categorias
        WHERE loja_id = ? AND slug = ?
    )
`);

for (const categoria of categorias) {
    inserirCategoria.run(
        loja.id,
        categoria.nome,
        categoria.slug,
        categoria.ordem,
        loja.id,
        categoria.slug
    );
}

function buscarCategoriaId(slug) {
    const categoria = banco
        .prepare(`
            SELECT id
            FROM categorias
            WHERE loja_id = ? AND slug = ?
        `)
        .get(loja.id, slug);

    return categoria?.id || null;
}

const produtos = [
    {
        nome: "New Balance Rebel",
        categoria: "tenis",
        preco: 180,
        precoPromocional: 140,
        imagem: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85"
    },
    {
        nome: "Adizero Evo SL",
        categoria: "tenis",
        preco: 180,
        precoPromocional: 150,
        imagem: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=85"
    },
    {
        nome: "Air Force 1",
        categoria: "tenis",
        preco: 120,
        precoPromocional: 65,
        imagem: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?auto=format&fit=crop&w=800&q=85"
    },
    {
        nome: "Prophecy 15",
        categoria: "tenis",
        preco: 120,
        precoPromocional: 75,
        imagem: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=85"
    },
    {
        nome: "Camiseta Essential",
        categoria: "camisetas",
        preco: 89.90,
        precoPromocional: 69.90,
        imagem: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85"
    },
    {
        nome: "Blusa Moletom Casual",
        categoria: "blusas",
        preco: 149.90,
        precoPromocional: 119.90,
        imagem: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=85"
    },
    {
        nome: "Calça Jeans Slim",
        categoria: "calcas",
        preco: 159.90,
        precoPromocional: 129.90,
        imagem: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=85"
    },
    {
        nome: "Boné Street",
        categoria: "acessorios",
        preco: 69.90,
        precoPromocional: 49.90,
        imagem: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=85"
    }
];

const inserirProduto = banco.prepare(`
    INSERT INTO produtos (
        loja_id,
        categoria_id,
        nome,
        preco,
        preco_promocional,
        imagem
    )
    SELECT ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (
        SELECT 1
        FROM produtos
        WHERE loja_id = ? AND nome = ?
    )
`);

for (const produto of produtos) {
    inserirProduto.run(
        loja.id,
        buscarCategoriaId(produto.categoria),
        produto.nome,
        produto.preco,
        produto.precoPromocional,
        produto.imagem,
        loja.id,
        produto.nome
    );
}

console.log("Dados inseridos com sucesso.");

banco.close();
