"use strict";

const express = require("express");
const catalogoController = require("../controllers/catalogoController");

const router = express.Router();

router.get("/", catalogoController.raiz);
router.get("/catalogo/:slug", catalogoController.home);
router.get("/catalogo/:slug/produto/:id", catalogoController.detalhes);

module.exports = router;
