/**
 * Error para el renderizado de handlebars
*/

import { ErrorServidor } from "./ErrorServidor";

export class ErrorRenderizado extends ErrorServidor{

    constructor(msg: string = "Error al renderizar", codigo: number = 500) {
        super(msg, codigo);
        this.name = "MysqlError";
    }

}