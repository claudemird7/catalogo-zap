const express = require("express");
const path = require("path");

const app = express();

const PORT = 3000;

// Arquivos públicos
app.use(express.static(path.join(__dirname, "public")));

// Página inicial
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
});
