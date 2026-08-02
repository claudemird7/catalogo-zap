"use strict";

const express = require("express");

const controller = require(
    "../controllers/adminProdutoController"
);

const upload = require(
    "../middlewares/uploadProduto"
);

const {
    exigirLogin
} = require(
    "../middlewares/autenticacao"
);

const router = express.Router();

router.use(exigirLogin);

function imagem(req, res, next) {
    upload.single("imagem")(
        req,
        res,
        (erro) => {
            if (erro) {
                return res.redirect(
                    "/admin/produtos?erro=" +
                    encodeURIComponent(
                        erro.message ||
                        "Erro no envio da imagem."
                    )
                );
            }

            return next();
        }
    );
}

router.get(
    "/",
    controller.listar
);

router.get(
    "/novo",
    controller.exibirNovo
);

router.post(
    "/",
    imagem,
    controller.criar
);

router.get(
    "/:id/editar",
    controller.exibirEditar
);

router.post(
    "/:id",
    imagem,
    controller.atualizar
);

router.post(
    "/:id/excluir",
    controller.excluir
);

module.exports = router;