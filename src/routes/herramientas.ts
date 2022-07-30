/* eslint-disable @typescript-eslint/no-unused-vars */

import { CODIGOS_ESTADO, logger, ruta_tmp } from "../config/config";
import { Router, Request, Response } from "express";
import { readdirSync } from "fs";
import { respuesta } from "../controller/serv";


export const router = Router();

//Enum con los meses asignados a un numero
enum MESES {
    Enero = 1, Febrero = 2, Marzo = 3,
    Abril = 4, Mayo = 5, Junio = 6,
    Julio = 7, Agosto = 8, Septiembre = 9,
    Octubre = 10, Noviembre = 11, Diciembre = 12
}

router.get("/listar_copias", (req: Request, res: Response): Response => {
    try {
        //Listado de los archivos de la carpeta en la que se almacenan las copias
        let listado = readdirSync(ruta_tmp);
        //Objeto que se devolvera con las copias de seguridad disponibles
        const copias: Record<string, Record<string, string[]>> = {};

        //Expresion regular para filtrar unicamente los archivos de las copias de seguridad
        const reg = new RegExp(/^CSBD_.*\.mysql$/);
        //Expresion regular para eliminar la comillas iniciales y finales
        const eliminar_comillas = new RegExp(/^["']|["']$/g);

        //Fechas de inicio y fin para establecer un rango de fechas, si no recibe un paremetro 
        //se ignora la restriccion el formato es MES-DIA
        const fecha_inicio: Date | null = (req.query.fech_ini) ? new Date(req.query.fech_ini.toString().replace(eliminar_comillas, "")) : null;
        const fecha_fin: Date | null = (req.query.fech_fin) ? new Date(req.query.fech_fin.toString().replace(eliminar_comillas, "")) : null;

        //Filtro de tablas, puede ser un string o un array, si recibe nada se ignora el filtro
        let tablas: Array<unknown> = [];

        //Comprueba si el parametro tablas ha sido definido en la peticion
        if (req.query.tablas != undefined) {
            //Obtiene el parametro tablas y elimina las comillas iniciales y finales
            const tabla = req.query.tablas.toString().replace(eliminar_comillas, "");
            try {
                //Convierte a json el valor del parametro tablas, en caso de ser un string o estar mal definido lanza 
                //una excepcion
                const json = JSON.parse(tabla);

                //Comprueba si el resultado de convertir el parametro es un array
                //En caso de serlo el valor de tablas sera el JSON resultante del valor del parametros
                if (Array.isArray(json)) tablas = json;
                //En caso de no ser un array establece un array de un unico elemento
                else tablas = [json];

            } catch (e) {
                //Comprueba si la excepcion es distinta a SyntaxError, en caso de ser asi la lanza de nuevo
                //para que sea capturada en el try-catch superior 
                if (!(e instanceof SyntaxError)) throw e;
                //Establece el filtro con un unico valor, el valor del parametro tablas
                tablas = [tabla];
            }
        }

        //Obtiene los archivos que pertenecen a las copias de seguridad mediante un filtro
        listado = listado.filter(datos => reg.test(datos));

        //Recorre los nombres de los ficheros
        for (const elemento of listado) {

            //Separa los elementos del nombre del archivo, mediante la _ que identifica las cuatro partes
            //El primer elemento es el identificador de la copia de seguridad CSBD igual para todas las copias
            //El segundo elemento es la tabla modificada, el tercero la fecha de cuando se modifico, sin el año (las copias deben duran unos pocos meses),
            //El cuarto es la hora (horas:minutos:segundos) de cuando se modifico
            const [, tabla, fecha, hora] = elemento.split("_");

            //Se obtiene el dia y el mes separando la fecha 
            const dia = fecha.split("-")[1];
            const mes = Number(fecha.split("-")[0]);

            //El cuerpo del mensaje consiste en la hora y el nombre del archivo, se elemina el .mysql de la variable hora
            //y del nombre del archivo
            const hora_f = hora.split(".")[0].concat(` -> ${elemento.replace(".mysql", "")}`);

            //Comprueba si el array tablas contiene al menos un elemento y si es asi, si la tabla actual se encuentra en el array. 
            //Si no se encuentra no añade el elemento al objeto copias
            if (tablas.length > 0 && !tablas.includes(tabla)) continue;
            //Si la fecha_inicio esta establecida y la fecha del archivo es menor salta al siguente elemento
            if (fecha_inicio != null && fecha_inicio > new Date(fecha)) continue;
            //Si la fecha_fin esta establecida y la fecha del archivo es mayor salta al siguente elemento
            if (fecha_fin != null && fecha_fin < new Date(fecha)) continue;


            //Si el objeto no contenen la tabla como propiedad la crea.
            copias[tabla] ?? (copias[tabla] = {});

            //Si existe el array dentro de la tabla y el dia y mes (${MESES[mes]}, convierte el mes a texto) añade el array la variable hora_f
            //En caso de que el array no existe crea un array con un elemento que sera el valor de hora_f
            copias[tabla][`${dia}/${MESES[mes]}`]?.push(hora_f) ?? (copias[tabla][`${dia}/${MESES[mes]}`] = [hora_f]);
        }

        //Devuelve la variable copias
        return respuesta(res, copias, CODIGOS_ESTADO.OK);
    } catch (e) {
        //En caso de error se almacena en el archivo 
        logger.error_archivo("Error en ddbb_html", {}, <Error>e);
        //Devuelve una respuesta indicado, junto con el mensaje del error y el codigo de estado 500
        return respuesta(res, "Fallo al renderizar el mensaje. Error: " + (<Error>e).message, CODIGOS_ESTADO.Internal_Server_Error);
    }

});





/**
 * {
 *  Datos: {
 *      "10 Ene":{
 *      }
 *  }
 * }
 */