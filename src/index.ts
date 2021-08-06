import 'dotenv/config';

import { bodyDefinido } from "./controller/serv";
import { json_a_html, ddbb_a_json } from "./controller/lib";
import { DB_CONFIG } from "./config/Config"

import express, { Express, Request, Response } from "express";
const app: Express = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use(express.static(__dirname + "/public"))


app.post("/json_html", bodyDefinido, async (req: Request, res: Response) => {
    if (req.body.mensaje) {
        try {
            const html = await json_a_html(req.body.mensaje, req.body.id, "dist/templates/temp1.hbs");
            res.send(html);
        } catch (e) {
            res.sendStatus(400);
        }
    } else {
        return res.status(400).send("El json ha de componerse de otra forma");
    }
});

app.get("/ddbb_json", bodyDefinido, async (req: Request, res: Response) => {
    try {

        const html = await json_a_html(await ddbb_a_json(DB_CONFIG));
        return res.send(html);

    } catch (e) {
        console.log(e);
        return res.status(400).send("Algo ha fallado, el que ni puta idea");
    }
})

app.get("/json", bodyDefinido, async (req: Request, res: Response) => {
    try {

        const json = await ddbb_a_json(DB_CONFIG);
        return res.send(json);

    } catch (e) {
        console.log(e);
        return res.status(400).send("Algo ha fallado, el que ni puta idea");
    }
})


app.listen(3000);