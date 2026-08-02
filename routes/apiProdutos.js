"use strict";

const express = require("express");
const apiProdutoController = require("../controllers/apiProdutoController");

const router = express.Router();

router.get("/", apiProdutoController.listar);

module.exports = router;
