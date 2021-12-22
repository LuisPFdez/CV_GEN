/**
 * Error para las conexiones de MySQL
*/

import { CODIGOS_ESTADO } from "../controller/config";
import { ErrorServidor } from "./ErrorServidor";

export class ErrorMysql extends ErrorServidor {

    constructor(msg: string = "Error al ejecutar la sentencia", codigo: CODIGOS_ESTADO = CODIGOS_ESTADO.Internal_Server_Error) {
        super(msg, codigo);
        this.name = "ErrorMysql";
    }

}