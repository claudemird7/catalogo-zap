"use strict";
function exigirSuperAdmin(req,res,next){
 if(!req.session?.usuario) return res.redirect('/admin/login');
 if(req.session.usuario.tipo!=='superadmin') return res.status(403).send('Acesso restrito ao Super Admin.');
 next();
}
module.exports={exigirSuperAdmin};
