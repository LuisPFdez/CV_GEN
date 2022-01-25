/**
 * Error para el renderizado de handlebars
*/

import { CODIGOS_ESTADO } from "../config/config";
import { ErrorServidor } from "./ErrorServidor";

export class ErrorRenderizado extends ErrorServidor{

    constructor(msg: string = "Error al renderizar", codigo: CODIGOS_ESTADO = CODIGOS_ESTADO.Internal_Server_Error) {
        super(msg, codigo);
        this.name = "MysqlError";
    }

}