"use strict";

const express = require("express");
const controller = require("../controllers/superAdminController");
const { exigirSuperAdmin } = require("../middlewares/superAdmin");

const router = express.Router();
router.use(exigirSuperAdmin);

router.get("/", controller.dashboard);
router.get("/lojas", controller.lojas);
router.get("/lojas/nova", controller.novaLoja);
router.post("/lojas", controller.criarLoja);
router.get("/lojas/:id", controller.detalhesLoja);
router.get("/lojas/:id/editar", controller.editarLoja);
router.post("/lojas/:id/editar", controller.salvarLoja);
router.post("/lojas/:id/alternar", controller.alternar);
router.get("/lojas/:id/resetar-senha", controller.exibirResetSenha);
router.post("/lojas/:id/resetar-senha", controller.resetarSenha);
router.post("/lojas/:id/entrar", controller.entrarComoLojista);
router.post("/lojas/:id/arquivar", controller.arquivarLoja);
router.get("/planos", controller.planos);
router.post("/planos/:id", controller.salvarPlano);

module.exports = router;
