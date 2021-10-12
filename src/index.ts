import 'dotenv/config';

import { Logger } from './controller/logger';
import { router as index } from "./routes/index";

import express, { Express } from "express";

//Exporta la variable logger para el manejo de los logs
export const logger = new Logger();

const app: Express = express();

//Middlewares para el cuerpo de las peticiones post
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Archivos estatics
app.use(express.static(__dirname + "/public"));

//Ruta principal
app.use(index);

//Inicia el servidor
app.listen(process.env.PORT, () => {
    logger.log_archivo(`Iniciado servidor en el puerto ${process.env.PORT}`);
});