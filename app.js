const express = require("express");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const catalogoRoutes = require("./routes/catalogo");

app.use("/", catalogoRoutes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
});