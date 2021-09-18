import 'dotenv/config';

import { bodyDefinido } from "./controller/serv";
import { json_a_html, ddbb_a_json } from "./controller/lib";

import express, { Express, Request, Response } from "express";
import { ConnectionConfig } from 'mysql';

const app: Express = express();

const respuesta = (res: Response, mensaje: String, codigoError: number) => {
    res.status(codigoError).json(
        { mensaje: mensaje, codigoError: codigoError }
    );
}

const DB_CONFIG: ConnectionConfig = {
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST
}

const rutaPlantillas = "dist/templates/"
const plantillaPre = rutaPlantillas+"temp1.hbs";

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use(express.static(__dirname + "/public"))


app.post("/json_html", bodyDefinido, async (req: Request, res: Response) => {
    if (req.body.mensaje) {

        const id: string = req.body.id || "ID";
        const plantilla: string = rutaPlantillas + req.body.plantilla || plantillaPre;

        try {
            const html = await json_a_html(req.body.mensaje, id, plantilla );
            return respuesta(res, html, 200);
        } catch (e) {
            return respuesta(res, "Fallo al renderizar el mensaje. Error" + (<Error>e).message, 500);
        }
    } else {
        return respuesta(res, "El cuerpo ha de contener la propiedad mensaje", 400);
    }
});

app.get("/ddbb_json", bodyDefinido, async (req: Request, res: Response) => {
    try {

        const plantilla: string = rutaPlantillas + <string> req.query.plantilla || plantillaPre;

        const html = await json_a_html(await ddbb_a_json(DB_CONFIG), "ID", plantilla);
        // return respuesta(res, html, 200);
        res.send(html)

    } catch (e) {
        return respuesta(res, "Fallo al renderizar el mensaje. Error: " + (<Error>e).message, 500);
    }
})

app.get("/json", bodyDefinido, async (req: Request, res: Response) => {
    try {

        const json = await ddbb_a_json(DB_CONFIG);
        return res.send(json);

    } catch (e) {
        return respuesta(res, "Fallo al renderizar el mensaje. Error: " + (<Error>e).message, 500);
    }
})


app.listen(process.env.PORT);