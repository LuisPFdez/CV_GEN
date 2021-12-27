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
        if (req.params.tabla === undefined || req.params.tabla === "Tokens") {
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
            logger.error_archivo("Error en /:tabla? (GET)", {}, <Error>e);
            //Devuelve un mensaje de error, con el codigo 500
            return respuesta(res, "Error del servidor", (<ErrorMysql>e).codigo);
        }
        //Devuelve un mensaje de error indicando un fallo en la consulta
        return respuesta(res, "Fallo al ejecutar la query de busqueda. " + (<Error>e).message, CODIGOS_ESTADO.Internal_Server_Error);
    }
});

router.get("/:tabla/formato", async (req: Request, res: Response) => {
    try {
        //Comprueba si la tabla es Tokens, 
        if (req.params.tabla === "Tokens") {
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
            return respuesta(res, "Error del servidor", (<ErrorMysql>e).codigo);
        }
        //Devuelve un mensaje de error indicando un fallo en la consulta
        return respuesta(res, "Fallo al ejecutar la query de busqueda. " + (<Error>e).message, CODIGOS_ESTADO.Bad_Request);
    }
});

router.put("/:tabla?", bodyDefinido, async (req: Request, res: Response) => {
    try {
        //Array con las consultas
        const consultas: Array<string> = [];
        //En caso de que no se haya especificado una tabla
        if (req.params.tabla === undefined) {
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
        } else {
            //Comprueba si la tabla especificada es tokens devuelve una respuesta vacia
            if (req.params.tabla === "Tokens") return respuesta(res, {}, CODIGOS_ESTADO.Bad_Request);
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
        }

        //Ejecuta el array de consultas
        ejecutar_multiples_consultas(consultas, DB_CONFIG);

        //Devuelve un mensaje indicando que todo ha ido bien
        return respuesta(res, "Datos creados correctamente correcta", CODIGOS_ESTADO.OK);
    } catch (e) {
        //En caso de que algun valor de la petición sea incorrecto, no sea del tipo esperado
        if (e instanceof TypeError) {
            //Devuelve un menaje indicando el error, y ejemplos de uso
            return respuesta(res, { error: "Alguna propiedad del cuerpo es incorrecto", info: `${req.originalUrl}/info` }, CODIGOS_ESTADO.Bad_Request);
        }
        //Comprueba si el error es una instancia de ErrorMysql o no. En caso de no serlo lo registra en el log
        if (!(e instanceof ErrorMysql)) {
            //En caso de error se almacena en el archivo 
            logger.error_archivo("Error en /:tabla? (PUT)", {}, <Error>e);
            //Devuelve un mensaje de error, con el codigo 500
            return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
        }
        //Devuelve un mensaje de error indicando un fallo en la consulta
        return respuesta(res, "Fallo al insertar los datos. " + (<Error>e).message, CODIGOS_ESTADO.Bad_Request);
    }
});

//----------------------------------------------------------------------------------
router.post("/:tabla?", async (req: Request, res: Response): Promise<Response> => {
    try {
        //Array con las consultas
        const consultas: Array<string> = [];
        //En caso de que el body no sea un array, crea un array del body
        if (!Array.isArray(req.body)) req.body = [req.body];
        //En caso de que no se haya especificado una tabla
        if (req.params.tabla === undefined) {
            //El cuerpo se trata como un array de objetos. En caso de no serlo se lanzaria un error. Cada objecto se considera que tiene unas opciones especificas
            req.body.forEach((query: { tabla: string, where: string, order_by?: string, limit?: string, valores: Record<string, string> }) => {
                //En caso de que tabla o el where sean indefinidos lanzará un ErrorMysql
                if (query.tabla === undefined || query.where === undefined || query.where.trim() === "") throw new ErrorMysql("Error", CODIGOS_ESTADO.Bad_Request);
                //Si la tabla es tokens se ignora el objeto
                if (query.tabla === "Tokens") return;
                //Crea la plantilla. Para la query de update
                let plantilla_consulta = `UPDATE ${query.tabla} SET`;
                //Recorre el objeto valores. 
                Object.keys(query.valores).forEach((valor) => {
                    //Las claves del objeto corresponden con la columna. Y su valor con el nuevo valor de esta
                    plantilla_consulta = `${plantilla_consulta} ${valor} = ${query.valores[valor]}, `;
                });

                //Elimina la ultima coma y añade un espacio
                plantilla_consulta = plantilla_consulta.slice(0, -2).concat(" ");

                //Obtiene los valores de los condicionales. Salvo where, si no estan especificados
                //se especifica un valor vacio
                let where: string = query.where;
                let order_by: string = query.order_by || "";
                let limit: string = query.limit || "";

                //Comprueba si los condicionales tiene su respectivo condicional o ha de añadirlo. Si el 
                //valor es vacio no añade el condicional
                where = (/^where\s.*/.test(where) || where === "") ? where : `WHERE ${where}`;
                order_by = (/^order\sby\s.*/i.test(order_by) || order_by === "") ? order_by : `ORDER BY ${order_by}`;
                limit = (/^limit\s.*/i.test(order_by) || limit === "") ? limit : `LIMIT ${limit}`;

                //Añade la consulta al array de consultas
                consultas.push(`${plantilla_consulta} ${where} ${order_by} ${limit}`.trim());
            });
        } else {
            //Comprueba si la tabla especificada es tokens devuelve una respuesta vacia
            if (req.params.tabla === "Tokens") return respuesta(res, {}, CODIGOS_ESTADO.Bad_Request);
            //Guarda la tabla en una variable.
            const tabla = req.params.tabla;
            //El cuerpo se trata como un array de objetos. En caso de no serlo se lanzaria un error
            req.body.forEach((query: { where: string, order_by?: string, limit?: string, valores: Record<string, string> }) => {
                //En caso de que tabla o el where sean indefinidos lanzará un ErrorMysql
                if (query.where === undefined || query.where.trim() === "") throw new ErrorMysql("Error", CODIGOS_ESTADO.Bad_Request);
                //Crea la plantilla. Para la query de update
                let plantilla_consulta = `UPDATE ${tabla} SET`;
                //Recorre el objeto valores. 
                Object.keys(query.valores).forEach((valor) => {
                    //Las claves del objeto corresponden con la columna. Y su valor con el nuevo valor de esta
                    plantilla_consulta = `${plantilla_consulta} ${valor} = ${query.valores[valor]}, `;
                });

                //Elimina la ultima coma y añade un espacio
                plantilla_consulta = plantilla_consulta.slice(0, -2).concat(" ");

                //Obtiene los valores de los condicionales. Salvo where, si no estan especificados
                //se especifica un valor vacio
                let where: string = query.where;
                let order_by: string = query.order_by || "";
                let limit: string = query.limit || "";

                //Comprueba si los condicionales tiene su respectivo condicional o ha de añadirlo. Si el 
                //valor es vacio no añade el condicional
                where = (/^where\s.*/.test(where) || where === "") ? where : `WHERE ${where}`;
                order_by = (/^order\sby\s.*/i.test(order_by) || order_by === "") ? order_by : `ORDER BY ${order_by}`;
                limit = (/^limit\s.*/i.test(order_by) || limit === "") ? limit : `LIMIT ${limit}`;

                //Añade la consulta al array de consultas
                consultas.push(`${plantilla_consulta} ${where} ${order_by} ${limit}`.trim());
            });
        }

        //Ejecuta el array de consultas
        ejecutar_multiples_consultas(consultas, DB_CONFIG);

        //Devuelve un mensaje indicando que todo ha ido bien
        return respuesta(res, "Datos actualizados correctamente correcta", CODIGOS_ESTADO.OK);
    } catch (e) {
        //En caso de que algun vlor de la petición sea incorrecto, no sea del tipo esperado
        if (e instanceof TypeError) {
            //Devuelve un menaje indicando el error, y ejemplos de uso
            return respuesta(res, { error: "Alguna propiedad del cuerpo es incorrecto", info: `${req.originalUrl}/info` }, CODIGOS_ESTADO.Bad_Request);
        }
        //Comprueba si el error es una instancia de ErrorMysql o no. En caso de no serlo lo registra en el log
        if (!(e instanceof ErrorMysql)) {
            //En caso de error se almacena en el archivo 
            logger.error_archivo("Error en /:tabla? (POST)", {}, <Error>e);
            //Devuelve un mensaje de error, con el codigo 500
            return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
        }
        //Devuelve un mensaje de error indicando un fallo en la consulta
        return respuesta(res, "Fallo al actualizar los datos. " + (<Error>e).message, CODIGOS_ESTADO.Bad_Request);
    }
});

router.delete("/:tabla?", async (req: Request, res: Response): Promise<Response> => {
    try {
        //Array con las consultas
        const consultas: Array<string> = [];
        //En caso de que el body no sea un array, crea un array del body
        if (!Array.isArray(req.body)) req.body = [req.body];
        //En caso de que no se haya especificado una tabla
        if (req.params.tabla === undefined) {
            //El cuerpo se trata como un array de objetos. En caso de no serlo se lanzaria un error. Cada objecto se considera que tiene unas opciones especificas
            req.body.forEach((query: { tabla: string, where: string, order_by?: string, limit?: string }) => {
                //En caso de que tabla o el where sean indefinidos lanzará un ErrorMysql
                if (query.tabla === undefined || query.where === undefined || query.where.trim() === "") throw new ErrorMysql("Error", CODIGOS_ESTADO.Bad_Request);
                //Si la tabla es tokens se ignora el objeto
                if (query.tabla === "Tokens") return;
                //Crea la plantilla de cada insert  
                const plantilla_consulta = `DELETE FROM ${query.tabla}`;

                //Obtiene los valores de los condicionales. Salvo where, si no estan especificados
                //se especifica un valor vacio
                let where: string = query.where;
                let order_by: string = query.order_by || "";
                let limit: string = query.limit || "";

                //Comprueba si los condicionales tiene su respectivo condicional o ha de añadirlo. Si el 
                //valor es vacio no añade el condicional
                where = (/^where\s.*/.test(where) || where === "") ? where : `WHERE ${where}`;
                order_by = (/^order\sby\s.*/i.test(order_by) || order_by === "") ? order_by : `ORDER BY ${order_by}`;
                limit = (/^limit\s.*/i.test(order_by) || limit === "") ? limit : `LIMIT ${limit}`;

                //Añade la consulta al array de consultas
                consultas.push(`${plantilla_consulta} ${where} ${order_by} ${limit}`.trim());
            });
        } else {
            //Comprueba si la tabla especificada es tokens devuelve una respuesta vacia
            if (req.params.tabla === "Tokens") return respuesta(res, {}, CODIGOS_ESTADO.Bad_Request);
            //Guarda la tabla en una variable.
            const tabla = req.params.tabla;
            //El cuerpo se trata como un array de objetos. En caso de no serlo se lanzaria un error
            req.body.forEach((query: { where: string, order_by?: string, limit?: string }) => {
                //En caso de que tabla o el where sean indefinidos lanzará un ErrorMysql
                if (query.where === undefined || query.where.trim() === "") throw new ErrorMysql("Error", CODIGOS_ESTADO.Bad_Request);
                //Crea la plantilla de cada insert  
                const plantilla_consulta = `DELETE FROM ${tabla}`;

                //Obtiene los valores de los condicionales. Salvo where, si no estan especificados
                //se especifica un valor vacio
                let where: string = query.where;
                let order_by: string = query.order_by || "";
                let limit: string = query.limit || "";

                //Comprueba si los condicionales tiene su respectivo condicional o ha de añadirlo. Si el 
                //valor es vacio no añade el condicional
                where = (/^where\s.*/.test(where) || where === "") ? where : `WHERE ${where}`;
                order_by = (/^order\sby\s.*/i.test(order_by) || order_by === "") ? order_by : `ORDER BY ${order_by}`;
                limit = (/^limit\s.*/i.test(order_by) || limit === "") ? limit : `LIMIT ${limit}`;

                //Añade la consulta al array de consultas
                consultas.push(`${plantilla_consulta} ${where} ${order_by} ${limit}`.trim());
            });
        }

        //Ejecuta el array de consultas
        ejecutar_multiples_consultas(consultas, DB_CONFIG);

        //Devuelve un mensaje indicando que todo ha ido bien
        return respuesta(res, "Datos eliminados correctamente correcta", CODIGOS_ESTADO.OK);
    } catch (e) {
        //En caso de que algun vlor de la petición sea incorrecto, no sea del tipo esperado
        if (e instanceof TypeError) {
            //Devuelve un menaje indicando el error, y ejemplos de uso
            return respuesta(res, { error: "Alguna propiedad del cuerpo es incorrecto", info: `${req.originalUrl}/info` }, CODIGOS_ESTADO.Bad_Request);
        }
        //Comprueba si el error es una instancia de ErrorMysql o no. En caso de no serlo lo registra en el log
        if (!(e instanceof ErrorMysql)) {
            //En caso de error se almacena en el archivo 
            logger.error_archivo("Error en /:tabla? (DELETE)", {}, <Error>e);
            //Devuelve un mensaje de error, con el codigo 500
            return respuesta(res, "Error del servidor", CODIGOS_ESTADO.Internal_Server_Error);
        }
        logger.log_consola("Algo ha fallado", {}, e);
        console.log(e.name);
        //Devuelve un mensaje de error indicando un fallo en la consulta
        return respuesta(res, "Fallo al borrar los datos. " + (<Error>e).message, CODIGOS_ESTADO.Bad_Request);
    }
});