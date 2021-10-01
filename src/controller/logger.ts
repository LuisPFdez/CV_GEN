import { resolve, join, extname } from "path";
import { accessSync, appendFileSync, existsSync, lstatSync, writeFileSync } from "fs";
import { R_OK, W_OK } from "constants";


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

/**
 * Error que es lanzado al surgir cualquier fallo en la clase {@link Logger}
 */
export class LoggerError extends Error {

    /**
     * @param msg mensaje del error
     */
    constructor(msg: string = "Error en el logger") {
        super(msg);
        this.name = "LoggerError";
    }

}

/**
 * Interfaz que define los colores posibles
 */
export interface ColoresLogger {
    FINC: string;
    ROJO: string;
    VERDE: string;
    AMARILLO: string;
    AZUL: string;

}

/** 
 *Interfaz que define todas las opciones de configuracion posibles, todas opcionales
*/
export interface LoggerConfig {
    fichero?: string;
    formato?: string;
    colores?: ColoresLogger;

}
/**
 * Interfaz que define los mismos parametros que LoggerConfig sin ser opcioneales
 * @see {@link LoggerConfig}
 */
interface LoggerConfigE {
    fichero: string;
    formato: string;
    colores: ColoresLogger;
}

/**
 * Esto es otra prueba
 * 
 */
export class Logger {

    private _ruta: string;
    private _fichero: string;
    private _formato: string;
    private _formato_error: string;

    constructor(fichero: string = "logger.log", formato: string = "Formato normal %R", formato_error:string = "Formato error %R, %M", ruta: string = "./") {
        this._ruta = this.comprobar_ruta(ruta);
        this._fichero = this.comprobar_fichero(fichero);
        this._formato = this.formatear(formato);
        this._formato_error = this.formatear(formato_error);
    }

    get ruta(): string {
        return this._ruta;
    }

    set ruta(ruta: string) {
        this._ruta = this.comprobar_ruta(ruta);
    }

    get fichero(): string {
        return this._fichero;
    }

    set fichero(fichero: string) {
        this._fichero = this.comprobar_fichero(fichero);
    }

    get formato(): string {
        return this._formato;
    }

    set formato(formato: string) {
        this._formato = this.formatear(formato);
    }

    get formato_error(): string {
        return this._formato_error;
    }

    set formato_error(formato_error: string) {
        this._formato_error = this.formatear(formato_error);
    }

    private formatear(formato: string): string {

        // Remplaza por la fecha y la hora
        formato = formato.replace("%s", "${new Date().getSeconds()}");
        formato = formato.replace("%i", "${new Date().getMinutes()}");
        formato = formato.replace("%H", "${new Date().getHours()}");
        formato = formato.replace("%D", "${new Date().getDate()}");
        formato = formato.replace("%M", "${new Date().getMonth()}");
        formato.replace("%Y", "${new Date().getFullYear()}");

        //Da informacion del error
        //Tipo de log ( error, log, warning)
        formato = formato.replace("%T", "${tipo}");
        formato = formato.replace("%N", "${nombre_error}");
        formato = formato.replace("%E", "${mensaje_error}");
        formato = formato.replace("%A", "${archivo}");
        formato = formato.replace("%R", "${mensaje}");
        formato = formato.replace("%L", "${linea}");


        //Tipo por el momento no implementado, a la espera de una soluccion
        formato = formato.replace("%CR", "${Color.ROJO}");
        formato = formato.replace("%CA", "${Color.AZUL}");
        formato = formato.replace("%CV", "${Color.VERDE}");
        formato = formato.replace("%CM", "${Color.AMARILLO}");
        formato = formato.replace("%CF", "${Color.FINC}");

        return formato;
    }

    private obtener_datos_stack<E extends Error>(error: E): { nombre_error: string, mensaje_error: string, archivo: string, linea: string } {
        //Declara la variable con las propiedades de error
        const datos = { nombre_error: error.name, mensaje_error: error.message, archivo: "", linea: "" };
        //Comprueba si stack es indefinido, en caso de serlo lo devuelve
        if (error.stack === undefined) return datos;
        //Separa stack por lineas, obtiene la 2º, elimina los espacios del inicio y el final y los separa por 
        //espacios en blanco, optiene las posiciones segunda y tercera del array y las guarda en archivo y linea
        const [, archivo, linea] = error.stack.split("\n")[1].trim().split(" ");
        //Guarda directamante archivo
        datos.archivo = archivo;
        //Separa lina por el signo de dos puntos, obtiene la penultima posicion y obtiene el primer valor del array (slice devuelve un array)
        datos.linea = linea.split(":").slice(-2, -1)[0];
        //Devuelve los datos
        return datos;
    }

    private configuracion(config: LoggerConfig, tipo:boolean, colores: ColoresLogger): LoggerConfigE {
        return {
            fichero!: config.fichero ? this.comprobar_fichero(config.fichero) : this._fichero,
            formato!: config.formato || tipo ? this._formato : this._formato_error,
            colores: config.colores || colores
        };
    }

    comprobar_ruta(ruta: string): string {
        ruta = join(resolve(ruta));

        if (!existsSync(ruta) || !lstatSync(ruta).isDirectory()) {
            throw new LoggerError("Error la ruta, " + ruta + " ,no existe o no es un directorio");
        }

        try {
            accessSync(ruta, W_OK | R_OK);
            return ruta;
        } catch {
            throw new LoggerError("Error, son necesario permisos de lectura y escritura para el directorio, " + ruta);
        }


    }

    comprobar_fichero(fichero: string): string {
        fichero = join(this._ruta, fichero);

        console.log(fichero);

        if (existsSync(fichero)) {
            if (!lstatSync(fichero).isFile()) {
                throw new LoggerError("Error el fichero, " + fichero + " ,no es un archivo");
            }

            if (extname(fichero) != ".log") {
                throw new LoggerError("El fichero, " + fichero + ", no es un log");
            }

            try {
                accessSync(fichero, W_OK | R_OK);
                return fichero;
            } catch {
                throw new LoggerError("Error, son necesario permisos de lectura y escritura para el fichero, " + fichero);
            }
        }

        writeFileSync(fichero, "");

        return fichero;

    }

    /**
     * Muestra un mensaje de log por consola, 
     * @param tipo string, tipo del mensaje 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error Error, cualquier tipo de error
     */
    private consola<E extends Error>(tipo: string, msg: string, config: LoggerConfig, error: E): void {
        const { archivo, linea, nombre_error, mensaje_error } = this.obtener_datos_stack(error);

        const tipoE = error.constructor.name == "Error";

        const { colores, formato } = this.configuracion(config, tipoE ,{
            FINC: "\x1b[0m",
            ROJO: "\x1b[31m",
            VERDE: "\x1b[32m",
            AMARILLO: "\x1b[33m",
            AZUL: "\x1b[34m"
        });

        const plantilla = (formato.compilarPlantilla({
            tipo: tipo,
            mensaje: msg,
            linea: linea,
            nombre_error: nombre_error,
            mensaje_error: mensaje_error,
            archivo: archivo,
            Color: colores,
        })).toString();

        console.log(plantilla);
    }

    /**
     * Muestra un mensaje por consola del tipo LOG
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error Error, cualquier tipo de error
     */
    log_consola<E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.consola("LOG", msg, config, error);
    }

    /**
     * Muestra un mensaje por consola del tipo INFO
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error Error, cualquier tipo de error
     */
    info_consola<E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        //LLama a consola, con tipo 
        this.consola("INFO", msg, config, error);
    }

    /**
     * Muestra un mensaje por consola del tipo ERROR
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error Error, cualquier tipo de error
     */
    error_consola<E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.consola("ERROR", msg, config, error);
    }

    /**
     * Guarda un mensaje de log en el archivo
     * @param tipo string, tipo del mensaje 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error Error, cualquier tipo de error
     */
    private archivo<E extends Error>(tipo: string, msg: string, config: LoggerConfig, error: E): void {
        const { archivo, linea, nombre_error, mensaje_error } = this.obtener_datos_stack(error);

        const tipoE = error.constructor.name == "Error";

        const { colores, formato } = this.configuracion(config, tipoE, {
            FINC: "",
            ROJO: "",
            VERDE: "",
            AMARILLO: "",
            AZUL: ""
        });

        const plantilla = (formato.compilarPlantilla({
            tipo: tipo,
            mensaje: msg,
            linea: linea,
            nombre_error: nombre_error,
            mensaje_error: mensaje_error,
            archivo: archivo,
            Color: colores,
        })).toString();

        appendFileSync(this._fichero, plantilla);
    }

    /**
     * Guarda un mensaje de log en el archivo del Tipo log
     * @param tipo string, tipo del mensaje 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error Error, cualquier tipo de error
     */
    log_archivo < E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.archivo("LOG", msg, config, error);
    }

    info_archivo < E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.archivo("INFO", msg, config, error);
    }

    error_archivo < E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.archivo("ERROR", msg, config, error);
    }
}