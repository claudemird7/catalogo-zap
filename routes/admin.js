"use strict";

const express = require("express");

const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
const uploadLoja = require("../middlewares/uploadLoja");

const {
    exigirLogin,
    impedirLoginDuplicado
} = require("../middlewares/autenticacao");

const router = express.Router();

router.get(
    "/login",
    impedirLoginDuplicado,
    authController.exibirLogin
);

router.post(
    "/login",
    impedirLoginDuplicado,
    authController.entrar
);

router.post(
    "/voltar-premium",
    exigirLogin,
    authController.voltarPremium
);

router.post(
    "/sair",
    exigirLogin,
    authController.sair
);

router.get(
    "/",
    exigirLogin,
    adminController.dashboard
);

router.get(
    "/configuracoes",
    exigirLogin,
    adminController.exibirConfiguracoes
);

function uploadConfiguracoes(req, res, next) {
    uploadLoja(req, res, (erro) => {
        if (erro) {
            return res.redirect(
                "/admin/configuracoes?erro=" +
                encodeURIComponent(
                    erro.message || "Erro ao enviar imagens."
                )
            );
        }

        next();
    });
}

router.post(
    "/configuracoes",
    exigirLogin,
    uploadConfiguracoes,
    adminController.salvarConfiguracoes
);

module.exports = router;