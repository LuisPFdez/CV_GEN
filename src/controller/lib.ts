/**
 * @file Archivo que permite el procesado de datos, como convertir datos de una base de datos a JSON o un HTML en PDF
 */
import { Render, MDatos } from "./render";
import { SpawnOptions, spawnSync } from "child_process";
import { createConnection, ConnectionConfig, MysqlError } from "mysql";
import { promisify } from "util";
import { ErrorMysql } from "../errors/ErrorMysql";

/**
 * Funcion que se encarga de convertir los datos de las tablas de una base de datos a json
 * @param config ConnectionConfig, configuracion para la conexion a la base de datos
 * @param esquema String[], tablas de la base de datos de las cuales se obtendran los datos
 * @returns MDatos, json con los datos de la base de datos
 */
async function bbdd_a_json(config: ConnectionConfig, esquema?: string[]): Promise<MDatos> {
    //El modelo permite definir en que tablas se ha de buscar
    const modelo = esquema || ["Adicional", "Datos", "Experiencia", "Formacion", "Habilidades", "Idiomas"];
    //JSON que será devuelto, contiene la informacion de la base de datos en forma JSON;
    const json: MDatos = {};
    //Las consultas de la base de datos se haran de forma asincrona, en este array se guardan todas esas consultas.
    const queries: Promise<unknown>[] = [];
    //Crea la conexion
    const conexion = createConnection(config);
    //Establece la funcion conexion.query para permitir el uso de promesas, es necesario vincularla al objeto conexion para que funcione 
    const query = promisify(conexion.query).bind(conexion);

    //Inicia la conexion, en caso de error lo lanza
    conexion.connect();
    //Recorre todas las tablas del modelo
    modelo.forEach((tabla) => {
        //Query para cada tabla;
        const stat = `Select * from ${tabla}`;
        //Se añade la consula al array de consultas
        queries.push(query(stat).then((datos) => {
            //En caso de que se ejecute correctamente se almacenan todos los datos en la prpiedad correspondiente
            json[tabla] = [];
            for (const valor of datos as []) { //Recorre el array de datos, cada posicion corresponde a una linea de la tabla
                //Añade el objeto que correponde a la fila, para eliminar RowDataPacket del objeto, se pasa a string y luego a JSON
                json[tabla].push(JSON.parse(JSON.stringify(valor)));
            }
        }).catch((error: MysqlError) => {
            //En caso de error se lanza un nuevo error, con el nombre y el mensaje del error capturado
            throw new ErrorMysql("Error (" + error.name + "): " + error.message, 500);
        }));
    });
    //Espera a que todas las consultas de la base de datos terminen
    await Promise.all(queries);
    //Destruye la conexion con la base de datos, evita las operaciones restates
    conexion.end();
    //Devuelve el objeto json.
    return json;
}

/**
 * Funcion que rendenderiza la plantilla con los datos pasados por argumentos
 * @param json MDatos, json de datos con los que se renderizara la plantilla
 * @param id String, identificador del grupo de datos
 * @param plantilla String, ruta de la plantilla que se va a renderizar
 * @returns string, plantilla renderizada
 */
async function json_a_html(json: MDatos, id: string = "ID", plantilla: string = "dist/templates/temp1.hbs"): Promise<string> {
    //Crea el objeto render 
    const render = new Render(json, id, plantilla);
    //Devuelve la plantilla renderizada
    return render.renderizarPlantilla();
}

/**
 * Convierte el html en pdf, por defecto con el programa wkhtmltopdf, es posible cambiar el programa con las variables de entorno
 * @param argumentos Array, argumentos para ejecutar el programa, cada argumento es una posicion del array, por defecto deberá de ser un
 * array con dos elementos, el primer valor la ruta al html y el segundo la ruta donde se guardará el pdf generado.
 * @param opciones, SpawnOptions, opciones para hacer la llamada al subproceso.
 * @param callback, funcion, recibe por parametros error ( number o string ) y no devuelve nada, opcional. Al ser una funcion asincrona es 
 * recomendable que se lanze una excepcion para capturarla como promesa.
 */
async function html_a_pdf(argumentos: Array<string>, opciones: SpawnOptions = {}, callback?: (error: number | string) => void): Promise<void> {
    //Funcion para manejar los errores en caso de no haber pasado pasado la funcion por parametro se asigna una funcion por defecto
    callback = callback || function (error: number | string): void {
        throw Error("La aplicacion ha fallado, numero o mensaje de error: " + error);
    };

    //Ejecuta un subproceso, si no han ninguna variable de entorno ejecuta el programa por defecto, wkhtmltopdf
    const proceso = spawnSync(process.env.PDF_PROG!, argumentos, opciones);

    //Al finalizar compruba si la apliacion ha tenido algun error al ejecutarse o el programa ha salido un codigo distinto de 0
    if (proceso.error) {
        //Le pasa el mensaje del error al callback
        callback(proceso.error.message);
    } else if (proceso.status) {
        //Le pasa el numero de salida de la aplicacion al callback
        callback(proceso.status);
    }

    //Devuelve una resolucion para la funcion (void)
    return Promise.resolve();

}

export { bbdd_a_json, json_a_html, html_a_pdf };