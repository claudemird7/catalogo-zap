"use strict";

const express = require("express");
const session = require("express-session");
const path = require("node:path");
const { executarMigracoes } = require("./database/migracoes");

const catalogoRoutes = require("./routes/catalogo");
const apiProdutosRoutes = require("./routes/apiProdutos");
const adminRoutes = require("./routes/admin");
const adminProdutosRoutes = require("./routes/adminProdutos");
const premiumRoutes = require("./routes/premium");

executarMigracoes();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const emProducao = process.env.NODE_ENV === "production";

if (emProducao) {
    app.set("trust proxy", 1);
}


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use(express.static(path.join(__dirname, "public")));

app.use(
    session({
        name: "catalogo.sid",
        secret:
            process.env.SESSION_SECRET ||
            "catalogo-zap-desenvolvimento-altere-em-producao",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: emProducao,
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);

app.use("/premium", premiumRoutes);
app.use("/admin/produtos", adminProdutosRoutes);
app.use("/admin", adminRoutes);
app.use("/api/produtos", apiProdutosRoutes);
app.use("/", catalogoRoutes);

app.use((req, res) => {
    res.status(404).send("Página não encontrada.");
});

app.listen(PORT, () => {
    console.log(
        `Servidor iniciado em http://localhost:${PORT}`
    );
});