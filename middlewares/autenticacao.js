"use strict";

function exigirLogin(req, res, next) {
    if (!req.session || !req.session.usuario) {
        return res.redirect("/admin/login");
    }

    next();
}

function impedirLoginDuplicado(req, res, next) {
    if (req.session && req.session.usuario) {
        return res.redirect("/admin");
    }

    next();
}

module.exports = {
    exigirLogin,
    impedirLoginDuplicado
};
