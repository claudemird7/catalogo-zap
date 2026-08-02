"use strict";

const fs = require("node:fs");
const path = require("node:path");

const raizProjeto = path.resolve(
    __dirname,
    ".."
);

const pastasIgnoradas = new Set([
    "node_modules",
    ".git"
]);

const extensoesRemovidas = [
    ".bkp",
    ".bak",
    ".backup",
    ".old",
    ".orig"
];

const nomesRemovidos = new Set([
    "catalogo-zap-auditoria-final.zip",
    "catalogo-zap-v1-auditoria-final.zip"
]);

let totalRemovido = 0;

function deveRemover(nome) {
    const nomeMinusculo =
        nome.toLowerCase();

    if (nomesRemovidos.has(nome)) {
        return true;
    }

    return extensoesRemovidas.some(
        (extensao) =>
            nomeMinusculo.endsWith(extensao)
    );
}

function limparDiretorio(diretorio) {
    const itens = fs.readdirSync(
        diretorio,
        {
            withFileTypes: true
        }
    );

    for (const item of itens) {
        if (
            item.isDirectory() &&
            pastasIgnoradas.has(item.name)
        ) {
            continue;
        }

        const caminhoCompleto = path.join(
            diretorio,
            item.name
        );

        if (item.isDirectory()) {
            limparDiretorio(
                caminhoCompleto
            );

            continue;
        }

        if (!deveRemover(item.name)) {
            continue;
        }

        fs.unlinkSync(caminhoCompleto);
        totalRemovido += 1;

        console.log(
            "Removido:",
            path.relative(
                raizProjeto,
                caminhoCompleto
            )
        );
    }
}

console.log("");
console.log("Limpeza do Catálogo Zap");
console.log("------------------------");

limparDiretorio(raizProjeto);

console.log("");
console.log(
    `${totalRemovido} arquivo(s) removido(s).`
);
