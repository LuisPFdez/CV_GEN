import 'dotenv/config';

import { listadoTokens, logger, DB_CONFIG } from "./controller/config";
import { bbdd_token } from "./controller/lib";
import { router as index } from "./routes/index";
import { router as tokens } from "./routes/tokens";
import { comprobarAcceso } from './controller/serv';

import express, { Express } from "express";

const app: Express = express();

//Middlewares para el cuerpo de las peticiones post
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Ruta principal
app.use(index);
//Ruta para adminstar los tokens
app.use("/tokens", tokens);
//Archivos estatics
app.use( comprobarAcceso, express.static(__dirname + "/public"));

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