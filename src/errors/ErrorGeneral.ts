/**
 * Error general para el servidor
*/

import { CODIGOS_ESTADO } from "../config/config";
import { ErrorServidor } from "./ErrorServidor";

export class ErrorGeneral extends ErrorServidor {

    constructor(msg: string = "Error al ejecutar la sentencia", codigo: CODIGOS_ESTADO = CODIGOS_ESTADO.Internal_Server_Error) {
        super(msg, codigo);
        this.name = "ErrorGeneral";
    }

}