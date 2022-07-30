/**
 * @file Archivo de configuración global
 */

import { ConnectionConfig } from "mysql";
import { Logger } from "logger";
import { ErrorGeneral } from "../errors/ErrorGeneral";
import { existsSync, accessSync, lstatSync } from "fs";
import { resolve } from "path";
import { W_OK, R_OK } from "constants";

declare global {
    //Declara la funcion sustituirValor en la interfaz Array
    interface Array<T> {
        sustituirValor(array: Array<T>): void;
    }
    //Declara la funcion compilarPlantilla en la interfaz String. Antes se declaraba
    //en el fichero logger.ts (externalizado como libreria) 
    interface String {
        /**
         * Permite definir una plantilla como string y compilarla al llamar a este metodo
         * @param args objeto, con un string como clave, y cualquier tipo como valor
         * @returns una Funcion que cambia sustitulle los valores en la plantill
         * @see Codigo de {@link https://stackoverflow.com/questions/29182244/convert-a-string-to-a-template-string/41015840#41015840 } StackOverflow
         */

        compilarPlantilla(args: Record<string, unknown>): Function;
    }
}

//Establece la funcion para sustituir valor
Array.prototype.sustituirValor = function <T>(array: Array<T>) {
    //Elimina todos los valores del array
    this.splice(0);
    //Añade los valores del nuevo array
    this.push(...array);
};

//Establece la funcion para compilar las plantillas de javascript
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

//Enum con codigos de estado HTTP
export enum CODIGOS_ESTADO {
    OK = 200,
    Bad_Request = 400,
    Not_Found = 404,
    Unauthorized = 401,
    Internal_Server_Error = 500
}

//Comprueba si las variables SECRETO y SECKEY estan definidas. En caso de no estarlo lanza un error (El error finalizaria la conexion).
if (process.env.SECRETO === undefined || process.env.SECKEY === undefined) {
    //Crea una instancia del error 
    const error = new ErrorGeneral("La variable de entorno SECRETO o SECKEY no esta definida");
    //Guarda el error en el archivo log
    logger.error_archivo("Claves de entorno no definidas", {}, error);
    //Devuelve una respuesta con un error
    throw error;
}

//Constante para la ruta de la carpeta temporal
export const ruta_tmp: string = resolve(process.env.RUTA_TMP === undefined ? "/tmp" : process.env.RUTA_TMP);

//Comprueba si la ruta existe y si es un directorio
if (!existsSync(ruta_tmp) || !lstatSync(ruta_tmp).isDirectory()) {
    //Crea una instancia del error 
    const error = new ErrorGeneral("La ruta no existe o no es un directorio");
    //Guarda el error en el archivo log
    logger.error_archivo("Fallo al comprobar la ruta", {}, error);
    //Devuelve una respuesta con un error
    throw error;
}

try {
    //Comprueba los permisos de lectura y escritura de la ruta
    accessSync(ruta_tmp, W_OK | R_OK);
} catch (e) {
    //Guarda un registro en el log
    logger.error_archivo("Fallo al comprobar el acceso", {}, <Error>e);
    //Lanza el error
    throw new ErrorGeneral("No hay acceso a la carpeta temporal");
}

//Comprueba si la codificacion es valida
if (process.env.CODIFICACION === undefined || !Buffer.isEncoding(process.env.CODIFICACION)) {
    //Crea una instancia del error 
    const error = new ErrorGeneral("La codificacion no es valida");
    //Guarda el error en el archivo log
    logger.error_archivo("Fallo con la codificacion", {}, error);
    //Devuelve una respuesta con un error
    throw error;
}
//Codificacion para la aplicacion
export const codificacion: BufferEncoding = process.env.CODIFICACION;

//Exporta las constantes de las claves SECRETO y SECKEY
export const clave_secreto: string = process.env.SECRETO;
export const clave_seckey: string = process.env.SECKEY;
export const directorio_compilado: string = process.env.DIR_COM || "dist";