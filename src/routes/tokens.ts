import { CODIGOS_ESTADO, DB_CONFIG, listadoTokens, logger } from "../controller/config";
import { bbdd_token, token_bbdd } from '../controller/lib';
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

    if (!Array.isArray(rutas)) return respuesta(res, "Las rutas han de ser un array", CODIGOS_ESTADO.Bad_Request);

    try {
        const jwt = sign({ "rutas": rutas, "iat": new Date().getTime() }, process.env.SECRETO, { expiresIn: fecha });

        await token_bbdd(jwt, DB_CONFIG);

        listadoTokens.sustituirValor(await bbdd_token(DB_CONFIG));

        return respuesta(res, jwt, CODIGOS_ESTADO.OK);
    } catch (e) {
        logger.error_archivo("Error en gen_token", {}, <Error>e);
        return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
    }

});

// router.post("/del_token", comprobarClave, bodyDefinido, async (req: Request, res:Response) => {

// });
