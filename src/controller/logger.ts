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
 * Interfaz que define la paleta de colores
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
 * Clase para el manejo del sistema de logs
 */
export class Logger {

    private _ruta: string;
    private _fichero: string;
    private _formato: string;
    private _formato_error: string;

    /**
     * 
     * @param fichero string, nombre, del fichero, por defecto logger.log
     * @param formato string, formato normal, tiene un valor por defecto
     * @param formato_error string, formato para cuando se lanza un error, tiene un valor por defecto
     * @param ruta lugar donde se guarda el archivo, por defecto es el directorio raiz
     * @remarks 
     * El formato permite caracteres especiales, que seran sustituidos por informacion
     * %{s} - Muestra los segundos,
     * %{i} - Muestra los minutos,
     * %{H} - Muestra las horas
     * %{D} - Muestra el dia,
     * %{M} - Muestra el mes,
     * %{Y} - Muestra el año,
     * %{T} - Muestra el tipo de log
     * %{A} - Muestra el modulo donde ha saltado el error o se ha llamado al metodo,
     * %{R} - Muestra el mensaje pasado al metodo,
     * %{L} - Muestra la linea donde ha saltado el error o se ha llamado al metodo,
     * %{N} - Muestra el nombre del error,
     * %{E} - Muestra el mensaje del error,
     * %{CR} - Pinta de color rojo (Consola),
     * %{CA} - Pinta de color azul (Consola),
     * %{CV} - Pinta de color verde (Consola),
     * %{CM} - Pinta de color amarillo (Consola),
     * %{CF} - Marca el fin de coloreado
     */
    constructor(fichero: string = "logger.log", formato: string = "(%{T})[%{H}:%{i}] - %{R}", formato_error: string = "(%{T})[%{H}:%{i}]( %{N},%{L} - {%{E};%{A}}) - %{R}", ruta: string = "./") {
        //
        this._ruta = this.comprobar_ruta(ruta);
        this._fichero = this.comprobar_fichero(fichero);
        this._formato = this.formatear(formato);
        this._formato_error = this.formatear(formato_error);
    }

    /**
     * Getter y Setter de las propiedades
     */
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

    /**
     * Sustituye caracteres por otros para 
     * @param formato cadena para hacer la sustitucion
     * @returns Cadena con los remplazos hecho
     */
    private formatear(formato: string): string {

        // Remplaza por la fecha y la hora
        formato = formato.replace(new RegExp("%{s}", "g"), "${new Date().getSeconds()}");
        formato = formato.replace(new RegExp("%{i}", "g"), "${new Date().getMinutes()}");
        formato = formato.replace(new RegExp("%{H}", "g"), "${new Date().getHours()}");
        formato = formato.replace(new RegExp("%{D}", "g"), "${new Date().getDate()}");
        formato = formato.replace(new RegExp("%{M}", "g"), "${new Date().getMonth()}");
        formato = formato.replace(new RegExp("%{Y}", "g"), "${new Date().getFullYear()}");

        //Informacion general
        //Tipo de log ( error, log, info)
        formato = formato.replace(new RegExp("%{T}", "g"), "${tipo}");
        formato = formato.replace(new RegExp("%{F}", "g"), "${funcion}");
        formato = formato.replace(new RegExp("%{A}", "g"), "${archivo}");
        formato = formato.replace(new RegExp("%{R}", "g"), "${mensaje}");
        formato = formato.replace(new RegExp("%{L}", "g"), "${linea}");
        //Informacion de los errores
        formato = formato.replace(new RegExp("%{N}", "g"), "${nombre_error}");
        formato = formato.replace(new RegExp("%{E}", "g"), "${mensaje_error}");


        //Colores
        formato = formato.replace(new RegExp("%{CR}", "g"), "${Color.ROJO}");
        formato = formato.replace(new RegExp("%{CA}", "g"), "${Color.AZUL}");
        formato = formato.replace(new RegExp("%{CV}", "g"), "${Color.VERDE}");
        formato = formato.replace(new RegExp("%{CM}", "g"), "${Color.AMARILLO}");
        formato = formato.replace(new RegExp("%{CF}", "g"), "${Color.FINC}");

        return formato;
    }

    /**
     * @typeParam E - Tipo que desciende de error 
     * @param error Error del que se van a obtener los datos
     * @returns Objeto con propiedades del error
     */
    private obtener_datos_stack<E extends Error>(error: E): { nombre_error: string, mensaje_error: string, funcion: string, linea: string, archivo: string } {
        //Declara la variable con las propiedades de error
        const datos = { nombre_error: error.name, mensaje_error: error.message, funcion: "", linea: "", archivo: "" };
        //Comprueba si stack es indefinido, en caso de serlo lo devuelve
        if (error.stack === undefined) return datos;
        //Separa stack por lineas, obtiene la 2º, elimina los espacios del inicio y el final y los separa por 
        //espacios en blanco, optiene las posiciones segunda y tercera del array y las guarda en archivo y linea
        const [, funcion, linea] = error.stack.split("\n")[1].trim().split(" ");
        //Guarda directamante llamada
        datos.funcion = funcion;
        //Separa lina por el signo de dos puntos,
        const linea2 = linea.split(":");
        //Elimina el parentesis del principio de la cadena
        linea2[0] = linea2[0].replace("(", "");
        //Obtiene todas las posiiones del array hasta la penultima y los vuelve a juntar con el signo de doble punto
        datos.archivo = linea2.slice(0, -2).join(":");
        //Obtiene la penultima posicion y obtiene el primer valor del array (slice devuelve un array)
        datos.linea = linea2.slice(-2, -1)[0];
        //Devuelve los datos
        return datos;
    }

    /**
     * Apartir de un objeto de Configuracion, asigna y devuelve las respectivas configuraciones filtradas
     * @param config LoggerConfig, objeto de configuracion 
     * @param tipo boolean, determina si el formato es normal o de error.
     * @param colores Paleta de colores en caso de que config no lo tengo
     * @returns LoggerConfigE, objeto de configuracion con las configuraciones filtradas
     */
    private configuracion(config: LoggerConfig, tipo: boolean, colores: ColoresLogger): LoggerConfigE {
        //Comprueba si config tiene establecido formato, en caso de ser asi lo formatea, en caso contrario 
        //apartir del tipo, determina si es un tipo formato normal o error
        const formato = (config.formato) ?
            this.formatear(config.formato) :
            tipo ? this._formato : this._formato_error;

        // Devueleve el objeto
        return {
            //Comprueba config tiene establecido fichero,en caso de ser asi comprueba ,en caso contrario usa el fichero
            //establecido en el objeto
            fichero: config.fichero ? this.comprobar_fichero(config.fichero) : this._fichero,
            //Asigna la constante formato
            formato: formato,
            //Si config no tiene declarado colores asigna el objeto colores pasado por parametro
            colores: config.colores || colores
        };
    }

    /**
     * Comprueba el directorio donde se guardaran los 
     * @param ruta string, ruta al directorio
     * @returns string, en caso de estar todo correcto, la ruta filtrada
     */
    private comprobar_ruta(ruta: string): string {
        //Obtiene la ruta absoluta en caso de ser relativa
        ruta = join(resolve(ruta));

        //Comprueba si la ruta no existe o no es un directorio, en caso de ser cierto uno de los dos, lanza un error
        if (!existsSync(ruta) || !lstatSync(ruta).isDirectory()) {
            throw new LoggerError("Error la ruta, " + ruta + " ,no existe o no es un directorio");
        }

        try {
            //Comprueba los permisos del directorio (si no se cumplen lanza una excepcion)
            accessSync(ruta, W_OK | R_OK);
            //Devueve la ruta
            return ruta;
        } catch {
            //Si los permisos no se cumplen lanza un error 
            throw new LoggerError("Error, son necesario permisos de lectura y escritura para el directorio, " + ruta);
        }


    }

    /**
     * 
     * @param fichero string, nombre del fichero con su extension
     * @returns string, ruta absoluta del fichero
     */
    private comprobar_fichero(fichero: string): string {
        //Obtiene la ruta absoluta del fichero a traves de la variable ruta
        fichero = join(resolve(this._ruta, fichero));

        //Comprueba si ese fichero, o ruta existe
        if (existsSync(fichero)) {
            //Comprueba si es un archivo, sino lanza un error
            if (!lstatSync(fichero).isFile()) {
                throw new LoggerError("Error el fichero, " + fichero + " ,no es un archivo");
            }

            //En caso de que el fichero tenga una extension distinta de log, lanzara un error para evitar la sobre escritura de archivos importantes
            if (extname(fichero) != ".log") {
                throw new LoggerError("El fichero, " + fichero + ", no es un log, por razones de seguridad solo se sobreescribiran archivos log");
            }

            try {
                //Comprueba los permisos de lectura y escritura del fichero, en caso de faltar alguno lanza una excepcion
                accessSync(fichero, W_OK | R_OK);
                //Devuelve el fichero
                return fichero;
            } catch {
                //Lanza una excepcion, en caso de no tener permisos
                throw new LoggerError("Error, son necesario permisos de lectura y escritura para el fichero, " + fichero);
            }
        }

        //En caso de no existir el fichero crea uno vacio
        writeFileSync(fichero, "");

        //Devuelve el fichero
        return fichero;

    }

    /**
     * Muestra un mensaje de log por consola, 
     * @typeParam E - Tipo que desciende de error 
     * @param tipo string, tipo del mensaje 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error E, cualquier tipo de error
     */
    private consola<E extends Error>(tipo: string, msg: string, config: LoggerConfig, error: E): void {
        //Guarda en variables las propiedades del objeto devuelto por obtener_datos_stack
        const { archivo, linea, nombre_error, mensaje_error, funcion } = this.obtener_datos_stack(error);

        //Comprueba si error es instancia (directa) de Error
        //En caso de que el error, utilizado entre otras cosas para saber desde donde se llama al metodo, sea 
        //distinto de Error, valor por defecto
        const tipoE = error.constructor.name == "Error";

        //Filtra la configuracion, le pasa el parametro de config, que tipo de formato ha de ser
        //y la paleta de colores por defecto
        const { colores, formato } = this.configuracion(config, tipoE, {
            FINC: "\x1b[0m",
            ROJO: "\x1b[31m",
            VERDE: "\x1b[32m",
            AMARILLO: "\x1b[33m",
            AZUL: "\x1b[34m"
        });

        //Renderiza la plantilla pasandole los valores que han de ser sustituidos
        //Como devuelve una funcion, la convierte a string
        const plantilla = (formato.compilarPlantilla({
            tipo: tipo,
            mensaje: msg,
            linea: linea,
            nombre_error: nombre_error,
            mensaje_error: mensaje_error,
            archivo: archivo,
            Color: colores,
            funcion: funcion
        })).toString();

        //Muestra el mensaje
        console.log(plantilla);
    }

    /**
     * Muestra un mensaje por consola del tipo LOG
     * @typeParam E - Tipo que desciende de error 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error E, error para mostrar en el log
     * @remarks 
     * El parametro error, se usa para obtener el lugar de llamada de la funcion, tambien puede usarse para
     * manejar un mensaje de error. Por defecto error es una instancia de la clase Error. El formato para 
     * manejar un error es distinto al normal. En caso de necesitar manejar un error, este no ha de ser 
     * instancia de Error
     */
    log_consola<E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.consola("LOG", msg, config, error);
    }

    /**
     * Muestra un mensaje por consola del tipo INFO
     * @typeParam E - Tipo que desciende de error 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error E, error para mostrar en el log
     * @remarks 
     * El parametro error, se usa para obtener el lugar de llamada de la funcion, tambien puede usarse para
     * manejar un mensaje de error. Por defecto error es una instancia de la clase Error. El formato para 
     * manejar un error es distinto al normal. En caso de necesitar manejar un error, este no ha de ser 
     * instancia de Error
     */
    info_consola<E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        //LLama a consola, con tipo 
        this.consola("INFO", msg, config, error);
    }

    /**
     * Muestra un mensaje por consola del tipo ERROR
     * @typeParam E - Tipo que desciende de error 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error E, error para mostrar en el log
     * @remarks 
     * El parametro error, se usa para obtener el lugar de llamada de la funcion, tambien puede usarse para
     * manejar un mensaje de error. Por defecto error es una instancia de la clase Error. El formato para 
     * manejar un error es distinto al normal. En caso de necesitar manejar un error, este no ha de ser 
     * instancia de Error
     */
    error_consola<E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.consola("ERROR", msg, config, error);
    }

    /**
     * Guarda un mensaje de log en el archivo
     * @typeParam E - Tipo que desciende de error 
     * @param tipo string, tipo del mensaje 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion 
     * @param error E, cualquier tipo de error
     */
    private archivo<E extends Error>(tipo: string, msg: string, config: LoggerConfig, error: E): void {
        //Guarda en variables las propiedades del objeto devuelto por obtener_datos_stack
        const { archivo, linea, nombre_error, mensaje_error, funcion } = this.obtener_datos_stack(error);
    
        //Comprueba si error es instancia (directa) de Error
        //En caso de que el error, utilizado entre otras cosas para saber desde donde se llama al metodo, sea 
        //distinto de Error, valor por defecto
        const tipoE = error.constructor.name == "Error";

        //Filtra la configuracion, le pasa el parametro de config, que tipo de formato ha de ser
        //y la paleta de colores por defecto, al ser un archivo los colores son vacios
        const { colores, formato } = this.configuracion(config, tipoE, {
            FINC: "",
            ROJO: "",
            VERDE: "",
            AMARILLO: "",
            AZUL: ""
        });
    
        //Renderiza la plantilla pasandole los valores que han de ser sustituidos
        //Como devuelve una funcion, la convierte a string
        const plantilla = (formato.compilarPlantilla({
            tipo: tipo,
            mensaje: msg,
            linea: linea,
            nombre_error: nombre_error,
            mensaje_error: mensaje_error,
            archivo: archivo,
            Color: colores,
            funcion: funcion
        })).toString();

        //Añade al final del archivo el mensaje
        appendFileSync(this._fichero, plantilla);
    }

    /**
     * Guarda un mensaje de log en el archivo del Tipo LOG
     * @typeParam E - Tipo que desciende de error 
     * @param tipo string, tipo del mensaje 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion, los colores no deber ser definido o se mostraran sus codigo en los ficheros 
     * @param error E, error para mostrar en el log
     * @remarks 
     * El parametro error, se usa para obtener el lugar de llamada de la funcion, tambien puede usarse para
     * manejar un mensaje de error. Por defecto error es una instancia de la clase Error. El formato para 
     * manejar un error es distinto al normal. En caso de necesitar manejar un error, este no ha de ser 
     * instancia de Error
     */
    log_archivo<E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.archivo("LOG", msg, config, error);
    }

    /**
     * Guarda un mensaje de log en el archivo del Tipo INFO
     * @typeParam E - Tipo que desciende de error 
     * @param tipo string, tipo del mensaje 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion, los colores no deber ser definido o se mostraran sus codigo en los ficheros
     * @param error E, error para mostrar en el log
     * @remarks 
     * El parametro error, se usa para obtener el lugar de llamada de la funcion, tambien puede usarse para
     * manejar un mensaje de error. Por defecto error es una instancia de la clase Error. El formato para 
     * manejar un error es distinto al normal. En caso de necesitar manejar un error, este no ha de ser 
     * instancia de Error
     */
    info_archivo<E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.archivo("INFO", msg, config, error);
    }

    /**
     * Guarda un mensaje de log en el archivo del Tipo ERROR 
     * @typeParam E - Tipo que desciende de error 
     * @param tipo string, tipo del mensaje 
     * @param msg string, mensaje del log
     * @param config LoggerConfig, configuracion, los colores no deber ser definido o se mostraran sus codigo en los ficheros
     * @param error E, error para mostrar en el log
     * @remarks 
     * El parametro error, se usa para obtener el lugar de llamada de la funcion, tambien puede usarse para
     * manejar un mensaje de error. Por defecto error es una instancia de la clase Error. El formato para 
     * manejar un error es distinto al normal. En caso de necesitar manejar un error, este no ha de ser 
     * instancia de Error
     */
    error_archivo<E extends Error>(msg: string, config: LoggerConfig = {}, error: E = <E>new Error()): void {
        this.archivo("ERROR", msg, config, error);
    }
}