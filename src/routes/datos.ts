//Importa la variable logger del index
import { logger, DB_CONFIG, CODIGOS_ESTADO } from '../controller/config';
import { ErrorMysql } from '../errors/ErrorMysql';

//Importa las funciones de librerias locales
import { bbdd_a_json, ejecutar_consulta, ejecutar_multiples_consultas } from "../controller/lib";
import { bodyDefinido, respuesta } from '../controller/serv';

//Importa los tipos y funciones de los modulos de node
import { Router, Request, Response } from "express";


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
        const json = await ejecutar_consulta(`SELECT * FROM ${req.params.tabla} ${where} ${group_by} ${order_by} ${limit}`.trim(), DB_CONFIG);
        //Devuelve el resultado de la consulta
        return respuesta(res, json, CODIGOS_ESTADO.OK);
    } catch (e) {
        //Comprueba si el error es una instancia de ErrorMysql o no. En caso de no serlo lo registra en el log
        if (!(e instanceof ErrorMysql)) {
            //En caso de error se almacena en el archivo 
            logger.error_archivo("Error en /:tabla?", {}, <Error>e);
            //Devuelve un mensaje de error, con el codigo 500
            return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Bad_Request);
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
        return respuesta(res, json, CODIGOS_ESTADO.OK);
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

//Crear
router.put("/:tabla?", bodyDefinido, async (req: Request, res: Response) => {
    try {
        //Array con las consultas
        const consultas: Array<string> = [];
        //En caso de que no se haya especificado una tabla
        if (req.params.tabla == undefined) {
            //En caso de que la tabla tokens este declarada
            delete req.body.Tokens;
            //Todos las propiedades del cuerpo son tratadas como una tabla y recorridas
            Object.keys(<Record<string, string>>req.body).forEach((tabla) => {
                //Crea la plantilla de cada insert
                let plantilla_consulta = `INSERT INTO ${tabla}`;
                //Comprueba si la propiedad columnas esta definida. En caso de estarlo añade a la plantilla las columnas sobre las que se realizara el insert
                if (req.body[tabla].columnas != undefined) plantilla_consulta = `${plantilla_consulta} (${(<Array<string>>req.body[tabla].columnas).join(", ")})`;
                plantilla_consulta = `${plantilla_consulta} VALUES`;
                //Recorre los valores de la propiedad valores (array que contiene otro array). 
                (<Array<Array<string | number>>>req.body[tabla].valores).forEach((valor) => {
                    //Cada array corresponde con un insert y los valores de este, cada valor del insert
                    //Añade al array de consultas la consulta
                    consultas.push(`${plantilla_consulta} ('${valor.join("', '")}')`);
                });
            });
            logger.log_consola(consultas.toString());
        } else {
            //Comprueba si la tabla especificada es tokens devuelve una respuesta vacia
            if (req.params.tabla == "Tokens") return respuesta(res, {}, CODIGOS_ESTADO.Bad_Request);
             //Crea la plantilla de cada insert
            let plantilla_consulta = `INSERT INTO ${req.params.tabla}`;
            //Comprueba si la propiedad columnas esta definida. En caso de estarlo añade a la plantilla las columnas sobre las que se realizara el insert
            if (req.body.columnas != undefined) plantilla_consulta = `${plantilla_consulta} (${(<Array<string>>req.body.columnas).join(", ")})`;
            plantilla_consulta = `${plantilla_consulta} VALUES`;
            //Recorre los valores de la propiedad valores (array que contiene otro array). 
            (<Array<Array<string | number>>>req.body.valores).forEach((valor) => {
                //Cada array corresponde con un insert y los valores de este, cada valor del insert
                //Añade al array de consultas la consulta
                consultas.push(`${plantilla_consulta} ('${valor.join("', '")}')`);
            });
            logger.log_consola(`2 ${consultas.toString()}`);
        }

        //Ejecuta el erray de consultas
        ejecutar_multiples_consultas(consultas, DB_CONFIG);

        //Devulve un mensaje indicando que todo ha ido bien
        respuesta(res, "Datos creados correctamente correcta", CODIGOS_ESTADO.OK);
    } catch (e) {
        //En caso de que algun valor de la petición sea incorrecto, no sea del tipo esperado
        if (e instanceof TypeError) {
            //Devuelve un menaje indicando el error, y ejemplos de uso
            return respuesta(res, { error: "Alguna propiedad del cuerpo es incorrecto", info: `${req.originalUrl}/info` }, CODIGOS_ESTADO.Bad_Request);
        }
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
