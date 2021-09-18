
import { existsSync, lstatSync, readFileSync, } from "fs"
import Handlebars from "handlebars";
import { join, resolve } from "path"
import {ArchivoNoEncontrado} from "../errors/ArchivoNoEncontrado"

/**
 Tipo que definie un objecto compuesto por un string como clave y un array como valor, el array a su vez se compone de otro objeto
 */
export type MDatos = Record<string, Array<Record<string, string>>>;

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
     * Constructor de la clase
     * @param datos MDatos, objeto de determinadas caracteristicas
     * @param id String, identificador del grupo de datos
     * @param plantilla String, ruta de la plantilla que se va a renderizar
     */
    constructor(datos: MDatos, id: string, plantilla: string = "dist/templates/temp1.hbs") {
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
         * Funcion que itera todo el objeto, el primer parametro es el objeto a iterar
         */
        Handlebars.registerHelper('IT', (objeto, options): string => {
            //Comprueba que el objeto no sea undefined o no sea un array
            if (objeto === undefined || !Array.isArray(objeto)) return "La tabla no existe o no es un array de objetos";

            //Declara la respuesta
            let res: string = "";

            //Itera el objeto
            for (let obj of objeto) {
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
            let res: string = "";

            //Itera el array, las veces determinadas por parametro (en caso de ser un numero mayor al de objetos del array, el numero de estos seran el limite)
            for (var i = 0; i < nIterador && i < objeto.length; i++) {
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
            let res: string = "";

            //Itera el array 
            for (let obj of objeto) {
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
        
    }

    /**
     * Comprueba si la ruta de la plantilla existe
     * @param plantilla string, ruta de la plantilla
     * @returns la ruta absoluta de la plantilla
     */
    comprobarPlantilla(plantilla: string): string {
        //Convierte la ruta a una ruta absoluta, en caso de ser relativa 
        plantilla = join(resolve(plantilla));

        //Comprueba si la ruta existe y es un archivo, en caso de que alguna de las opciones no se cumpla lanza un error
        if (!existsSync(plantilla) || !lstatSync(plantilla).isFile()) {
            throw new ArchivoNoEncontrado("Error, la plantilla no existe");
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
            //En caso de error al renderizar devuelve un mensaje con el mensaje de error
            return "Error al generar la plantilla:\n " +(<Error> e).message;
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
            };

            //Devuelve la plantilla renderizada
            return (Handlebars.compile(datos, opciones))(this._datos);
        }
        catch (e) {
            //En caso de error al renderizar devuelve un mensaje con el mensaje de error
            return "Error al generar la plantilla:\n " + (<Error> e).message;
        }
    }
}
