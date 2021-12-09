//Importa la variable logger del index
import { logger, DB_CONFIG, CODIGOS_ESTADO } from '../controller/config';
import { ErrorMysql } from '../errors/ErrorMysql';

//Importa las funciones de librerias locales
import { bbdd_a_json, ejecutar_consulta } from "../controller/lib";
import { respuesta } from '../controller/serv';

//Importa los tipos y funciones de los modulos de node
import { Router, Request, Response } from "express";
import { escape } from "mysql";


export const router = Router();

//Permite hacer una select de la base de datos
router.get("/:tabla?", async (req: Request, res: Response) => {
    try {
        if (req.params.tabla == undefined || req.params.tabla == "Tokens") {
            //Json con la informacion
            const json = await bbdd_a_json(DB_CONFIG);
            //Devuelve el json con el codigo de estado 200
            return respuesta(res, json, CODIGOS_ESTADO.OK);
        }
        //Expresion regular para eliminar la comillas iniciales y finales
        const eliminar_comillas = new RegExp(/^["']|["']$/g);

        //Obtiene los condicionales de los parametros de la url y elimina las comillas de inicio y fin, si las tiene
        //si no existe el parametro se especifica un valor vacio
        let where: string = req.query.where?.toString().replace(eliminar_comillas, "") || "";
        let group_by: string = req.query.group_by?.toString().replace(eliminar_comillas, "") || "";
        let order_by: string = req.query.order_by?.toString().replace(eliminar_comillas, "") || "";
        let limit: string = req.query.limit?.toString().replace(eliminar_comillas, "") || "";

        //Comprueba si los parametros contienen los respectivos condicionantes, o si son vacios, 
        //Si no lo contiene los añade directamente
        where = (/^where\s.*/i.test(where) || where === "") ? where : `WHERE ${where}`;
        group_by = (/^group\sby\s.*/i.test(group_by) || group_by === "") ? group_by : `GROUP BY ${group_by}`;
        order_by = (/^order\sby\s.*/i.test(order_by) || order_by === "") ? order_by : `ORDER BY ${order_by}`;
        limit = (/^limit\s.*/i.test(order_by) || limit === "") ? limit : `LIMIT ${limit}`;

        //LLama a la funcion para ejecutar la consulta, guarda el resultado en una 
        const json = await ejecutar_consulta(`SELECT * FROM ${req.params.tabla} ${escape(where)} ${escape(group_by)} ${escape(order_by)} ${escape(limit)}`.trim(), DB_CONFIG);
        //Devuelve el resultado de la consulta
        return respuesta(res, json, CODIGOS_ESTADO.OK);
    } catch (e) {
        //Comprueba si el error es una instancia de ErrorMysql o no. En caso de no serlo lo registra en el log
        if (!(e instanceof ErrorMysql)) {
            //En caso de error se almacena en el archivo 
            logger.error_archivo("Error en /:tabla?", {}, <Error>e);
            //Devuelve un mensaje de error, con el codigo 500
            return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
        }
        //Devuelve un mensaje de error indicando un fallo en la consulta
        return respuesta(res, "Fallo al ejecutar la query de busqueda. " + (<Error>e).message, CODIGOS_ESTADO.Internal_Server_Error);
    }
});

router.get("/:tabla/formato", async (req: Request, res: Response) => {
    try {
        //Comprueba si la tabla es Tokens, 
        if (req.params.tabla == "Tokens") {
            //Devuelve el json con el codigo de estado 200
            return respuesta(res, {}, CODIGOS_ESTADO.OK);
        }

        //JSON que almacenara el resultado de la consulta
        const json: Record<string, unknown> = {};
        //Ejecuta la sentencia para obtener la descripcion de la tabla y la almacenara en una propiedad con el mismo nombre que la tabla
        json[`${req.params.tabla}`] = await ejecutar_consulta(`DESCRIBE ${req.params.tabla}`, DB_CONFIG);

        //Devuelve el resultado de la consulta
        return respuesta(res, { '${req.params.tabla}': json }, CODIGOS_ESTADO.OK);
    } catch (e) {
        //Comprueba si el error es una instancia de ErrorMysql o no. En caso de no serlo lo registra en el log
        if (!(e instanceof ErrorMysql)) {
            //En caso de error se almacena en el archivo 
            logger.error_archivo("Error en /:tabla/formato", {}, <Error>e);
            //Devuelve un mensaje de error, con el codigo 500
            return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
        }
        //Devuelve un mensaje de error indicando un fallo en la consulta
        return respuesta(res, "Fallo al ejecutar la query de busqueda. " + (<Error>e).message, CODIGOS_ESTADO.Bad_Request);
    }
});