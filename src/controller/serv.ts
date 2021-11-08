/**
 * @file Archivo que contine middlewares para el servidor 
 */

import { listadoTokens, logger, DB_CONFIG, CODIGOS_ESTADO } from "./config";
import { ErrorGeneral } from "../errors/ErrorGeneral";
import { borrar_token } from "./lib";

import { NextFunction, Request, Response } from "express";
import { TokenExpiredError, verify } from "jsonwebtoken";

/**
 * Funcion que genera una respuesta json, con el mensaje y el codigo de estado HTTP
 * @param res Response, funcion de respuesta
 * @param mensaje string | Record<string, unknown>, recibe un string o un json
 * @param codigoEstado Codigo de estado HTTP
 * @returns Response 
 */
function respuesta(res: Response, mensaje: string | Record<string, unknown>, codigoEstado: number): Response {
    //Devuelve la respuesta, con el codigo de estado, y un json que contiene el mensaje y el codigo de nuevo
    return res.status(codigoEstado).json(
        { mensaje: mensaje, codigoEstado: codigoEstado }
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
        return respuesta(res, "Especifica un cuerpo del mensaje", CODIGOS_ESTADO.Bad_Request);
    }
    //Pasa al siguiente middleware
    return next();
}

/**
 * Midleware que comprueba si el token de acceso es valido 
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Response | void
 */
function comprobarToken(req: Request, res: Response, next: NextFunction): Response | void {
    //Comprueba si el header del token de acceso es un string, en caso contrario responde con un error
    if (typeof (req.header("token-acceso")) != 'string') return respuesta(res, "", CODIGOS_ESTADO.OK);
    //Almacena el token en una variable
    const token = <string>req.header("token-acceso");
    //Comprueba si el token esta en la lista de los tokens validos, en caso contrario lanza un error
    if (!listadoTokens.includes(token)) return respuesta(res, "", CODIGOS_ESTADO.OK);
    //Comprueba si la variable de entorno es indefinida, en caso de serlo lanza un error
    if (process.env.SECRETO == undefined) {
        //Guarda el error en el archivo log
        logger.error_archivo("Clave de entorno no definida", {}, new ErrorGeneral("La variable de entorno SECRETO no esta definida"));
        //Devuelve una respuesta con un error
        return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
    }
    //Comprueba si el token es valido, en caso de no serlo lanza una excepcion
    try {
        //Obtiene el objeto rutas de el token
        const { rutas } = <Record<string, unknown>>verify(token, process.env.SECRETO);
        if (!(<string[]>rutas).includes(req.originalUrl)) {
            return respuesta(res, "Error", CODIGOS_ESTADO.Not_Found);
        }
    } catch (e) {
        //Comprueba si el error es de tipo TokenExpiredError
        if (e instanceof TokenExpiredError) {
            //Elimina el token de la base de datos
            borrar_token(token, DB_CONFIG);
            //Lanza un error indicando que el token ha expirado
            return respuesta(res, "Error, token expirado", CODIGOS_ESTADO.Not_Found);
        }
        //Devuelve una respuesta indicado que el token no es valido
        return respuesta(res, "Erorr", CODIGOS_ESTADO.Not_Found);
    }
    //Continua al siguente middleware
    return next();
}

function comprobarClave(req: Request, res: Response, next: NextFunction): Response | void {
    //Comprueba si la clave esta declarada en el head y si es la correcta. En caso de ser incorrecta, respondera con un mensaje de error
    if (req.header("secret-key") == undefined || req.header("secret-key") != process.env.SECKEY) return respuesta(res, "La clave de acceso no es correcta o no ha sido definida, es necesario que la clave del header sea 'secret-key'", CODIGOS_ESTADO.Bad_Request);
    //Pasa al siguente middleware
    return next();
}

function comprobarAcceso(req: Request, res: Response, next: NextFunction): Response | void {
    //Comprueba si en la cabecera esta la clave secreta, en caso de estar y ser la correcta pasa al siguente middleware
    if (req.header("secret-key") != undefined && req.header("secret-key") == process.env.SECKEY) return next();
    //En caso de no estar declarada la clave comprueba si el Token esta declarado
    return comprobarToken(req, res, next);

}


export { respuesta, bodyDefinido, comprobarToken, comprobarClave, comprobarAcceso };