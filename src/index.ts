import 'dotenv/config';

import { listadoTokens, logger, DB_CONFIG, CODIGOS_ESTADO } from "./controller/config";
import { bbdd_token } from "./controller/lib";
import { router as index } from "./routes/index";
import { router as tokens } from "./routes/tokens";
import { router as datos } from "./routes/datos";
import { comprobarAcceso, respuesta } from './controller/serv';

import express, { Express, Response, Request, NextFunction } from "express";

const app: Express = express();

//Middlewares para el cuerpo de las peticiones post
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Ruta principal
app.use(index);
//Ruta para adminstar los tokens
app.use("/tokens", tokens);
app.use("/datos", datos);
//Archivos estatics
app.use(comprobarAcceso, express.static(__dirname + "/public"));

//En caso de que el se pase algun error a traves de la funcion next. Captura, principalmente, los errores lanzados por express.json()
//eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    //Si el error es una instancia de SyntaxError, se envia una respuesta con el codigo 400
    if (err instanceof SyntaxError) { // express.json lanza un SyntaxError si el cuerpo tiene algun error en la sintaxis
        return respuesta(res, "Error -> " + err.message, CODIGOS_ESTADO.Bad_Request);
    }
    //Si algun otro error entra se devolvera con el codigo 500
    return respuesta(res, "Error -> " + err.message, CODIGOS_ESTADO.Internal_Server_Error);
});

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