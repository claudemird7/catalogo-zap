"use strict";

const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");
const { Jimp } = require("jimp");

const pastaUploads = path.join(
    __dirname,
    "..",
    "public",
    "uploads",
    "lojas"
);

fs.mkdirSync(pastaUploads, {
    recursive: true
});

const configuracoesImagem = {
    logo: {
        largura: 512,
        altura: 512,
        ajuste: "contain",
        extensao: ".png",
        mime: "image/png"
    },
    banner: {
        largura: 1600,
        altura: 600,
        ajuste: "cover",
        extensao: ".jpg",
        mime: "image/jpeg"
    },
    favicon: {
        largura: 512,
        altura: 512,
        ajuste: "contain",
        extensao: ".png",
        mime: "image/png"
    }
};

const tiposPermitidos = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/x-ms-bmp",
    "image/tiff"
]);

const receberArquivos = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 8 * 1024 * 1024,
        files: 3
    },
    fileFilter(req, file, callback) {
        if (!tiposPermitidos.has(file.mimetype)) {
            return callback(
                new Error(
                    "Envie uma imagem JPG, PNG, GIF, BMP ou TIFF."
                )
            );
        }

        return callback(null, true);
    }
}).fields([
    {
        name: "logo",
        maxCount: 1
    },
    {
        name: "banner",
        maxCount: 1
    },
    {
        name: "favicon",
        maxCount: 1
    }
]);

function gerarNomeArquivo(req, campo, extensao) {
    const lojaId = Number(
        req.session?.usuario?.lojaId || 0
    );

    const identificador = [
        `loja-${lojaId || "sem-id"}`,
        campo,
        Date.now(),
        Math.round(Math.random() * 1e9)
    ].join("-");

    return `${identificador}${extensao}`;
}

async function criarImagemQuadrada(imagem, largura, altura) {
    imagem.scaleToFit({
        w: largura,
        h: altura
    });

    const canvas = new Jimp({
        width: largura,
        height: altura,
        color: 0x00000000
    });

    const posicaoX = Math.floor(
        (largura - imagem.bitmap.width) / 2
    );

    const posicaoY = Math.floor(
        (altura - imagem.bitmap.height) / 2
    );

    canvas.composite(
        imagem,
        posicaoX,
        posicaoY
    );

    return canvas.getBuffer(
        "image/png",
        {
            compressionLevel: 9
        }
    );
}

async function criarBanner(imagem, largura, altura) {
    imagem.cover({
        w: largura,
        h: altura
    });

    const canvas = new Jimp({
        width: largura,
        height: altura,
        color: 0xffffffff
    });

    canvas.composite(imagem, 0, 0);

    return canvas.getBuffer(
        "image/jpeg",
        {
            quality: 84
        }
    );
}

async function processarArquivo(req, arquivo) {
    const configuracao = configuracoesImagem[
        arquivo.fieldname
    ];

    if (!configuracao) {
        throw new Error(
            "O tipo de imagem enviado não é permitido."
        );
    }

    let imagem;

    try {
        imagem = await Jimp.fromBuffer(
            arquivo.buffer
        );
    } catch (erro) {
        throw new Error(
            `Não foi possível ler a imagem de ${arquivo.fieldname}. ` +
            "Escolha outro arquivo."
        );
    }

    if (
        !imagem.bitmap?.width ||
        !imagem.bitmap?.height
    ) {
        throw new Error(
            `A imagem de ${arquivo.fieldname} é inválida.`
        );
    }

    const bufferFinal = configuracao.ajuste === "cover"
        ? await criarBanner(
            imagem,
            configuracao.largura,
            configuracao.altura
        )
        : await criarImagemQuadrada(
            imagem,
            configuracao.largura,
            configuracao.altura
        );

    const nomeArquivo = gerarNomeArquivo(
        req,
        arquivo.fieldname,
        configuracao.extensao
    );

    const caminhoArquivo = path.join(
        pastaUploads,
        nomeArquivo
    );

    await fs.promises.writeFile(
        caminhoArquivo,
        bufferFinal
    );

    return {
        fieldname: arquivo.fieldname,
        originalname: arquivo.originalname,
        encoding: arquivo.encoding,
        mimetype: configuracao.mime,
        destination: pastaUploads,
        filename: nomeArquivo,
        path: caminhoArquivo,
        size: bufferFinal.length
    };
}

async function apagarArquivosGerados(caminhos) {
    await Promise.all(
        caminhos.map(async (caminho) => {
            try {
                await fs.promises.unlink(caminho);
            } catch (erro) {
                if (erro.code !== "ENOENT") {
                    console.error(
                        "Erro ao apagar imagem processada:",
                        erro
                    );
                }
            }
        })
    );
}

async function processarArquivosRecebidos(req) {
    const arquivosProcessados = {};
    const caminhosGerados = [];

    try {
        for (const campo of Object.keys(configuracoesImagem)) {
            const arquivo = req.files?.[campo]?.[0];

            if (!arquivo) {
                continue;
            }

            const processado = await processarArquivo(
                req,
                arquivo
            );

            arquivosProcessados[campo] = [
                processado
            ];

            caminhosGerados.push(
                processado.path
            );
        }

        req.files = arquivosProcessados;
    } catch (erro) {
        await apagarArquivosGerados(
            caminhosGerados
        );

        req.files = {};
        throw erro;
    }
}

function tratarErroUpload(erro) {
    if (erro instanceof multer.MulterError) {
        if (erro.code === "LIMIT_FILE_SIZE") {
            return new Error(
                "Cada imagem pode ter no máximo 8 MB."
            );
        }

        if (erro.code === "LIMIT_FILE_COUNT") {
            return new Error(
                "Envie no máximo uma logo, um banner e um favicon."
            );
        }

        if (erro.code === "LIMIT_UNEXPECTED_FILE") {
            return new Error(
                "Foi enviado um campo de imagem não permitido."
            );
        }
    }

    return erro;
}

function uploadLoja(req, res, callback) {
    receberArquivos(req, res, (erroUpload) => {
        if (erroUpload) {
            return callback(
                tratarErroUpload(erroUpload)
            );
        }

        return processarArquivosRecebidos(req)
            .then(() => callback())
            .catch((erroProcessamento) => {
                callback(
                    tratarErroUpload(
                        erroProcessamento
                    )
                );
            });
    });
}

module.exports = uploadLoja;
