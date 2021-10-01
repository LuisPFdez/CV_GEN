/**
 * @file Archivo que contine middlewares para el servidor 
 */

import { NextFunction, Request, Response } from "express";

/**
 * Funcion que genera una respuesta json, con el mensaje y el codigo de estado HTTP
 * @param res Response, funcion de respuesta
 * @param mensaje string | Record<string, unknown>, recibe un string o un json
 * @param codigoError Codigo de estado HTTP
 * @returns Response 
 */
function respuesta(res: Response, mensaje: string | Record<string, unknown>, codigoError: number): Response {
    //Devuelve la respuesta, con el codigo de estado, y un json que contiene el mensaje y el codigo de nuevo
    return res.status(codigoError).json(
        { mensaje: mensaje, codigoError: codigoError }
    );
}

/**
 * Midleware que comprueba si el req.body esta definido
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Response | void
 */
function bodyDefinido(req: Request, res: Response, next: NextFunction): Response | void {
    //Comprueba si el body es igual a undefined
    if (req.body == undefined) {
        //Devuelve una respuesta con un codigo de error 400
        return respuesta(res, "Especifica un cuerpo del mensaje", 400);
    }
    //Pasa al siguiente middleware
    return next();
}

export { bodyDefinido, respuesta };