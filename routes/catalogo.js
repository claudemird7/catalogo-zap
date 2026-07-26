
const express = require("express");
const router = express.Router();

const catalogoController = require("../controllers/catalogoController");

router.get("/", catalogoController.home);
router.get("/produto/:id", catalogoController.detalhes);

module.exports = router;