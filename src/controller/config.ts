/**
 * @file Archivo de configuración global
 */

import { ConnectionConfig } from "mysql";
import { Logger } from "./logger";

//Exporta la variable logger para el manejo de los logs
export const logger = new Logger();

//Configuracion para la conexion a la base de datos
export const DB_CONFIG: ConnectionConfig = {
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST
};

export const listadoTokens: string[] = [];

declare global {
    //Declara la funcion sustituirValor en la interfaz Array
    interface Array<T> {
        sustituirValor(array: Array<T>): void;
    }
}

//Establece la funcion para sustituir valor
Array.prototype.sustituirValor = function <T>(array: Array<T>) {
    //Elimina todos los valores del array
    this.splice(0);
    //Añade los valores del nuevo array
    this.push(...array);
};

//Enum con codigos de estado HTTP
export enum CODIGOS_ESTADO {
    OK = 200,
    Bad_Request = 400,
    Not_Found = 404,
    Unauthorized = 401,
    Internal_Server_Error = 500
}
