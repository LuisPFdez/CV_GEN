/**
 * @file Archivo de configuración global
 */

import { ConnectionConfig } from "mysql";
import { Logger } from "logger";

declare global {
    interface String {
        /**
         * Permite definir una plantilla como string y compilarla al llamar a este metodo
         * @param args objeto, con un string como clave, y cualquier tipo como valor
         * @returns una Funcion que cambia sustitulle los valores en la plantill
         * @see Codigo de {@link https://stackoverflow.com/questions/29182244/convert-a-string-to-a-template-string/41015840#41015840 StackOverflow}
         */

        compilarPlantilla(args: Record<string, unknown>): Function;
    }
}

String.prototype.compilarPlantilla = function (this: string, args: Record<string, unknown>): Function {
    //Extrae los nombres de la funcion
    const nombres: string[] = Object.keys(args);
    //Extrae los valores
    const valores: unknown[] = Object.values(args);
    //Devuelve una funcion que tiene por parametros todos los nombres de la funcion y devuelve la plantilla con los valores sustituidos
    //Se le pasan por parametro todos los valores, al haberse extraido de un objeto cada valor corresponde con su clave o nombre
    return new Function(...nombres, `return \`${this}\``)(...valores);
};


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

