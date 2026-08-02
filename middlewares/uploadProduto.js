"use strict";
const path=require("node:path"),multer=require("multer");
const storage=multer.diskStorage({destination:(r,f,cb)=>cb(null,path.join(__dirname,"..","public","uploads","produtos")),filename:(r,f,cb)=>cb(null,`${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(f.originalname).toLowerCase()}`)});
module.exports=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(r,f,cb)=>["image/jpeg","image/png","image/webp"].includes(f.mimetype)?cb(null,true):cb(new Error("Envie uma imagem JPG, PNG ou WebP."))});
