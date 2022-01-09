/**
 * @file Archivo que contine middlewares para el servidor 
 */

import { listadoTokens, DB_CONFIG, CODIGOS_ESTADO, clave_seckey, clave_secreto } from "./config";
import { borrar_token } from "./lib";

import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError, verify } from "jsonwebtoken";
import { SHA256 } from "crypto-js";

/**
 * Funcion que genera una respuesta json, con el mensaje y el codigo de estado HTTP
 * @param res Response, funcion de respuesta
 * @param mensaje unknown, recibe cuarquier tipo y este es devuelto
 * @param codigoEstado Codigo de estado HTTP
 * @returns Response 
 */
function respuesta(res: Response, mensaje: unknown, codigoEstado: number): Response {
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
 * Midleware que comprueba si el token de acceso es valido y tiene acceso a la ruta especificada
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Response | void
 */
function comprobarToken(req: Request, res: Response, next: NextFunction): Response | void {
    //Comprueba si el header del token de acceso es un string, en caso contrario responde con un error
    if (typeof (req.header("token-acceso")) != 'string') return respuesta(res, "Es necesario establecer un token de acceso en el header", CODIGOS_ESTADO.Bad_Request);
    //Almacena el token en una variable
    const token = <string>req.header("token-acceso");
    //Comprueba si el token esta en la lista de los tokens validos, en caso contrario lanza un error
    if (!listadoTokens.includes(SHA256(token).toString())) return respuesta(res, "El token de acceso no valido", CODIGOS_ESTADO.Unauthorized);

    //Comprueba si el token es valido, en caso de no serlo lanza una excepcion
    try {
        //Obtiene el objeto rutas de el token
        const { rutas } = <Record<string, unknown>>verify(token, clave_secreto);
        //Define e inicializa el array de string con las rutas para el metodo en especifico
        let metodo: string[] = []; //Se inicializa el array para evitar un error de typescript
        //Concatena las rutas del metodo y las rutas generales a un array vacio.
        metodo = metodo.concat((<Record<string, string[]>>rutas)[req.method.toUpperCase()], (<Record<string, string[]>>rutas)["GN"]);
        //Comprueba si alguna de las rutas coincide con la url solicitada (tambien comprueba que el elemento este definido), en caso de no devolvera una respuesta indicandolo
        if (!metodo.some((elemento: string | undefined) => elemento !== undefined && new RegExp(elemento).test(req.originalUrl))) {
            return respuesta(res, "El token no tiene acceso a la ruta especificada", CODIGOS_ESTADO.Unauthorized);
        }
        //Continua al siguente middleware
        return next();
    } catch (e) {
        //Comprueba si el error es de tipo TokenExpiredErrors
        if (e instanceof TokenExpiredError) {
            //Elimina el token de la base de datos
            borrar_token(token, DB_CONFIG);
            //Lanza un error indicando que el token ha expirado
            return respuesta(res, "Error, token expirado", CODIGOS_ESTADO.Bad_Request);
        } else if (e instanceof JsonWebTokenError) {
            //Lanza un error indicando 
            return respuesta(res, "Error token no valido", CODIGOS_ESTADO.Bad_Request);
        }
        //Devuelve una respuesta indicado que el token no es valido
        return respuesta(res, "Error interno del servidor. Comprueba las rutas del token", CODIGOS_ESTADO.Internal_Server_Error);
    }
}

/**
 * Comprueba el acceso a la ruta mediante la clave secreta
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Response | void
 */
function comprobarClave(req: Request, res: Response, next: NextFunction): Response | void {
    //Comprueba si la clave esta declarada en el head y si es la correcta. En caso de ser incorrecta, respondera con un mensaje de error
    if (req.header("secret-key") == undefined || req.header("secret-key") != clave_seckey) return respuesta(res, "La clave de acceso no es correcta o no ha sido definida, es necesario que la clave del header sea 'secret-key'", CODIGOS_ESTADO.Bad_Request);
    //Pasa al siguente middleware
    return next();
}

/**
 * Comprueba si tiene acceso a una ruta, mediante clave secreta o mediante token
 * @param req Request
 * @param res Response
 * @param next NextFunction
 * @returns Response | void
 */
function comprobarAcceso(req: Request, res: Response, next: NextFunction): Response | void {
    //Comprueba si en la cabecera esta la clave secreta, en caso de estar y ser la correcta pasa al siguente middleware
    if (req.header("secret-key") != undefined && req.header("secret-key") == clave_seckey) return next();
    //En caso de no estar declarada la clave comprueba si el Token esta declarado
    return comprobarToken(req, res, next);

}


export { respuesta, bodyDefinido, comprobarToken, comprobarClave, comprobarAcceso };