/**
 * @file Archivo que contine middlewares para el servidor 
 */

import { NextFunction, Request, Response } from "express";

function bodyDefinido(req: Request, res: Response, next: NextFunction) {
    if (req.body == undefined) {
       return res.status(400).send("Especifica un cuerpo del mensaje")
    }
    return next();
}

export { bodyDefinido };