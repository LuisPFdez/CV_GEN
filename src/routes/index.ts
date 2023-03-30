//Importa la variable logger del index
import { logger, DB_CONFIG, CODIGOS_ESTADO, directorio_compilado } from '../config/config';

//Importa las funciones de librerias locales
import { bbdd_a_json, ejecutar_consulta, ejecutar_multiples_consultas, json_a_html } from "../controller/lib";
import { bodyDefinido, comprobarAcceso, respuesta } from '../controller/serv';

//Importa los tipos y funciones de los modulos de node
import { Router, Request, Response } from "express";

//Exporta la constante router
export const router = Router();

//Ruta a las plantillas 
const rutaPlantillas = directorio_compilado + "/templates/";
//Plantilla por defecto 
const plantillaPre = "temp1.hbs";

//Rutas GET

//Devuelve la plantilla renderizada, con la informacion de la base de datos 
router.get("/bbdd_html", async (req: Request, res: Response): Promise<Response> => {
    try {
        //Comprueba si se ha pasado por parametro la plantilla, en caso contrario asigna la plantilla por defecto
        const plantilla: string = <string>req.query.plantilla || plantillaPre;

        //Renderiza el html, obtiene la informacion de la base de datos y luego llama a rendezar plantilla, teniendo como identificador
        //"ID", y la ruta relativa a la plantilla
        const html = await json_a_html(await bbdd_a_json(DB_CONFIG), "ID", rutaPlantillas + plantilla);
        //En caso de acceptar html devuelve el html. En caso contrario devuelve el JSON
        if (req.accepts("html")) return res.send(html);
        //Devuelve el html con el html renderizado y un codigo de respuesta 200
        return respuesta(res, html, CODIGOS_ESTADO.OK);

    } catch (e) {
        //En caso de error se almacena en el archivo 
        logger.error_archivo("Error en ddbb_html", {}, <Error>e);
        //Devuelve una respuesta indicado, junto con el mensaje del error y el codigo de estado 500
        return respuesta(res, "Fallo al renderizar el mensaje. Error: " + (<Error>e).message, CODIGOS_ESTADO.Internal_Server_Error);
    }
});

router.get("/tablas_bbdd", async (req: Request, res: Response): Promise<Response> => {
    try {
        //Recupera las tablas de la base de datos
        const json = await ejecutar_consulta("SHOW TABLES", DB_CONFIG);
        //Objeto con las consultas y el nombre de estas
        const tablas: Record<string, string> = {};

        //En caso de que tipo de json sea un booleano responde con un objeto vacio y un codigo de error 500
        if (typeof (json) == "boolean") return respuesta(res, {}, CODIGOS_ESTADO.Internal_Server_Error);

        //Recorre los datos de la consulta json
        json.forEach((datos) => {
            //Obtiene el valor de cada consulta
            const tabla = datos[`Tables_in_${DB_CONFIG.database}`];
            //Crea un objeto con las consultas a ejecutar
            tablas[tabla] = `DESCRIBE ${tabla}`;
        });

        //Elimina la tabla tokens del objeto de consultas
        delete tablas["Tokens"];
        //Ejecuta las consultas y las almacena en el resultado
        const resultado = await ejecutar_multiples_consultas(tablas, DB_CONFIG);

        //Devuelve el resultado de la consulta
        return respuesta(res, resultado, CODIGOS_ESTADO.OK);
    } catch (e) {
        //En caso de error se almacena en el archivo 
        logger.error_archivo("Error en tablas_bbdd", {}, <Error>e);
        //Devuelve una respuesta indicado, junto con el mensaje del error y el codigo de estado 500
        return respuesta(res, "Fallo al ejecutar la query de busqueda. " + (<Error>e).message, CODIGOS_ESTADO.Internal_Server_Error);
    }
});

//Rutas POST
//Permite renderizar una plantilla a partir de la informacion recibida
router.post("/json_html", comprobarAcceso, bodyDefinido, async (req: Request, res: Response): Promise<Response> => {
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
            return respuesta(res, html, CODIGOS_ESTADO.OK);
        } catch (e) {
            //Devuelve una respuesta indicado, junto con el mensaje del error y el codigo de estado 500
            return respuesta(res, "Fallo al renderizar el mensaje. Error" + (<Error>e).message, CODIGOS_ESTADO.Internal_Server_Error);
        }
    } else {
        //En caso de no contener la propiedad, devuelve una respuesta con un codigo de estado 400
        return respuesta(res, "El cuerpo ha de contener la propiedad mensaje", CODIGOS_ESTADO.Bad_Request);
    }
});