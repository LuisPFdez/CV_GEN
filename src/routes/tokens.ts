import { clave_secreto, CODIGOS_ESTADO, DB_CONFIG, listadoTokens, logger } from "../controller/config";
import { bbdd_token, token_bbdd, borrar_token } from '../controller/lib';
import { bodyDefinido, comprobarClave, respuesta } from '../controller/serv';

import { Router, Request, Response } from "express";
import { sign } from "jsonwebtoken";

export const router = Router();

router.post("/gen_token", comprobarClave, bodyDefinido, async (req: Request, res: Response): Promise<Response> => {
    //Variable que almacena la fecha de expeiracion
    const fecha: string = req.body.fechaExp || "60 days";
    //Variable que almacena las rutas. (Se considera como un objeto)
    let rutas: Record<string, string[]> = req.body.rutas;

    //Comprueba si rutas es un array, en caso de serlo establece rutas como un objeto
    if (Array.isArray(rutas)) rutas = { "GET": rutas };
    //En caso de que el tipo de rutas no sea un objeto devuelve un error
    else if (typeof (rutas) != "object") return respuesta(res, "El valor de rutas ha de ser un array o un objeto", CODIGOS_ESTADO.Bad_Request);

    //Variable objeto de rutas donde se almacenará el contenido de rutas para el token
    const oRutas: Record<string, string[]> = {};
    //Recorre las claves de rutas
    Object.keys(rutas).forEach((metodo) => {
        //Comprueba si el valor del metodo es un array, en caso de no serlo devuelve un error 
        if (!Array.isArray(rutas[metodo])) return respuesta(res, "El valor de los metodos ha de ser un array", CODIGOS_ESTADO.Bad_Request);
        //Almacena en la variable oRutas el valor correspondiente de rutas, pero con el metodo en mayusculas
        oRutas[metodo.toUpperCase()] = rutas[metodo];
    });

    try {
        //Crea el token de acceso
        const jwt = sign({ "rutas": oRutas, "iat": new Date().getTime() }, clave_secreto, { expiresIn: fecha });
        //Inserta el token la base de datos
        await token_bbdd(jwt, DB_CONFIG);
        //Carga todos los tokens de la base de datos
        listadoTokens.sustituirValor(await bbdd_token(DB_CONFIG));
        //Responde con el token 
        return respuesta(res, { info: "Token creado correctamente, por favor guarda el token en un lugar seguro. En caso de perderlo no habrá forma de recupéralo y será necesario crear uno nuevo", token: jwt }, CODIGOS_ESTADO.OK);
    } catch (e) {
        //Guarda el error en el logger
        logger.error_archivo("Error en gen_token", {}, <Error>e);
        //Devuelve un mensaje de error del servido
        return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
    }

});

router.post("/borrar_token", comprobarClave, bodyDefinido, async (req: Request, res: Response): Promise<Response> => {
    //Comprueba si el token se ha pasado por parametro url o en el cuerpo del post, en caso de no estar definido devuelve un mensaje de error
    if (req.body.token == undefined && req.query.token == undefined) return respuesta(res, "Ha de pasarse el token a traves del cuerpo o un parametro en la url", CODIGOS_ESTADO.Bad_Request);
    //Obtiene el token del cuerpo o de la url
    const token = <string>req.body.token || <string>req.query.token;

    try {
        //Borra el token de la base de datos
        await borrar_token(token, DB_CONFIG);
        //Carga todos los tokens de la base de datos
        listadoTokens.sustituirValor(await bbdd_token(DB_CONFIG));
        return respuesta(res, `Token [ ${token} ] borrado`, CODIGOS_ESTADO.OK);
    } catch (e) {
        //Guarda el error en el logger
        logger.error_archivo("Error en borrar_token", {}, <Error>e);
        //Devuelve un mensaje de error del servido
        return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
    }
});
