import 'dotenv/config';

import { listadoTokens, logger, DB_CONFIG, CODIGOS_ESTADO } from "./controller/config";
import { bbdd_token } from "./controller/lib";
import { router as index } from "./routes/index";
import { router as tokens } from "./routes/tokens";
import { router as datos } from "./routes/datos";
import { comprobarAcceso, respuesta } from './controller/serv';

import express, { Express, Response, Request, NextFunction } from "express";

import cluster from 'cluster';
import { cpus } from "os";

//Sistema para el manejo de la aplicacion en varios nucleos, a traves de la api "cluster".
//Tambien permite reiniciar la aplicacion en caso de error. 
if (cluster.isPrimary) {
    //Variable que contenie el numero de ramificaciones que se va ha hacer. (Cada ramificacion correponde al uso de un nucleo);
    //Por defecto usa la mitad de los nucleos
    let env_cpu: number = cpus().length / 2;
    //Comprueba si el numero es un entero.
    if (Number.isInteger(Number(process.env.CPU))) {
        //En caso de serlo establece env_cpu con el valor del la variable de entorno
        env_cpu = Number(process.env.CPU);
        //Comprueba si el valor de la variable es un porcentaje
    } else if (process.env.CPU && /^[0-9]+%$/.test(process.env.CPU)) {
        //Con parseInt obtiene solo el valor numerico. Luego divide el valor numerico entre 100
        const porcentaje = parseInt(process.env.CPU) / 100;
        //Multiplica el total de nucleos del procesador por el porcentaje. Luego trunca los decimales y lo asigna a env_cpu
        env_cpu = Math.trunc(cpus().length * porcentaje);
    }

    //En caso de que la variable tenga mas numero de nucleos que el procesador asignara todos los nucleos de este
    if (env_cpu > cpus().length ) env_cpu = cpus().length;
    //En caso de que la variable sea menor a 1, la establece a 1
    else if (env_cpu < 1) env_cpu = 1;

    //Crea ramificaciones del proceso primario.
    for (let i = 0; i < env_cpu; i++) {
        cluster.fork();
    }

    //En caso de que alguno de los procesos finalize creara una nueva ramificacion
    cluster.on('exit', () => {
        cluster.fork();
    });

} else {
    //En caso de que alguna excepcion no contrala salte. 
    process.on("uncaughtException", (e: Error) => {
        //Registra el error en el archivo
        logger.error_archivo("Error, excepción no controlada", {}, e);
        //Termina el proceso con un codigo de error 1
        process.exit(1);
    });

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
}
