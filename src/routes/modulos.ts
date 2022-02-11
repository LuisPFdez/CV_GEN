// Administra los archivos estaticos. Tambien modulos como bootstrap

// Las rutas son insertardas en la raiz ( la ruta de /plublic sera localhost:puerto/public). No es recomendable usar / o rutas ya existentes por 
import express, { Router, Request, Response } from "express";
import { resolve } from "path";


//Constante de Router
export const router = Router();

//Archivos estaticos
router.use("/public", express.static(__dirname + "/../public"));
//Archivos estaticos para bootstrap
router.use("/bootstrap", express.static(__dirname + "/../../node_modules/bootstrap/dist"));
//Archivos estaticos para bootstrap-icons
router.use("/bootstrap/fonts", express.static(__dirname + "/../../node_modules/bootstrap-icons/font/fonts"));
router.use("/bootstrap/bootstrap-icons.css", (_req: Request, res: Response) => res.sendFile(resolve("node_modules/bootstrap-icons/font/bootstrap-icons.css")));
router.use("/bootstrap/bootstrap-icons.svg", (_req: Request, res: Response) => res.sendFile(resolve("node_modules/bootstrap-icons/bootstrap-icons.svg")));
//Archivos estaticos de highlight.js
router.use("/bootstrap/fonts", express.static(__dirname + "/../../node_modules/bootstrap-icons/font/fonts"));