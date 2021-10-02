import { logger } from '../index';

import { bbdd_a_json,  json_a_html } from "../controller/lib";
import { bodyDefinido, respuesta } from '../controller/serv';

import { ConnectionConfig } from 'mysql';
import { Router, Request, Response } from "express";

export const router = Router();

const DB_CONFIG: ConnectionConfig = {
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST
};

const rutaPlantillas = "dist/templates/";
const plantillaPre = "temp1.hbs";

//Rutas GET
router.get("/bbdd_json", bodyDefinido, async (req: Request, res: Response): Promise<Response> => {
    try {

        const plantilla: string = <string>req.query.plantilla || plantillaPre;

        const html = await json_a_html(await bbdd_a_json(DB_CONFIG), "ID", rutaPlantillas + plantilla);
        return respuesta(res, html, 200);

    } catch (e) {
        logger.error_archivo("Error en ddbb_json", {}, <Error>e);
        return respuesta(res, "Fallo al renderizar el mensaje. Error: " + (<Error>e).message, 500);
    }
});

router.get("/json", bodyDefinido, async (req: Request, res: Response): Promise<Response> => {
    try {

        const json = await bbdd_a_json(DB_CONFIG);
        return respuesta(res, json, 200);

    } catch (e) {
        logger.error_archivo("Error en ddbb_json", {}, <Error>e);
        return respuesta(res, "Fallo al renderizar el mensaje. Error: " + (<Error>e).message, 500);
    }
});

//Rutas POST
router.post("/json_html", bodyDefinido, async (req: Request, res: Response): Promise<Response> => {
    if (req.body.mensaje) {

        const id: string = req.body.id || "ID";
        const plantilla: string = req.body.plantilla || plantillaPre;

        try {
            const html = await json_a_html(req.body.mensaje, id, rutaPlantillas + plantilla);
            return respuesta(res, html, 200);
        } catch (e) {
            logger.error_archivo("Error en json_html", {}, <Error>e);
            return respuesta(res, "Fallo al renderizar el mensaje. Error" + (<Error>e).message, 500);
        }
    } else {
        return respuesta(res, "El cuerpo ha de contener la propiedad mensaje", 400);
    }
});