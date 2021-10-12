//Importa la variable logger del index
import { logger } from '../index';

//Importa las funciones de librerias locales
import { bbdd_a_json, json_a_html } from "../controller/lib";
import { bodyDefinido, respuesta } from '../controller/serv';

//Importa los tipos y funciones de los modulos de node
import { ConnectionConfig } from 'mysql';
import { Router, Request, Response } from "express";

//Exporta la constante router
export const router = Router();

//Configuracion para la conexion a la base de datos
const DB_CONFIG: ConnectionConfig = {
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST
};

//Ruta a las plantillas 
const rutaPlantillas = "dist/templates/";
//Plantilla por defecto 
const plantillaPre = "temp1.hbs";

//Rutas GET

//Devuelve la plantilla renderizada, con la informacion de la base de datos 
router.get("/bbdd_html", bodyDefinido, async (req: Request, res: Response): Promise<Response> => {
    try {
        //Comprueba si se ha pasado por parametro la plantilla, en caso contrario asigna la plantilla por defecto
        const plantilla: string = <string>req.query.plantilla || plantillaPre;

        //Renderiza el html, obtiene la informacion de la base de datos y luego llama a rendezar plantilla, teniendo como identificador
        //"ID", y la ruta relativa a la plantilla
        const html = await json_a_html(await bbdd_a_json(DB_CONFIG), "ID", rutaPlantillas + plantilla);
        //Devuelve el html con el html renderizado y un codigo de respuesta 200
        return respuesta(res, html, 200);

    } catch (e) {
        //En caso de error se almacena en el archivo 
        logger.error_archivo("Error en ddbb_html", {}, <Error>e);
        //Devuelve una respuesta indicado, junto con el mensaje del error y el codigo de estado 500
        return respuesta(res, "Fallo al renderizar el mensaje. Error: " + (<Error>e).message, 500);
    }
});

//Devuelve un json con la informacion de la base de datos
router.get("/bbdd_json", bodyDefinido, async (_req: Request, res: Response): Promise<Response> => {
    try {

        //Json con la informacion
        const json = await bbdd_a_json(DB_CONFIG);
        //Devuelve el json con el codigo de estado 200
        return respuesta(res, json, 200);

    } catch (e) {
        //En caso de error se almacena en el archivo 
        logger.error_archivo("Error en ddbb_json", {}, <Error>e);
        //Devuelve una respuesta indicado, junto con el mensaje del error y el codigo de estado 500
        return respuesta(res, "Fallo al renderizar el mensaje. Error: " + (<Error>e).message, 500);
    }
});

//Rutas POST
//Permite renderizar una plantilla a partir de la informacion recibida
router.post("/json_html", bodyDefinido, async (req: Request, res: Response): Promise<Response> => {
    //Comprueba si el cuerpo tiene la propiedad mensaje
    if (req.body.mensaje) {

        //Obtiene la propiedad id del cuerpo, en caso de existir establece "ID" por defecto
        const id: string = req.body.id || "ID";
        //Obtiene la propiedad plantilla del cuerpo, en caso de no existir establece la plantilla por defecto
        const plantilla: string = req.body.plantilla || plantillaPre;

        try {
            //Rendeiza el html a partir del json pasado
            const html = await json_a_html(req.body.mensaje, id, rutaPlantillas + plantilla);
            //Devuelve el html renderizado con el codigo de estado 200
            return respuesta(res, html, 200);
        } catch (e) {
            //En caso de error se almacena en el archivo 
            logger.error_archivo("Error en json_html", {}, <Error>e);
            //Devuelve una respuesta indicado, junto con el mensaje del error y el codigo de estado 500
            return respuesta(res, "Fallo al renderizar el mensaje. Error" + (<Error>e).message, 500);
        }
    } else {
        //En caso de no contener la propiedad, devuelve una respuesta con un codigo de estado 400
        return respuesta(res, "El cuerpo ha de contener la propiedad mensaje", 400);
    }
});