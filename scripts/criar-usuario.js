"use strict";

const bcrypt = require("bcryptjs");
const banco = require("../database/conexao");

const nome = String(process.argv[2] || "").trim();
const email = String(process.argv[3] || "")
    .trim()
    .toLowerCase();
const senha = String(process.argv[4] || "");

if (!nome || !email || !senha) {
    console.error(
        'Uso: node scripts/criar-usuario.js "Nome" "email" "senha"'
    );

    process.exitCode = 1;
} else if (senha.length < 6) {
    console.error(
        "A senha deve possuir pelo menos 6 caracteres."
    );

    process.exitCode = 1;
} else {
    const loja = banco
        .prepare(`
            SELECT id, nome
            FROM lojas
            WHERE ativo = 1
            ORDER BY id
            LIMIT 1
        `)
        .get();

    if (!loja) {
        console.error(
            "Nenhuma loja ativa foi encontrada."
        );

        process.exitCode = 1;
    } else {
        const existente = banco
            .prepare(`
                SELECT id
                FROM usuarios
                WHERE LOWER(email) = LOWER(?)
                LIMIT 1
            `)
            .get(email);

        if (existente) {
            console.error(
                "Já existe um usuário com esse e-mail."
            );

            process.exitCode = 1;
        } else {
            const senhaCriptografada =
                bcrypt.hashSync(senha, 12);

            banco
                .prepare(`
                    INSERT INTO usuarios (
                        loja_id,
                        nome,
                        email,
                        senha,
                        tipo,
                        ativo
                    )
                    VALUES (?, ?, ?, ?, 'lojista', 1)
                `)
                .run(
                    loja.id,
                    nome,
                    email,
                    senhaCriptografada
                );

            console.log("Usuário criado com sucesso.");
            console.log(`Loja: ${loja.nome}`);
            console.log(`E-mail: ${email}`);
        }
    }
}

banco.close();
