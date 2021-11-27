import { CODIGOS_ESTADO, DB_CONFIG, listadoTokens, logger } from "../controller/config";
import { bbdd_token, token_bbdd, borrar_token } from '../controller/lib';
import { bodyDefinido, comprobarClave, respuesta } from '../controller/serv';

import { Router, Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { ErrorGeneral } from "../errors/ErrorGeneral";

export const router = Router();

router.post("/gen_token", comprobarClave, bodyDefinido, async (req: Request, res: Response): Promise<Response> => {
    //Comprueba si la variable de entorno es indefinida, en caso de serlo lanza un error
    if (process.env.SECRETO == undefined) {
        //Guarda el error en el archivo log
        logger.error_archivo("Clave de entorno no definida", {}, new ErrorGeneral("La variable de entorno SECRETO no esta definida"));
        //Devuelve una respuesta con un error
        return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
    }

    //Variable que almacena la fecha de expeiracion
    const fecha: string = req.body.fechaExp || "60 days";
    //Variable que almacena el array de ru
    const rutas: string[] = req.body.rutas;

    //Comprueba si rutas es un array, en caso de no serlo responde con un error
    if (!Array.isArray(rutas)) return respuesta(res, "Las rutas han de ser un array", CODIGOS_ESTADO.Bad_Request);

    try {
        //Crea el token de acceso
        const jwt = sign({ "rutas": rutas, "iat": new Date().getTime() }, process.env.SECRETO, { expiresIn: fecha });
        //Inserta el token la base de datos
        await token_bbdd(jwt, DB_CONFIG);
        //Carga todos los tokens de la base de datos
        listadoTokens.sustituirValor(await bbdd_token(DB_CONFIG));
        //Responde con el token 
        return respuesta(res, jwt, CODIGOS_ESTADO.OK);
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
