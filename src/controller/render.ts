
import { existsSync, lstatSync, readFileSync, } from "fs";
import Handlebars from "handlebars";
import { resolve } from "path";
import { ArchivoNoEncontrado } from "../errors/ArchivoNoEncontrado";
import { ErrorRenderizado } from "../errors/ErrorRenderizado";

/**
 Tipo que definie un objecto compuesto por un string como clave y un array como valor, el array a su vez se compone de otro objeto
 */
export type MDatos = Record<string, Array<Record<string, string>>> | Record<string, unknown>;

/**
 * Clase para renderizar las plantillas de Handlebars
 */
export class Render {
    /**
     * Definicion de las propiedades 
     */
    private _datos: MDatos;
    private _plantilla: string;
    private _id: string;
    /**
     * @param datos MDatos, objeto de determinadas caracteristicas
     * @param id String, identificador del grupo de datos
     * @param plantilla String, ruta de la plantilla que se va a renderizar
     */
    constructor(datos: MDatos, id: string, plantilla: string) {
        this._datos = datos;
        this._id = id;
        this._plantilla = this.comprobarPlantilla(plantilla);

        // Helpers de handlebars, permiten añadir funcionalidad a handlebars (todas las funciones de helpers reciben un ultimo parametro para renderizarse)

        /**
         * Funcion para buscar por id, el primer parametro ha de ser el objeto padre que corresponde el array de objetos,
         * el segundo parametro es el valor del ID
         */
        Handlebars.registerHelper('IDB', (objeto, valorID, options): string => {
            //Comprueba que el objeto no sea undefined o no sea un array
            if (objeto === undefined || !Array.isArray(objeto)) return "La tabla no existe o no es un array de objetos";

            //Filtro para obtener el objeto que coincide con el valor
            const datos = objeto.find((datos) => datos[this._id] === valorID);

            //Devuelve y renderiza la respuesta
            return options.fn(datos);
        });

        /**
         * Condicional que permite el uso de regex para comparar con el valor. El primer valor seria el campo para comparar. El
         * segundo la expresion regular
         */
        Handlebars.registerHelper("IF-REG", function (this: unknown, campo, expr, options): string | null {
            //Comprueba que el objeto no sea undefined o no sea un array
            if (campo === undefined) return "El campo es undefined";

            //Expresion para validar
            if (new Function(`return ${expr}.test('${campo}')`)()) {
                //Devuelve la respuesta
                return options.fn(this);
            }
            //Devuelve una respuesta vacia
            return null;
        });

        Handlebars.registerHelper("INCL", (datos, archivo, id?): string => {
            try {
                archivo = resolve(plantilla, "..", (<string>archivo).replace(/(?:\.\.\/)+/, "") + ".hbs");
                if (typeof id === "string") return (new Render(datos, id, archivo)).renderizarPlantilla();
                else return (new Render(datos, this._id, archivo)).renderizarPlantilla();
            } catch (e) {
                if (e instanceof ArchivoNoEncontrado) {
                    return "El archivo no existe";
                } else {
                    return "Error al compilar el archivo".concat((<Error>e).message);
                }
            }
        });

        Handlebars.registerHelper("COM", (tipo_html, ...args) => {
            let res = "";
            let comentario_inicio: string;
            let comentario_fin: string;

            if (tipo_html) {
                comentario_inicio = "<!--";
                comentario_fin = "-->";
            } else {
                comentario_inicio = "//";
                comentario_fin = "";
            }

            args.forEach((elemento) => {
                res = `${res}\n${comentario_inicio}${elemento.toString?.()}${comentario_fin}`;
            });
            return res;
        });

        /**
         * Funcion que itera todo el objeto, el primer parametro es el objeto a iterar
         */
        Handlebars.registerHelper('IT', (objeto, options): string => {
            //Comprueba que el objeto no sea undefined o no sea un array
            if (objeto === undefined || !Array.isArray(objeto)) return "La tabla no existe o no es un array de objetos";

            //Declara la respuesta
            let res = "";

            //Itera el objeto
            for (const obj of objeto) {
                //Concatena el objeto renderizado a la respuesta
                res += options.fn(obj);
            }

            //Devuelve la respuesta
            return res;
        });

        /**
         * Funcion que itera los primeros objetos, el primer parametro es el objeto a iterar,
         * el segundo el numero de objetos del array a iterar
         */
        Handlebars.registerHelper('IT-N', (objeto, nIterador, options): string => {
            //Comprueba que el objeto no sea undefined o no sea un array
            if (objeto === undefined || !Array.isArray(objeto)) return "La tabla no existe o no es un array de objetos";

            //Declara la respuesta
            let res = "";

            //Itera el array, las veces determinadas por parametro (en caso de ser un numero mayor al de objetos del array, el numero de estos seran el limite)
            for (let i = 0; i < nIterador && i < objeto.length; i++) {
                //Concatena el objeto renderizado a la respuesta
                res += options.fn(objeto[i]);
            }

            //Devuelve la respuesta
            return res;
        });

        /**
         * Funcion para iterar todos los objetos que cumplan la condicion, el primer parametro ha de ser el objeto padre que corresponde el array de objetos,
         * el segundo parametro el campo que ha de cumplir la condicion, el tercero el tipo de la condicion (==, !=, >=, <=)
         * el cuarto parametro el valor para la condicion 
         */
        Handlebars.registerHelper("IT-IF", (objeto, campo, comparador, valor, options): string => {
            //Comprueba que el objeto no sea undefined o no sea un array
            if (objeto === undefined || !Array.isArray(objeto)) return "La tabla no existe o no es un array de objetos";

            //Declara la respuesta
            let res = "";

            //Itera el array 
            for (const obj of objeto) {
                //Funcion para evaluar la expresion compuesta, por ejemplo, return 'obj["Ciudad"]' != 'Ciudad1'
                const eva = new Function(`return '${obj[campo]}' ${comparador} '${valor}'`);
                //Ejecuta la funcion, la cual devuelve la expresion y es evaluada
                if (eva()) {
                    //Concatena el objeto renderizado a la respuesta
                    res += options.fn(obj);
                }
            }

            //Devuelve la respuesta
            return res;

        });

        /**
         * Funcion para iterar todos los objetos que cumplan varias condiciones, el numero parametros del array hay de ser multiplo de tres, mas uno, que indica se cada grupo el tipo de operador.
         * Las condiciones han de ser por grupos de tres, el primer valor de ese grupo ha de ser la propiedad, el segundo valor la condicion y el tercer valor 
         */
        Handlebars.registerHelper("IT-IFM", (objeto, ...args): string => {
            //Comprueba que el objeto no sea undefined o no sea un array
            if (objeto === undefined || !Array.isArray(objeto)) return "La tabla no existe o no es un array de objetos";

            //Declara la respuesta
            let res = "";
            //Extrae el ultimo elemento del array, que es la funcion de options, pasada automaticamente por handlebars
            const options = args.slice(-1)[0];
            //Extrae todos los demas argumentos 
            let condicionales = args.slice(0, -1);

            //Comprueba si la longitud de los condicionales 
            if ((condicionales.length - 1) % 3 != 0) {
                //Devuelve un mensaje de error
                return "El objecto con los condicionales ha de ser una array y cada condicional dividirse en tres, mas el primer elemento indicando el tipo";
            }

            //Comprueba el primer argumento, en funcion del valor asigna el operador en la variable tipo
            const tipo = condicionales[0].toLowerCase() == "and" ? " && " : "|| ";
            //Modifica el valor de los condicionales eliminando el primer argumento
            condicionales = condicionales.slice(1);

            //Guarda la longitud de condicionales
            const longObjeto = condicionales.length;
            //Variable que almacenara la expresion
            let expresion = "";

            //Recorre los argumentos de tres en tres, elimina los tres argumentos finales para evitar añadir el operador
            for (let i = 0; i < longObjeto - 3; i += 3) {
                //Crea la express con los tres argumentos y concatenando al final el operador
                expresion += "'${" + condicionales[i] + "}' " + condicionales[i + 1] + " '" + condicionales[i + 2] + "'" + tipo;
            }

            //Crea la express con los tres argumentos finales
            expresion += "'${" + condicionales[longObjeto - 3] + "}' " + condicionales[longObjeto - 2] + " '" + condicionales[longObjeto - 1] + "'";


            for (const obj of objeto) {
                //Funcion para evaluar la expresion compuesta, primero compila la plantilla apartir del objeto y la expression resultante la devuelve 
                const eva = new Function(`return ${expresion.compilarPlantilla(obj)}`);
                //Ejecuta la funcion, la cual devuelve la expresion y es evaluada
                if (eva()) {
                    //Concatena el objeto renderizado a la respuesta
                    res += options.fn(obj);
                }
            }

            //Devuelve la respuesta
            return res;
        });

    }

    /**
     * Comprueba si la ruta de la plantilla existe
     * @param plantilla string, ruta de la plantilla
     * @returns la ruta absoluta de la plantilla
     */
    comprobarPlantilla(plantilla: string): string {
        //Convierte la ruta a una ruta absoluta, en caso de ser relativa 
        plantilla = resolve(plantilla);

        //Comprueba si la ruta existe y es un archivo, en caso de que alguna de las opciones no se cumpla lanza un error
        if (!existsSync(plantilla) || !lstatSync(plantilla).isFile()) {
            throw new ArchivoNoEncontrado("Error, la plantilla no existe", 400);
        }

        //Devuelve la ruta de la plantilla (ruta absoluta)
        return plantilla;
    }

    /**
     * Getter y setter de las propiedades de la clase
     */
    set datos(datos: MDatos) {
        this._datos = datos;
    }
    get datos(): MDatos {
        return this._datos;
    }
    set id(id: string) {
        this._id = id;
    }
    get value(): string {
        return this._id;
    }
    set plantilla(plantilla: string) {
        this._plantilla = this.comprobarPlantilla(plantilla);
    }
    get plantilla(): string {
        return this._plantilla;
    }

    /**
     * Renderiza la plantilla pasada por string
     * @param plantilla string, plantilla a renderizar
     * @param opciones CompileOptions, opciones de compilacion de handlebars
     * @returns string, la plantilla renderizada
     */
    renderizarTexto(plantilla: string, opciones?: CompileOptions): string {
        try {
            //Devuelve la plantilla renderizada
            return (Handlebars.compile(plantilla, opciones))(this._datos);
        }
        catch (e) {
            //En caso de error al renderizar lanza una excepcion
            throw new ErrorRenderizado("Error al generar la plantilla: " + (<Error>e).message, 500);
        }
    }

    /**
     * Renderiza una plantilla que se encuentra en un archivo
     * @param plantilla string, ruta de la plantilla
     * @param opciones CompileOptions, opciones de compilacion de handlebars
     * @returns string, la plantilla renderizada
     */
    renderizarPlantilla(plantilla?: string, opciones?: CompileOptions): string {
        try {
            //Variable que almacena la plantilla
            let datos;

            //Comprueba si la ruta de la plantilla ha sido pasada por parametro
            if (plantilla !== undefined) {
                //En caso de haber sido pasada por parametro, hace la comprobacion de la plantilla y lee su contenido y lo almacena en la variable datos
                datos = readFileSync(this.comprobarPlantilla(plantilla)).toString();
            } else {
                //En caso de no haber pasado la ruta por parametro, lee el contenido de la ruta de la clase, y lo almacena en la variable datos
                datos = readFileSync(this._plantilla).toString();
            }

            //Devuelve la plantilla renderizada
            return (Handlebars.compile(datos, opciones))(this._datos);
        }
        catch (e) {
            //En caso de error al renderizar lanza una excepcion
            throw new ErrorRenderizado("Error al generar la plantilla: " + (<Error>e).message, 500);
        }
    }
}
