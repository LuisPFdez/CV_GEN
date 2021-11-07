import 'dotenv/config';

import { Logger } from './controller/logger';
import { bbdd_token } from "./controller/lib";
import { router as index } from "./routes/index";
import { router as tokens } from "./routes/tokens";

import express, { Express } from "express";
import { ConnectionConfig } from "mysql";

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

const app: Express = express();

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

//Middlewares para el cuerpo de las peticiones post
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Archivos estatics
app.use(express.static(__dirname + "/public"));

//Ruta principal
app.use(index);
//Ruta para adminstar los tokens
app.use("/tokens", tokens);

//Inicia el servidor
app.listen(process.env.PORT, async () => {
    logger.log_archivo(`Iniciado servidor en el puerto ${process.env.PORT}`);
    //Obtiene los tokens validos de la base de datos
    listadoTokens.sustituirValor(await bbdd_token(DB_CONFIG));
    //Establece un intervalo para actualizar cada 80 horas los valores del listadoTokens
    setInterval(async () => {
        //Obtiene los tokens validos de la base de datos
        listadoTokens.sustituirValor(await bbdd_token(DB_CONFIG));
    }, 1000 * 60 * 60 * 80); // Se establece el tiempo del intervalo en una operacion para facilitar el ajuste del tiempo
});